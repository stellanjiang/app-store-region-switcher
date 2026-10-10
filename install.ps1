# 中国大陆的 Windows 用这一条。不需要安装 Python。
# 开着代理或没开代理都一样。登录后自动启动，只处理 apps.apple.com。
param(
  [switch]$Uninstall
)

$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$TaskName = 'AppStoreRegionSwitcher'
$Dest = Join-Path $env:LOCALAPPDATA 'app-store-region-switcher'
$Script = Join-Path $Dest 'direct-proxy.ps1'
$SourceUrl = 'https://raw.githubusercontent.com/stellanjiang/app-store-region-switcher/main/direct-proxy.ps1'

function Stop-ProxyTask {
  schtasks /End /TN $TaskName 2>$null | Out-Null
  schtasks /Delete /TN $TaskName /F 2>$null | Out-Null
  $startupCmd = Join-Path ([Environment]::GetFolderPath('Startup')) 'AppStoreRegionSwitcher.cmd'
  if (Test-Path $startupCmd) { Remove-Item $startupCmd -Force }
  Get-CimInstance Win32_Process -Filter "Name = 'powershell.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -like '*direct-proxy.ps1*' } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
}

if ($Uninstall -or $env:ASR_UNINSTALL -eq '1') {
  Stop-ProxyTask
  Write-Host '已停止，并取消登录时自动启动。'
  exit 0
}

New-Item -ItemType Directory -Force -Path $Dest | Out-Null
if ($PSScriptRoot -and (Test-Path (Join-Path $PSScriptRoot 'direct-proxy.ps1'))) {
  Copy-Item (Join-Path $PSScriptRoot 'direct-proxy.ps1') $Script -Force
} else {
  $client = New-Object System.Net.WebClient
  $client.Proxy = $null
  $client.DownloadFile($SourceUrl, $Script)
}

$argument = "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$Script`""
Stop-ProxyTask
try {
  $action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument $argument
  $trigger = New-ScheduledTaskTrigger -AtLogOn
  $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)
  Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Force | Out-Null
  Start-ScheduledTask -TaskName $TaskName
} catch {
  $startupCmd = Join-Path ([Environment]::GetFolderPath('Startup')) 'AppStoreRegionSwitcher.cmd'
  [System.IO.File]::WriteAllText($startupCmd, "@echo off`r`npowershell.exe $argument`r`n", [System.Text.Encoding]::Default)
  Start-Process -FilePath 'powershell.exe' -ArgumentList $argument -WindowStyle Hidden
}

$health = New-Object System.Net.WebClient
$health.Proxy = $null
for ($i = 0; $i -lt 12; $i++) {
  try {
    $body = $health.DownloadString('http://127.0.0.1:17890/health')
    if ($body -match '"ok"\s*:\s*true') {
      Write-Host '已在后台运行。打开浏览器扩展即可切换地区。以后登录也会自动启动。'
      Write-Host '停止并取消自启：powershell -NoProfile -ExecutionPolicy Bypass -File install.ps1 -Uninstall'
      exit 0
    }
  } catch {}
  Start-Sleep -Milliseconds 400
}

Write-Host "已安装，但 127.0.0.1:17890 还没有响应。日志：$Dest\proxy.log"
exit 1
