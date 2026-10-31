$ErrorActionPreference = 'Stop'
$taskDirectory = $PSScriptRoot
$taskUrl = 'http://127.0.0.1:8765/'
$taskReady = $false
try {
    $taskResponse = Invoke-WebRequest -Uri $taskUrl -TimeoutSec 2
    $taskReady = $taskResponse.StatusCode -eq 200 -and $taskResponse.Content.Contains('のこりノート')
    if (-not $taskReady) { throw 'Port 8765 is used by another application.' }
} catch {
    if ($_.Exception.Message -eq 'Port 8765 is used by another application.') { throw }
}
if (-not $taskReady) {
    $taskNode = (Get-Command node -ErrorAction Stop).Source
    Start-Process -FilePath $taskNode -ArgumentList 'serve.mjs' -WorkingDirectory $taskDirectory -WindowStyle Hidden
    for ($taskAttempt = 0; $taskAttempt -lt 20; $taskAttempt++) {
        try {
            $taskResponse = Invoke-WebRequest -Uri $taskUrl -TimeoutSec 1
            if ($taskResponse.StatusCode -eq 200 -and $taskResponse.Content.Contains('のこりノート')) { $taskReady = $true; break }
        } catch {}
        Start-Sleep -Milliseconds 200
    }
}
if (-not $taskReady) { throw 'The local preview could not start. Run node serve.mjs to see the error.' }
Start-Process $taskUrl
