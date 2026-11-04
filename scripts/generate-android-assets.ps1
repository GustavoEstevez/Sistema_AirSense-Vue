$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$resRoot = Join-Path $projectRoot 'android\app\src\main\res'
$iconSourcePath = Join-Path $projectRoot 'public\assets\FaviconAirSense.png'
$splashSourcePath = Join-Path $projectRoot 'public\assets\Logos\LogoAirSense.png'
$iconSource = [System.Drawing.Image]::FromFile($iconSourcePath)
$splashSource = [System.Drawing.Image]::FromFile($splashSourcePath)

function Save-SquareAsset {
  param(
    [System.Drawing.Image]$Source,
    [int]$Size,
    [double]$Scale,
    [string]$Destination,
    [bool]$Transparent
  )
  $bitmap = New-Object System.Drawing.Bitmap($Size, $Size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  if ($Transparent) { $graphics.Clear([System.Drawing.Color]::Transparent) }
  else { $graphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#F4FBFB')) }

  $target = [int]($Size * $Scale)
  $ratio = [Math]::Min($target / $Source.Width, $target / $Source.Height)
  $width = [int]($Source.Width * $ratio)
  $height = [int]($Source.Height * $ratio)
  $x = [int](($Size - $width) / 2)
  $y = [int](($Size - $height) / 2)
  $graphics.DrawImage($Source, $x, $y, $width, $height)
  $graphics.Dispose()
  $bitmap.Save($Destination, [System.Drawing.Imaging.ImageFormat]::Png)
  $bitmap.Dispose()
}

$densities = @{
  'mipmap-mdpi' = @{ legacy = 48; foreground = 108 }
  'mipmap-hdpi' = @{ legacy = 72; foreground = 162 }
  'mipmap-xhdpi' = @{ legacy = 96; foreground = 216 }
  'mipmap-xxhdpi' = @{ legacy = 144; foreground = 324 }
  'mipmap-xxxhdpi' = @{ legacy = 192; foreground = 432 }
}

foreach ($entry in $densities.GetEnumerator()) {
  $directory = Join-Path $resRoot $entry.Key
  Save-SquareAsset $iconSource $entry.Value.legacy 0.84 (Join-Path $directory 'ic_launcher.png') $false
  Save-SquareAsset $iconSource $entry.Value.legacy 0.84 (Join-Path $directory 'ic_launcher_round.png') $false
  Save-SquareAsset $iconSource $entry.Value.foreground 0.62 (Join-Path $directory 'ic_launcher_foreground.png') $true
}

Get-ChildItem -LiteralPath $resRoot -Recurse -Filter 'splash.png' | ForEach-Object {
  $current = [System.Drawing.Image]::FromFile($_.FullName)
  $width = $current.Width
  $height = $current.Height
  $current.Dispose()
  $bitmap = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#EEF8F8'))
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $targetWidth = [int]([Math]::Min($width * 0.54, $height * 0.54))
  $ratio = [Math]::Min($targetWidth / $splashSource.Width, $targetWidth / $splashSource.Height)
  $drawWidth = [int]($splashSource.Width * $ratio)
  $drawHeight = [int]($splashSource.Height * $ratio)
  $graphics.DrawImage($splashSource, [int](($width - $drawWidth) / 2), [int](($height - $drawHeight) / 2), $drawWidth, $drawHeight)
  $graphics.Dispose()
  $bitmap.Save($_.FullName, [System.Drawing.Imaging.ImageFormat]::Png)
  $bitmap.Dispose()
}

$iconSource.Dispose()
$splashSource.Dispose()
Write-Output 'Íconos y pantallas de inicio Android actualizados con la marca AirSense.'
