#!/usr/bin/env python3
"""只转发 apps.apple.com。macOS 自带 Python 即可运行，不需要 Node。"""

import json
import os
import socket
import threading
import time
import urllib.request

for key in ("http_proxy", "https_proxy", "HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "all_proxy"):
    os.environ.pop(key, None)

LISTEN_HOST = "127.0.0.1"
LISTEN_PORT = int(os.environ.get("ASR_PROXY_PORT", "17890"))
FALLBACK_IPS = ["151.101.3.6", "151.101.67.6", "151.101.131.6", "151.101.195.6"]
upstream_ips = list(FALLBACK_IPS)
upstream_lock = threading.Lock()


def allowed_host(host):
    return host == "apps.apple.com" or host.endswith(".apps.apple.com")


def refresh_ips():
    global upstream_ips
    request = urllib.request.Request("https://dns.google/resolve?name=apps.apple.com&type=A")
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    try:
        with opener.open(request, timeout=5) as response:
            data = json.loads(response.read().decode())
        found = []
        for record in data.get("Answer") or []:
            ip = record.get("data")
            if record.get("type") == 1 and isinstance(ip, str) and not ip.startswith(("28.", "127.")):
                found.append(ip)
        if found:
            with upstream_lock:
                upstream_ips = found
    except Exception:
        return


def current_ips():
    with upstream_lock:
        return list(upstream_ips)


def connect_any(ips, port):
    error = None
    for ip in ips:
        try:
            return socket.create_connection((ip, port), timeout=8)
        except OSError as exc:
            error = exc
    raise OSError(error or "no upstream")


def pump(source, target):
    try:
        while True:
            data = source.recv(65536)
            if not data:
                break
            target.sendall(data)
    except OSError:
        pass
    finally:
        try:
            target.shutdown(socket.SHUT_WR)
        except OSError:
            pass


def send_text(client, status, body):
    payload = body.encode()
    header = (
        f"HTTP/1.1 {status}\r\n"
        "Content-Type: text/plain; charset=utf-8\r\n"
        f"Content-Length: {len(payload)}\r\n"
        "Connection: close\r\n\r\n"
    )
    client.sendall(header.encode() + payload)


def handle(client):
    try:
        client.settimeout(15)
        buffer = b""
        while b"\r\n\r\n" not in buffer and len(buffer) < 8192:
            chunk = client.recv(1024)
            if not chunk:
                client.close()
                return
            buffer += chunk
        head, _, rest = buffer.partition(b"\r\n\r\n")
        line = head.split(b"\r\n", 1)[0].decode("latin1", "replace")
        parts = line.split(" ")
        if len(parts) < 2:
            client.close()
            return
        method, target = parts[0].upper(), parts[1]
        if method == "GET" and target.split("?", 1)[0] == "/health":
            body = json.dumps({"ok": True, "ips": current_ips()}).encode()
            header = (
                "HTTP/1.1 200 OK\r\n"
                "Content-Type: application/json\r\n"
                f"Content-Length: {len(body)}\r\n"
                "Connection: close\r\n\r\n"
            )
            client.sendall(header.encode() + body)
            client.close()
            return
        if method != "CONNECT":
            send_text(client, "405 Method Not Allowed", "apps.apple.com direct proxy")
            client.close()
            return
        host, separator, port_text = target.partition(":")
        port = int(port_text) if separator and port_text.isdigit() else 443
        if not allowed_host(host):
            send_text(client, "403 Forbidden", "forbidden")
            client.close()
            return
        try:
            remote = connect_any(current_ips(), port)
        except OSError:
            send_text(client, "502 Bad Gateway", "no upstream")
            client.close()
            return
        client.sendall(b"HTTP/1.1 200 Connection Established\r\n\r\n")
        if rest:
            remote.sendall(rest)
        client.settimeout(None)
        remote.settimeout(None)
        threading.Thread(target=pump, args=(client, remote), daemon=True).start()
        pump(remote, client)
    except Exception:
        try:
            client.close()
        except OSError:
            pass


def refresh_loop():
    while True:
        time.sleep(60)
        refresh_ips()


def main():
    refresh_ips()
    threading.Thread(target=refresh_loop, daemon=True).start()
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server.bind((LISTEN_HOST, LISTEN_PORT))
    server.listen(64)
    print(f"apps.apple.com direct proxy on {LISTEN_HOST}:{LISTEN_PORT} -> {','.join(current_ips())}", flush=True)
    while True:
        client, _ = server.accept()
        threading.Thread(target=handle, args=(client,), daemon=True).start()


if __name__ == "__main__":
    main()
