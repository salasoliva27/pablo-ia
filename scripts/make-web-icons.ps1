# Generate the full PWA icon set + favicons from a single source PNG.
# Drops the output into dashboard/frontend/public/icons/ so the dashboard
# starts serving them on the next build.

param(
  [Parameter(Mandatory=$true)] [string] $SourcePng
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

if (-not (Test-Path $SourcePng)) { throw "Source PNG not found: $SourcePng" }

$repoRoot = Split-Path -Parent $PSScriptRoot
$outDir = Join-Path $repoRoot "dashboard\frontend\public\icons"
New-Item -ItemType Directory -Path $outDir -Force | Out-Null

# Targets: (filename, size, padding-fraction, background)
# Maskable needs ~20% safe-zone padding so iOS/Android can mask without clipping.
$targets = @(
  @{ name = 'favicon-16.png';        size = 16;  pad = 0.0; bg = $null },
  @{ name = 'favicon-32.png';        size = 32;  pad = 0.0; bg = $null },
  @{ name = 'apple-touch-icon.png';  size = 180; pad = 0.0; bg = '#FAF7F0' },
  @{ name = 'icon-192.png';          size = 192; pad = 0.0; bg = $null },
  @{ name = 'icon-512.png';          size = 512; pad = 0.0; bg = $null },
  @{ name = 'icon-512-maskable.png'; size = 512; pad = 0.18; bg = '#FAF7F0' }
)

$srcRaw = [System.Drawing.Image]::FromFile((Resolve-Path $SourcePng).Path)

# Auto-trim empty (white / near-white / transparent) margins so the subject
# fills the icon. Without this, a 540x360 logo with whitespace around the
# face shrinks to maybe 60% of the icon canvas.
function Get-NonEmptyBounds([System.Drawing.Bitmap] $bmp, [int] $threshold = 245) {
  $w = $bmp.Width; $h = $bmp.Height
  $minX = $w; $minY = $h; $maxX = -1; $maxY = -1
  for ($y = 0; $y -lt $h; $y++) {
    for ($x = 0; $x -lt $w; $x++) {
      $p = $bmp.GetPixel($x, $y)
      # Treat fully-transparent OR near-white as empty
      $isEmpty = ($p.A -lt 16) -or (($p.R -ge $threshold) -and ($p.G -ge $threshold) -and ($p.B -ge $threshold))
      if (-not $isEmpty) {
        if ($x -lt $minX) { $minX = $x }
        if ($y -lt $minY) { $minY = $y }
        if ($x -gt $maxX) { $maxX = $x }
        if ($y -gt $maxY) { $maxY = $y }
      }
    }
  }
  if ($maxX -lt 0) {
    # All empty — return full bounds as fallback
    return New-Object System.Drawing.Rectangle 0, 0, $w, $h
  }
  return New-Object System.Drawing.Rectangle $minX, $minY, ($maxX - $minX + 1), ($maxY - $minY + 1)
}

# Convert source to a Bitmap we can scan, then crop to subject bounds
$srcBitmap = New-Object System.Drawing.Bitmap $srcRaw
$bounds = Get-NonEmptyBounds $srcBitmap
$cropped = $srcBitmap.Clone($bounds, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
Write-Host ("Source {0}x{1} -> trimmed to {2}x{3} (cropped {4} px from edges)" -f $srcRaw.Width, $srcRaw.Height, $cropped.Width, $cropped.Height, ($srcRaw.Width - $cropped.Width))
$srcBitmap.Dispose()
$srcRaw.Dispose()

foreach ($t in $targets) {
  $s   = [int]$t.size
  $pad = [double]$t.pad
  $bg  = $t.bg

  $bmp = New-Object System.Drawing.Bitmap $s, $s, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode  = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode      = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.PixelOffsetMode    = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

  # Background fill (transparent if $bg is null)
  if ($bg) {
    $color = [System.Drawing.ColorTranslator]::FromHtml($bg)
    $g.Clear($color)
  } else {
    $g.Clear([System.Drawing.Color]::Transparent)
  }

  # Scale-to-fit preserving aspect ratio. Apply padding (for maskable
  # variants) so the subject doesn't get clipped by the OS mask.
  $maxDraw = [double]($s * (1.0 - 2.0 * $pad))
  $scale   = [Math]::Min($maxDraw / $cropped.Width, $maxDraw / $cropped.Height)
  $drawW   = [int]($cropped.Width  * $scale)
  $drawH   = [int]($cropped.Height * $scale)
  $offX    = [int](($s - $drawW) / 2)
  $offY    = [int](($s - $drawH) / 2)
  $g.DrawImage($cropped, (New-Object System.Drawing.Rectangle $offX, $offY, $drawW, $drawH))
  $g.Dispose()

  $out = Join-Path $outDir $t.name
  $bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()

  Write-Host ("  {0,-28} {1,3}x{2,-3}  subject {3}x{4}  ({5:N1} KB)" -f $t.name, $s, $s, $drawW, $drawH, ((Get-Item $out).Length / 1KB))
}
$cropped.Dispose()

# Also replace icon.svg with a tiny SVG that just embeds the PNG, so legacy
# rel="icon" type="svg" requests no longer load the old "J" placeholder.
$svgPath = Join-Path $outDir 'icon.svg'
$svg = @'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <image href="icon-512.png" width="512" height="512" />
</svg>
'@
[System.IO.File]::WriteAllText($svgPath, $svg, [System.Text.UTF8Encoding]::new($false))
Write-Host ("  {0,-28} (embeds icon-512.png)" -f 'icon.svg')

Write-Host ""
Write-Host "All web icons written to $outDir"
