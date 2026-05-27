# Build a multi-size Windows .ico from a source PNG, then create a desktop-ready
# shortcut (.lnk) next to a target .cmd launcher with that icon assigned.
#
# Usage:
#   .\make-app-icon.ps1 -SourcePng "...png" -TargetCmd "...\Janus IA.cmd" [-OutIco "...\Janus IA.ico"]
#
# The .ico embeds modern (PNG-compressed) entries at 256/128/64/48/32/16 so it
# looks crisp in File Explorer thumbnails AND in the taskbar.

param(
  [Parameter(Mandatory=$true)] [string] $SourcePng,
  [Parameter(Mandatory=$true)] [string] $TargetCmd,
  [string] $OutIco = "",
  [string] $OutLnk = ""
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

if (-not (Test-Path $SourcePng)) { throw "Source PNG not found: $SourcePng" }
if (-not (Test-Path $TargetCmd)) { throw "Target .cmd not found: $TargetCmd" }

$targetItem = Get-Item $TargetCmd
$folder     = $targetItem.DirectoryName
$baseName   = [System.IO.Path]::GetFileNameWithoutExtension($targetItem.Name)
if (-not $OutIco) { $OutIco = Join-Path $folder "$baseName.ico" }
if (-not $OutLnk) { $OutLnk = Join-Path $folder "$baseName.lnk" }

$sizes = @(256, 128, 64, 48, 32, 16)

# Load source + auto-crop empty margins so the subject fills the icon
$srcRaw = [System.Drawing.Image]::FromFile((Resolve-Path $SourcePng).Path)
$srcBitmap = New-Object System.Drawing.Bitmap $srcRaw
function Get-NonEmptyBounds([System.Drawing.Bitmap] $bmp, [int] $threshold = 245) {
  $w = $bmp.Width; $h = $bmp.Height
  $minX = $w; $minY = $h; $maxX = -1; $maxY = -1
  for ($y = 0; $y -lt $h; $y++) {
    for ($x = 0; $x -lt $w; $x++) {
      $p = $bmp.GetPixel($x, $y)
      $isEmpty = ($p.A -lt 16) -or (($p.R -ge $threshold) -and ($p.G -ge $threshold) -and ($p.B -ge $threshold))
      if (-not $isEmpty) {
        if ($x -lt $minX) { $minX = $x }
        if ($y -lt $minY) { $minY = $y }
        if ($x -gt $maxX) { $maxX = $x }
        if ($y -gt $maxY) { $maxY = $y }
      }
    }
  }
  if ($maxX -lt 0) { return New-Object System.Drawing.Rectangle 0, 0, $w, $h }
  return New-Object System.Drawing.Rectangle $minX, $minY, ($maxX - $minX + 1), ($maxY - $minY + 1)
}
$bounds = Get-NonEmptyBounds $srcBitmap
$cropped = $srcBitmap.Clone($bounds, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$srcBitmap.Dispose()
$srcRaw.Dispose()

# Build one PNG per target size: scale-to-fit preserving aspect ratio, on
# a transparent square canvas.
$pngBytes = @{}
foreach ($s in $sizes) {
  $bmp = New-Object System.Drawing.Bitmap $s, $s, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode  = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode      = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.PixelOffsetMode    = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $g.Clear([System.Drawing.Color]::Transparent)

  $scale = [Math]::Min($s / $cropped.Width, $s / $cropped.Height)
  $drawW = [int]($cropped.Width  * $scale)
  $drawH = [int]($cropped.Height * $scale)
  $offX  = [int](($s - $drawW) / 2)
  $offY  = [int](($s - $drawH) / 2)
  $g.DrawImage($cropped, (New-Object System.Drawing.Rectangle $offX, $offY, $drawW, $drawH))
  $g.Dispose()

  $ms = New-Object System.IO.MemoryStream
  $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
  $pngBytes[$s] = $ms.ToArray()
  $bmp.Dispose()
  $ms.Dispose()
}
$cropped.Dispose()

# Assemble the ICO file: ICONDIR (6 bytes) + N x ICONDIRENTRY (16 bytes) + data
$headerSize    = 6
$entrySize     = 16
$directorySize = $headerSize + $entrySize * $sizes.Count

$buffers = New-Object System.Collections.Generic.List[byte]
function W16([System.Collections.Generic.List[byte]] $b, [uint16] $v) {
  $b.Add(([byte]($v -band 0xFF)))
  $b.Add(([byte](($v -shr 8) -band 0xFF)))
}
function W32([System.Collections.Generic.List[byte]] $b, [uint32] $v) {
  $b.Add(([byte]($v -band 0xFF)))
  $b.Add(([byte](($v -shr 8) -band 0xFF)))
  $b.Add(([byte](($v -shr 16) -band 0xFF)))
  $b.Add(([byte](($v -shr 24) -band 0xFF)))
}

# ICONDIR
W16 $buffers 0                        # reserved
W16 $buffers 1                        # type = 1 (icon)
W16 $buffers ([uint16]$sizes.Count)   # image count

# ICONDIRENTRY[]
$offset = $directorySize
foreach ($s in $sizes) {
  $bytes = $pngBytes[$s]
  # width/height: 0 means 256 in ICO format
  $w = if ($s -eq 256) { 0 } else { $s }
  $h = if ($s -eq 256) { 0 } else { $s }
  $buffers.Add([byte]$w)              # width
  $buffers.Add([byte]$h)              # height
  $buffers.Add([byte]0)               # color palette (0 = no palette)
  $buffers.Add([byte]0)               # reserved
  W16 $buffers 1                      # planes
  W16 $buffers 32                     # bits per pixel
  W32 $buffers ([uint32]$bytes.Length)
  W32 $buffers ([uint32]$offset)
  $offset += $bytes.Length
}

# Image data
foreach ($s in $sizes) {
  $buffers.AddRange([byte[]]$pngBytes[$s])
}

[System.IO.File]::WriteAllBytes($OutIco, $buffers.ToArray())

# Create the shortcut + assign the icon. Use COM since PowerShell has no native shortcut API.
$shell = New-Object -ComObject WScript.Shell
$sc = $shell.CreateShortcut($OutLnk)
$sc.TargetPath       = (Resolve-Path $TargetCmd).Path
$sc.WorkingDirectory = $folder
$sc.IconLocation     = "$OutIco,0"
$sc.WindowStyle      = 1
$sc.Description      = "Launch Janus IA dashboard"
$sc.Save()

Write-Host "Created:"
Write-Host ("  ICO: {0} ({1:N1} KB, {2} sizes)" -f $OutIco, ((Get-Item $OutIco).Length / 1KB), $sizes.Count)
Write-Host ("  LNK: {0}" -f $OutLnk)
Write-Host ""
Write-Host "Pin the .lnk to Start / Taskbar (right-click → Pin) or drop it on the Desktop."
