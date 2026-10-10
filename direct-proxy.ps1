# 只转发 apps.apple.com。使用 Windows 自带的 PowerShell，不需要 Python。
$ErrorActionPreference = 'Stop'

if (-not ('AppleDirectProxy' -as [type])) {
  Add-Type -TypeDefinition @'
using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;

public static class AppleDirectProxy {
  static readonly object Gate = new object();
  static string[] Ips = new string[] {
    "151.101.3.6", "151.101.67.6", "151.101.131.6", "151.101.195.6"
  };

  public static void Run(int port, string logPath) {
    try {
      ServicePointManager.SecurityProtocol = (SecurityProtocolType)3072;
    } catch {}
    Log(logPath, "starting");
    Refresh(logPath);
    Thread refresh = new Thread(delegate() {
      while (true) {
        Thread.Sleep(60000);
        Refresh(logPath);
      }
    });
    refresh.IsBackground = true;
    refresh.Start();

    TcpListener listener = new TcpListener(IPAddress.Loopback, port);
    listener.Start();
    Log(logPath, "apps.apple.com direct proxy on 127.0.0.1:" + port);
    while (true) {
      TcpClient client = listener.AcceptTcpClient();
      Thread worker = new Thread(delegate(object state) {
        Handle((TcpClient)state, logPath);
      });
      worker.IsBackground = true;
      worker.Start(client);
    }
  }

  static void Refresh(string logPath) {
    try {
      WebClient client = new WebClient();
      client.Proxy = null;
      string json = client.DownloadString("https://dns.google/resolve?name=apps.apple.com&type=A");
      MatchCollection matches = Regex.Matches(json, "\"data\"\\s*:\\s*\"(\\d{1,3}(?:\\.\\d{1,3}){3})\"");
      List<string> found = new List<string>();
      foreach (Match match in matches) {
        string ip = match.Groups[1].Value;
        if (ip.StartsWith("28.") || ip.StartsWith("127.")) continue;
        found.Add(ip);
      }
      if (found.Count > 0) {
        lock (Gate) { Ips = found.ToArray(); }
      }
    } catch (Exception ex) {
      Log(logPath, "dns refresh skipped: " + ex.Message);
    }
  }

  static string[] CurrentIps() {
    lock (Gate) { return (string[])Ips.Clone(); }
  }

  static bool Allowed(string host) {
    host = (host ?? "").Trim().ToLowerInvariant();
    return host == "apps.apple.com" || host.EndsWith(".apps.apple.com");
  }

  static TcpClient ConnectAny(string[] ips, int port) {
    foreach (string ip in ips) {
      TcpClient client = new TcpClient();
      try {
        IAsyncResult result = client.BeginConnect(ip, port, null, null);
        if (!result.AsyncWaitHandle.WaitOne(8000)) {
          client.Close();
          continue;
        }
        client.EndConnect(result);
        return client;
      } catch {
        try { client.Close(); } catch {}
      }
    }
    return null;
  }

  static void Handle(TcpClient client, string logPath) {
    try {
      client.ReceiveTimeout = 15000;
      NetworkStream stream = client.GetStream();
      byte[] data = new byte[8192];
      int length = 0;
      int headerEnd = -1;
      while (length < data.Length && headerEnd < 0) {
        int read = stream.Read(data, length, data.Length - length);
        if (read <= 0) break;
        length += read;
        headerEnd = Find(data, length);
      }
      if (headerEnd < 0) {
        client.Close();
        return;
      }
      string header = Encoding.ASCII.GetString(data, 0, headerEnd);
      string line = header.Split(new char[] { '\r', '\n' })[0];
      string[] parts = line.Split(new char[] { ' ' });
      if (parts.Length < 2) {
        client.Close();
        return;
      }
      string method = parts[0].ToUpperInvariant();
      string target = parts[1];
      int restStart = headerEnd + 4;
      int restLength = length - restStart;
      if (method == "GET" && target.Split(new char[] { '?' })[0] == "/health") {
        string[] ips = CurrentIps();
        StringBuilder body = new StringBuilder();
        body.Append("{\"ok\":true,\"ips\":[");
        for (int i = 0; i < ips.Length; i++) {
          if (i > 0) body.Append(',');
          body.Append('"').Append(ips[i]).Append('"');
        }
        body.Append("]}");
        byte[] payload = Encoding.UTF8.GetBytes(body.ToString());
        string response = "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: " + payload.Length + "\r\nConnection: close\r\n\r\n";
        byte[] head = Encoding.ASCII.GetBytes(response);
        stream.Write(head, 0, head.Length);
        stream.Write(payload, 0, payload.Length);
        client.Close();
        return;
      }
      if (method != "CONNECT") {
        WriteStatus(stream, "405 Method Not Allowed");
        client.Close();
        return;
      }
      string host = target;
      int port = 443;
      int colon = target.LastIndexOf(':');
      if (colon > 0) {
        host = target.Substring(0, colon);
        int parsed;
        if (int.TryParse(target.Substring(colon + 1), out parsed)) port = parsed;
      }
      if (!Allowed(host)) {
        WriteStatus(stream, "403 Forbidden");
        client.Close();
        return;
      }
      TcpClient remote = ConnectAny(CurrentIps(), port);
      if (remote == null) {
        WriteStatus(stream, "502 Bad Gateway");
        client.Close();
        return;
      }
      byte[] established = Encoding.ASCII.GetBytes("HTTP/1.1 200 Connection Established\r\n\r\n");
      stream.Write(established, 0, established.Length);
      NetworkStream remoteStream = remote.GetStream();
      if (restLength > 0) remoteStream.Write(data, restStart, restLength);
      client.ReceiveTimeout = 0;
      remote.ReceiveTimeout = 0;
      Thread pump = new Thread(delegate() { Pump(stream, remoteStream); });
      pump.IsBackground = true;
      pump.Start();
      Pump(remoteStream, stream);
      try { remote.Close(); } catch {}
      try { client.Close(); } catch {}
    } catch (Exception ex) {
      Log(logPath, "connection closed: " + ex.Message);
      try { client.Close(); } catch {}
    }
  }

  static void Pump(Stream from, Stream to) {
    try {
      byte[] buffer = new byte[65536];
      int read;
      while ((read = from.Read(buffer, 0, buffer.Length)) > 0) {
        to.Write(buffer, 0, read);
        to.Flush();
      }
    } catch {}
  }

  static void WriteStatus(NetworkStream stream, string status) {
    byte[] payload = Encoding.ASCII.GetBytes(status);
    string response = "HTTP/1.1 " + status + "\r\nContent-Length: " + payload.Length + "\r\nConnection: close\r\n\r\n";
    byte[] head = Encoding.ASCII.GetBytes(response);
    stream.Write(head, 0, head.Length);
    stream.Write(payload, 0, payload.Length);
  }

  static int Find(byte[] data, int length) {
    for (int i = 0; i + 3 < length; i++) {
      if (data[i] == 13 && data[i + 1] == 10 && data[i + 2] == 13 && data[i + 3] == 10) return i;
    }
    return -1;
  }

  static void Log(string path, string message) {
    try {
      if (string.IsNullOrEmpty(path)) {
        Console.WriteLine(message);
        return;
      }
      File.AppendAllText(path, DateTime.Now.ToString("s") + " " + message + Environment.NewLine);
    } catch {}
  }
}
'@
}

$port = 17890
if ($env:ASR_PROXY_PORT) { $port = [int]$env:ASR_PROXY_PORT }
$logDir = Join-Path $env:LOCALAPPDATA 'app-store-region-switcher'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$log = Join-Path $logDir 'proxy.log'
[AppleDirectProxy]::Run($port, $log)
