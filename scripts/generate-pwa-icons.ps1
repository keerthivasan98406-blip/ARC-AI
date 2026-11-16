# Generates correctly sized PWA icons from public/arc_ai_logo.png
# Run from the project root: powershell -ExecutionPolicy Bypass -File scripts/generate-pwa-icons.ps1
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$sourcePath = Join-Path $root 'public\arc_ai_logo.png'
$outDir = Join-Path $root 'public\icons'

if (-not (Test-Path $sourcePath)) { throw "Source logo not found: $sourcePath" }
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$source = [System.Drawing.Image]::FromFile((Resolve-Path $sourcePath))

function Save-Icon {
    param([int]$Size, [double]$Padding, [string]$Background, [string]$FileName)

    $bitmap = New-Object System.Drawing.Bitmap($Size, $Size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    if ([string]::IsNullOrWhiteSpace($Background)) {
        $graphics.Clear([System.Drawing.Color]::Transparent)
    } else {
        $graphics.Clear([System.Drawing.ColorTranslator]::FromHtml($Background))
    }

    $inner = [int][math]::Round($Size * (1 - 2 * $Padding))
    $offset = [int][math]::Round(($Size - $inner) / 2)
    $graphics.DrawImage($source, $offset, $offset, $inner, $inner)

    $target = Join-Path $outDir $FileName
    $bitmap.Save($target, [System.Drawing.Imaging.ImageFormat]::Png)

    $graphics.Dispose()
    $bitmap.Dispose()
    Write-Host "  created public/icons/$FileName (${Size}x${Size})"
}

Write-Host 'Generating PWA icons...'
Save-Icon -Size 192 -Padding 0.00 -Background '' -FileName 'icon-192.png'
Save-Icon -Size 512 -Padding 0.00 -Background '' -FileName 'icon-512.png'
# Maskable: keep artwork inside the 80% safe zone, fill with the logo's own backdrop colour
# so the padding is invisible after the OS applies its mask.
Save-Icon -Size 512 -Padding 0.10 -Background '#000005' -FileName 'icon-maskable-512.png'
# iOS home screen icon (opaque background required)
Save-Icon -Size 180 -Padding 0.00 -Background '#000005' -FileName 'apple-touch-icon-180.png'

$source.Dispose()
Write-Host 'Done.'
