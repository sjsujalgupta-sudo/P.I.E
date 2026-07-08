@echo off
setlocal
set "PROJECT_ROOT=%~dp0"
set "ZIP_PATH=%PROJECT_ROOT%DataVault-Share-Package.zip"

echo Creating share package...
echo This excludes node_modules, .next, .git, and log files so the zip stays smaller.

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$root = '%PROJECT_ROOT%'.TrimEnd('\');" ^
  "$zip = '%ZIP_PATH%';" ^
  "$temp = Join-Path $env:TEMP ('DataVault-Share-' + [guid]::NewGuid());" ^
  "New-Item -ItemType Directory -Path $temp | Out-Null;" ^
  "$excludeFiles = @('.log','.tsbuildinfo');" ^
  "Get-ChildItem -LiteralPath $root -Force | Where-Object { $_.Name -ne 'DataVault-Share-Package.zip' } | ForEach-Object {" ^
  "  $dest = Join-Path $temp $_.Name;" ^
  "  if ($_.PSIsContainer) {" ^
  "    robocopy $_.FullName $dest /E /XD node_modules .next .git /XF *.log *.tsbuildinfo | Out-Null;" ^
  "  } else {" ^
  "    if ($excludeFiles -contains $_.Extension) { return }" ^
  "    Copy-Item -LiteralPath $_.FullName -Destination $dest -Force;" ^
  "  }" ^
  "};" ^
  "if (Test-Path $zip) { Remove-Item $zip -Force };" ^
  "Compress-Archive -Path (Join-Path $temp '*') -DestinationPath $zip -Force;" ^
  "Remove-Item $temp -Recurse -Force;" ^
  "Write-Host ('Created: ' + $zip);"

echo.
echo Done. Share this file:
echo %ZIP_PATH%
pause
