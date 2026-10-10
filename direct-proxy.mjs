/**
 * 只转发 apps.apple.com。
 * 启动：node direct-proxy.mjs
 * 监听 127.0.0.1:17890，不改系统全局代理。
 */
import http from 'node:http';
import net from 'node:net';

const LISTEN_HOST = '127.0.0.1';
const LISTEN_PORT = Number(process.env.ASR_PROXY_PORT || 17890);
const FALLBACK_IPS = ['151.101.3.6', '151.101.67.6', '151.101.131.6', '151.101.195.6'];

let upstreamIps = [...FALLBACK_IPS];

function allowedHost(host) {
  return host === 'apps.apple.com' || host.endsWith('.apps.apple.com');
}

async function refreshIps() {
  try {
    const response = await fetch('https://dns.google/resolve?name=apps.apple.com&type=A', {
      signal: AbortSignal.timeout(5000),
    });
    const data = await response.json();
    const found = (data.Answer || [])
      .filter((record) => record.type === 1 && typeof record.data === 'string')
      .map((record) => record.data)
      .filter((ip) => !ip.startsWith('28.') && !ip.startsWith('127.'));
    if (found.length > 0) upstreamIps = found;
  } catch {
    // 保留上一次可用地址
  }
}

function connectAny(ips, port) {
  return new Promise((resolve, reject) => {
    const queue = [...ips];
    const attempt = () => {
      const ip = queue.shift();
      if (!ip) {
        reject(new Error('no upstream'));
        return;
      }
      const socket = net.connect({ host: ip, port });
      const fail = () => {
        socket.destroy();
        attempt();
      };
      socket.once('error', fail);
      socket.once('connect', () => {
        socket.removeListener('error', fail);
        resolve(socket);
      });
    };
    attempt();
  });
}

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true, ips: upstreamIps }));
    return;
  }
  res.writeHead(405, { 'content-type': 'text/plain; charset=utf-8' });
  res.end('apps.apple.com direct proxy');
});

server.on('connect', (req, clientSocket, head) => {
  const [host, portText] = String(req.url || '').split(':');
  const port = Number(portText || 443);
  if (!allowedHost(host)) {
    clientSocket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
    clientSocket.destroy();
    return;
  }

  connectAny(upstreamIps, port)
    .then((upstream) => {
      clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
      if (head && head.length) upstream.write(head);
      upstream.pipe(clientSocket);
      clientSocket.pipe(upstream);
      const closeBoth = () => {
        upstream.destroy();
        clientSocket.destroy();
      };
      upstream.on('error', closeBoth);
      clientSocket.on('error', closeBoth);
    })
    .catch(() => {
      clientSocket.write('HTTP/1.1 502 Bad Gateway\r\n\r\n');
      clientSocket.destroy();
    });
});

await refreshIps();
setInterval(refreshIps, 60_000);

server.listen(LISTEN_PORT, LISTEN_HOST, () => {
  console.log(`apps.apple.com direct proxy on ${LISTEN_HOST}:${LISTEN_PORT} -> ${upstreamIps.join(',')}`);
});
