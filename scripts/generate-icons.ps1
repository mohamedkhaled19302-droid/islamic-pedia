# Islamic Pedia - Unified Icon Generator
# Regenerates EVERY app icon (Android, Capacitor resources, desktop wrapper,
# web favicon) from the Windows app icon build/icon.ico, so all platforms
# show the exact same artwork.
$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing

$root   = Split-Path -Parent $PSScriptRoot
$icoPath = Join-Path $root 'build\icon.ico'
$tmp    = Join-Path $env:TEMP 'islamic-pedia-icons'

New-Item -ItemType Directory -Force -Path $tmp | Out-Null

# ---- 1) Extract the largest PNG frame embedded in the ICO -----------------
$bytes = [System.IO.File]::ReadAllBytes($icoPath)
if ($bytes.Length -lt 6 -or $bytes[0] -ne 0 -or $bytes[1] -ne 0) { throw "Not an ICO file: $icoPath" }
$count  = [BitConverter]::ToUInt16($bytes, 4)
$best   = $null
$bestDim = 0
for ($i = 0; $i -lt $count; $i++) {
    $off  = 6 + 16 * $i
    $w    = $bytes[$off]; $h = $bytes[$off + 1]
    $dim  = if ($w -eq 0) { 256 } else { [int]$w }
    $len  = [BitConverter]::ToUInt32($bytes, $off + 8)
    $dOff = [BitConverter]::ToUInt32($bytes, $off + 12)
    if ($len -gt 0 -and $dim -ge $bestDim) {
        $blob = New-Object byte[] $len
        [Array]::Copy($bytes, [int]$dOff, $blob, 0, $len)
        if ($blob.Length -gt 8 -and $blob[0] -eq 0x89 -and $blob[1] -eq 0x50) {
            $best = $blob; $bestDim = $dim
        }
    }
}
if (-not $best) { throw "No PNG frame found in $icoPath" }

$masterPath = Join-Path $tmp 'master.png'
[System.IO.File]::WriteAllBytes($masterPath, $best)
$master = New-Object System.Drawing.Bitmap $masterPath
$M = $master.Width

# ---- 2) Helpers ------------------------------------------------------------
function Resize-Image([System.Drawing.Image]$src, [int]$size) {
    $bmp = New-Object System.Drawing.Bitmap ($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode      = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode  = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode    = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $srcRect = New-Object System.Drawing.Rectangle (0, 0, $src.Width, $src.Height)
    $dstRect = New-Object System.Drawing.Rectangle (0, 0, $size, $size)
    $g.DrawImage($src, $dstRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()
    return $bmp
}

function New-Foreground([System.Drawing.Image]$src, [int]$size, [double]$scale) {
    $bmp = New-Object System.Drawing.Bitmap ($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode      = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode  = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode    = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $d = [int][Math]::Floor($size * $scale)
    $pad = [int][Math]::Floor(($size - $d) / 2.0)
    $srcRect = New-Object System.Drawing.Rectangle (0, 0, $src.Width, $src.Height)
    $dstRect = New-Object System.Drawing.Rectangle ($pad, $pad, $d, $d)
    $g.DrawImage($src, $dstRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()
    return $bmp
}

function New-SolidBg([int]$size, [System.Drawing.Color]$color) {
    $bmp = New-Object System.Drawing.Bitmap ($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.Clear($color)
    $g.Dispose()
    return $bmp
}

function New-IcoFile([string]$outPath, [int[]]$sizes) {
    $count   = $sizes.Count
    $blobs   = New-Object 'System.Collections.Generic.List[byte[]]'
    $offsets = New-Object 'System.Collections.Generic.List[int]'
    $offset  = 6 + (16 * $count)
    foreach ($s in $sizes) {
        $png = Resize-Image $master $s
        $ms  = New-Object System.IO.MemoryStream
        $png.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
        $png.Dispose()
        $bytes = $ms.ToArray()
        $ms.Dispose()
        $blobs.Add($bytes)
        $offsets.Add($offset)
        $offset += $bytes.Length
    }

    $ms = New-Object System.IO.MemoryStream
    $bw = New-Object System.IO.BinaryWriter $ms
    $bw.Write([UInt16]0)
    $bw.Write([UInt16]1)
    $bw.Write([UInt16]$count)

    for ($i = 0; $i -lt $count; $i++) {
        $s = $sizes[$i]
        $dim = if ($s -ge 256) { 0 } else { $s }
        $bw.Write([Byte]$dim)
        $bw.Write([Byte]$dim)
        $bw.Write([Byte]0)
        $bw.Write([Byte]0)
        $bw.Write([UInt16]1)
        $bw.Write([UInt16]32)
        $bw.Write([UInt32]$blobs[$i].Length)
        $bw.Write([UInt32]$offsets[$i])
    }
    foreach ($b in $blobs) { $bw.Write($b) }
    $bw.Flush()
    [System.IO.File]::WriteAllBytes($outPath, $ms.ToArray())
    $bw.Dispose()
    $ms.Dispose()
}

$PNG = [System.Drawing.Imaging.ImageFormat]::Png
$BG_COLOR = [System.Drawing.Color]::FromArgb(255, 15, 105, 84)
$FG_SCALE = 0.68

# ---- 3) Android launcher icons ---------------------------------------------
$resBase = Join-Path $root 'android\app\src\main\res'
$densities = @(
    @('ldpi',   36),
    @('mdpi',   48),
    @('hdpi',   72),
    @('xhdpi',  96),
    @('xxhdpi', 144),
    @('xxxhdpi',192)
)
foreach ($d in $densities) {
    $dir = Join-Path $resBase "mipmap-$($d[0])"
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
    $s = $d[1]

    $img = Resize-Image $master $s
    $img.Save((Join-Path $dir 'ic_launcher.png'), $PNG); $img.Dispose()

    $img = Resize-Image $master $s
    $img.Save((Join-Path $dir 'ic_launcher_round.png'), $PNG); $img.Dispose()

    $fg = New-Foreground $master $s $FG_SCALE
    $fg.Save((Join-Path $dir 'ic_launcher_foreground.png'), $PNG); $fg.Dispose()

    $bgBmp = New-SolidBg $s $BG_COLOR
    $bgBmp.Save((Join-Path $dir 'ic_launcher_background.png'), $PNG); $bgBmp.Dispose()
}

# ---- 4) Capacitor resources (1024 source for Android) -----------------------
$resDir = Join-Path $root 'resources'
New-Item -ItemType Directory -Force -Path $resDir | Out-Null
$img = Resize-Image $master 1024
$img.Save((Join-Path $resDir 'icon.png'), $PNG); $img.Dispose()

$fg = New-Foreground $master 1024 $FG_SCALE
$fg.Save((Join-Path $resDir 'icon-foreground.png'), $PNG); $fg.Dispose()

$bgBmp = New-SolidBg 1024 $BG_COLOR
$bgBmp.Save((Join-Path $resDir 'icon-background.png'), $PNG); $bgBmp.Dispose()

# ---- 5) Desktop wrapper icons -------------------------------------------------
$deskIcons  = Join-Path $root 'desktop\icons'
$deskAssets = Join-Path $root 'desktop\assets'
New-Item -ItemType Directory -Force -Path $deskIcons  | Out-Null
New-Item -ItemType Directory -Force -Path $deskAssets | Out-Null

New-IcoFile (Join-Path $deskIcons 'icon.ico') @(16, 32, 48, 64, 128, 256)

$img = Resize-Image $master 512
$img.Save((Join-Path $deskIcons 'icon.png'), $PNG); $img.Dispose()

$img = Resize-Image $master 256
$img.Save((Join-Path $deskAssets 'icon.png'), $PNG); $img.Dispose()

# ---- 6) Web favicon = the Windows icon (byte-identical) ----------------------
Copy-Item $icoPath (Join-Path $root 'public\favicon.ico') -Force

$master.Dispose()
Write-Host "Icons regenerated from $icoPath (master ${M}x${M}):"
Write-Host '  android/app/src/main/res/mipmap-*/        (ic_launcher, _round, _background, _foreground)'
Write-Host '  resources/icon.png, icon-background.png, icon-foreground.png'
Write-Host '  desktop/icons/icon.ico, desktop/icons/icon.png, desktop/assets/icon.png'
Write-Host '  public/favicon.ico'
