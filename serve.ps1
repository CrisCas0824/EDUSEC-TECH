$port = 8080
$root = Join-Path $PSScriptRoot "public"

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host "Servidor corriendo en http://localhost:$port/"
Write-Host "Presiona Ctrl+C para detener"
Start-Process "http://localhost:$port/"

while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $req = $ctx.Request
  $res = $ctx.Response

  $path = $req.Url.LocalPath
  if ($path -eq "/") { $path = "/index.html" }
  $file = Join-Path $root $path.TrimStart("/")

  if (Test-Path $file -PathType Leaf) {
    $ext = [System.IO.Path]::GetExtension($file)
    $mime = @{
      ".html" = "text/html"; ".css" = "text/css"; ".js" = "application/javascript"
      ".png" = "image/png"; ".jpg" = "image/jpeg"; ".jpeg" = "image/jpeg"
      ".gif" = "image/gif"; ".svg" = "image/svg+xml"; ".ico" = "image/x-icon"
      ".json" = "application/json"; ".pdf" = "application/pdf"
    }
    $contentType = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { "application/octet-stream" }
    $bytes = [System.IO.File]::ReadAllBytes($file)
    $res.ContentType = $contentType
    $res.ContentLength64 = $bytes.Length
    $res.OutputStream.Write($bytes, 0, $bytes.Length)
  } else {
    $res.StatusCode = 404
    $msg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
    $res.OutputStream.Write($msg, 0, $msg.Length)
  }
  $res.OutputStream.Close()
}
