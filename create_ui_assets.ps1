Add-Type -AssemblyName System.Drawing

# ==========================================================
# 1. GENERATE assets/ui/viewfinder_frame.png (1920 x 1080)
# ==========================================================
$w = 1920
$h = 1080
$vf = New-Object System.Drawing.Bitmap($w, $h)
$g = [System.Drawing.Graphics]::FromImage($vf)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

# Clear transparent
$g.Clear([System.Drawing.Color]::FromArgb(0, 0, 0, 0))

# Colors
$colAmber = [System.Drawing.Color]::FromArgb(220, 245, 175, 45)
$colDimAmber = [System.Drawing.Color]::FromArgb(90, 245, 175, 45)
$colGrid = [System.Drawing.Color]::FromArgb(40, 255, 255, 255)
$colWhite = [System.Drawing.Color]::FromArgb(230, 255, 255, 255)
$colDarkFrame = [System.Drawing.Color]::FromArgb(180, 10, 10, 10)

# Outer vignette / darkened matte border
$margin = 54
$rectInner = New-Object System.Drawing.Rectangle($margin, $margin, ($w - 2 * $margin), ($h - 2 * $margin))

# Draw subtle outer matte mask
$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$path.AddRectangle((New-Object System.Drawing.Rectangle(0, 0, $w, $h)))
$path.AddRectangle($rectInner)
$brushOuter = New-Object System.Drawing.SolidBrush($colDarkFrame)
$g.FillPath($brushOuter, $path)
$brushOuter.Dispose()
$path.Dispose()

# Inner frame border
$penBorder = New-Object System.Drawing.Pen($colAmber, 2)
$g.DrawRectangle($penBorder, $rectInner)
$penBorder.Dispose()

# Corner brackets (L-shapes) inside frame
$penCorner = New-Object System.Drawing.Pen($colAmber, 3)
$cLen = 44
$cPad = 80
# Top-Left
$g.DrawLine($penCorner, $cPad, $cPad, $cPad + $cLen, $cPad)
$g.DrawLine($penCorner, $cPad, $cPad, $cPad, $cPad + $cLen)
# Top-Right
$g.DrawLine($penCorner, $w - $cPad, $cPad, $w - $cPad - $cLen, $cPad)
$g.DrawLine($penCorner, $w - $cPad, $cPad, $w - $cPad, $cPad + $cLen)
# Bottom-Left
$g.DrawLine($penCorner, $cPad, $h - $cPad, $cPad + $cLen, $h - $cPad)
$g.DrawLine($penCorner, $cPad, $h - $cPad, $cPad, $h - $cPad - $cLen)
# Bottom-Right
$g.DrawLine($penCorner, $w - $cPad, $h - $cPad, $w - $cPad - $cLen, $h - $cPad)
$g.DrawLine($penCorner, $w - $cPad, $h - $cPad, $w - $cPad, $h - $cPad - $cLen)
$penCorner.Dispose()

# Rule of thirds lines inside rectInner
$penGrid = New-Object System.Drawing.Pen($colGrid, 1)
$penGrid.DashStyle = [System.Drawing.Drawing2D.DashStyle]::Dash
$x1 = [int]($margin + ($w - 2 * $margin) / 3)
$x2 = [int]($margin + 2 * ($w - 2 * $margin) / 3)
$y1 = [int]($margin + ($h - 2 * $margin) / 3)
$y2 = [int]($margin + 2 * ($h - 2 * $margin) / 3)
$g.DrawLine($penGrid, $x1, $margin, $x1, $h - $margin)
$g.DrawLine($penGrid, $x2, $margin, $x2, $h - $margin)
$g.DrawLine($penGrid, $margin, $y1, $w - $margin, $y1)
$g.DrawLine($penGrid, $margin, $y2, $w - $margin, $y2)
$penGrid.Dispose()

# Center Rangefinder Circle
$cx = [float]($w / 2)
$cy = [float]($h / 2)
$rOuter = [float]70
$rInner = [float]35
$penCircle = New-Object System.Drawing.Pen($colAmber, 1.5)
$g.DrawEllipse($penCircle, ($cx - $rOuter), ($cy - $rOuter), ($rOuter * 2), ($rOuter * 2))
$penCircle.DashStyle = [System.Drawing.Drawing2D.DashStyle]::Dot
$g.DrawEllipse($penCircle, ($cx - $rInner), ($cy - $rInner), ($rInner * 2), ($rInner * 2))

# Horizontal split line across center circle
$penSplit = New-Object System.Drawing.Pen($colAmber, 1.5)
$g.DrawLine($penSplit, ($cx - $rOuter - 10), $cy, ($cx + $rOuter + 10), $cy)
$g.DrawLine($penSplit, $cx, ($cy - 12), $cx, ($cy + 12))
$penCircle.Dispose()
$penSplit.Dispose()

# Typography for camera info
$fontL = New-Object System.Drawing.Font('Lucida Console', 13, [System.Drawing.FontStyle]::Bold)
$fontS = New-Object System.Drawing.Font('Lucida Console', 11, [System.Drawing.FontStyle]::Regular)
$brushAmber = New-Object System.Drawing.SolidBrush($colAmber)
$brushDim = New-Object System.Drawing.SolidBrush($colDimAmber)
$brushWhite = New-Object System.Drawing.SolidBrush($colWhite)

# Top HUD Info: Shutter Speeds
$topText1 = 'SHUTTER: B · 1 · 2 · 4 · 8 · 15 · 30 · 60 · [ 1/125s ] · 250 · 500 · 1000'
$g.DrawString($topText1, $fontS, $brushWhite, 120, $margin + 16)

# Top Right: Exposure meter
$topText2 = 'EXP: -2 ··· -1 ··· [ 0 ] ··· +1 ··· +2'
$g.DrawString($topText2, $fontS, $brushAmber, ($w - 460), $margin + 16)

# Bottom HUD Info: Camera Info & Aperture
$botText1 = 'HANOI 35mm FILM · KODAK PORTRA 160 · [ 14/24 EXP ]'
$g.DrawString($botText1, $fontS, $brushAmber, 120, ($h - $margin - 36))

$botText2 = 'APERTURE: [ f/2.8 ] · f/4 · f/5.6 · f/8 · f/11 · f/16   |   AF/MF 50mm'
$g.DrawString($botText2, $fontS, $brushWhite, ($w - 680), ($h - $margin - 36))

# Distance Scale on the bottom center
$distScale = '|||||| 0.8m |||||| 1.2m |||||| 2.0m |||||| 3.5m |||||| 5.0m |||||| ∞'
$distSize = $g.MeasureString($distScale, $fontS)
$g.DrawString($distScale, $fontS, $brushDim, [float]($cx - $distSize.Width / 2), [float]($h - $margin - 60))

$g.Dispose()
$vf.Save('assets\ui\viewfinder_frame.png', [System.Drawing.Imaging.ImageFormat]::Png)
$vf.Dispose()
Write-Host 'Successfully created viewfinder_frame.png'

# ==========================================================
# 2. GENERATE assets/ui/shutter_button.png (128 x 128)
# ==========================================================
$sbW = 128
$sbH = 128
$sb = New-Object System.Drawing.Bitmap($sbW, $sbH)
$gSb = [System.Drawing.Graphics]::FromImage($sb)
$gSb.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

$gSb.Clear([System.Drawing.Color]::FromArgb(0, 0, 0, 0))

# Outer drop shadow
$brushShadow = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(80, 0, 0, 0))
$gSb.FillEllipse($brushShadow, 6, 8, 116, 116)
$brushShadow.Dispose()

# Concentric rings for metallic brass/chrome bevel
for ($i = 0; $i -le 16; $i++) {
    $r = [float](58 - $i * 0.8)
    $val = [int](185 + 45 * [Math]::Sin($i * 0.4))
    $cRing = [System.Drawing.Color]::FromArgb(255, $val, [int]($val * 0.88), [int]($val * 0.7))
    $bRing = New-Object System.Drawing.SolidBrush($cRing)
    $gSb.FillEllipse($bRing, [float](64 - $r), [float](64 - $r), [float]($r * 2), [float]($r * 2))
    $bRing.Dispose()
}

# Knurled notches on outer rim
$penNotch = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(120, 60, 40, 20), 1.5)
for ($a = 0; $a -lt 360; $a += 10) {
    $rad = $a * [Math]::PI / 180.0
    $xStart = [float](64 + 48 * [Math]::Cos($rad))
    $yStart = [float](64 + 48 * [Math]::Sin($rad))
    $xEnd = [float](64 + 56 * [Math]::Cos($rad))
    $yEnd = [float](64 + 56 * [Math]::Sin($rad))
    $gSb.DrawLine($penNotch, $xStart, $yStart, $xEnd, $yEnd)
}
$penNotch.Dispose()

# Inner Concave Metallic Button
for ($i = 0; $i -le 24; $i++) {
    $r = [float](44 - $i * 1.5)
    if ($r -le 0) { break }
    $light = [int](225 - $i * 4.5)
    if ($light -lt 60) { $light = 60 }
    $cInner = [System.Drawing.Color]::FromArgb(255, $light, [int]($light * 0.85), [int]($light * 0.65))
    $bInner = New-Object System.Drawing.SolidBrush($cInner)
    $gSb.FillEllipse($bInner, [float](64 - $r), [float](64 - $r), [float]($r * 2), [float]($r * 2))
    $bInner.Dispose()
}

# Threaded Center Shutter Release Cable Socket
$bCenterHole = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 30, 25, 20))
$gSb.FillEllipse($bCenterHole, 56, 56, 16, 16)
$bCenterHole.Dispose()

$penThread = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(180, 200, 180, 140), 1)
$gSb.DrawEllipse($penThread, 58, 58, 12, 12)
$gSb.DrawEllipse($penThread, 60, 60, 8, 8)
$penThread.Dispose()

# Specular Highlight Crescent
$penSpec = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(160, 255, 255, 255), 2)
$gSb.DrawArc($penSpec, 22, 22, 84, 84, 210, 80)
$penSpec.Dispose()

$gSb.Dispose()
$sb.Save('assets\ui\shutter_button.png', [System.Drawing.Imaging.ImageFormat]::Png)
$sb.Dispose()
Write-Host 'Successfully created shutter_button.png'

# ==========================================================
# 3. GENERATE assets/ui/logo_reverie.png (512 x 256)
# ==========================================================
$logoW = 512
$logoH = 256
$logo = New-Object System.Drawing.Bitmap($logoW, $logoH)
$gL = [System.Drawing.Graphics]::FromImage($logo)
$gL.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$gL.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

$gL.Clear([System.Drawing.Color]::FromArgb(0, 0, 0, 0))

# Fonts
$fontMain = New-Object System.Drawing.Font('Times New Roman', 40, [System.Drawing.FontStyle]::Bold)
$fontSub = New-Object System.Drawing.Font('Georgia', 18, [System.Drawing.FontStyle]::Italic)
$fontEn = New-Object System.Drawing.Font('Arial', 10, [System.Drawing.FontStyle]::Bold)

# Ornate Gold Brushes
$brushGoldShadow = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(190, 25, 15, 10))
$brushGold1 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 235, 190, 80))
$brushGold2 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 235, 160))

# Draw Ornate Vintage Diamond Motif Top
$penGold = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(220, 218, 165, 32), 1.5)
$cxLogo = [float]($logoW / 2)
$gL.DrawLine($penGold, [float]($cxLogo - 140), [float]35, [float]($cxLogo - 20), [float]35)
$gL.DrawLine($penGold, [float]($cxLogo + 20), [float]35, [float]($cxLogo + 140), [float]35)

$pt1 = New-Object System.Drawing.PointF($cxLogo, 27)
$pt2 = New-Object System.Drawing.PointF(($cxLogo + 8), 35)
$pt3 = New-Object System.Drawing.PointF($cxLogo, 43)
$pt4 = New-Object System.Drawing.PointF(($cxLogo - 8), 35)
$diamondPts = [System.Drawing.PointF[]]@($pt1, $pt2, $pt3, $pt4)
$gL.FillPolygon($brushGold1, $diamondPts)

# Text 1: HÀ NỘI
$sf = New-Object System.Drawing.StringFormat
$sf.Alignment = [System.Drawing.StringAlignment]::Center
$sf.LineAlignment = [System.Drawing.StringAlignment]::Center

# Drop shadow
$gL.DrawString('HÀ NỘI', $fontMain, $brushGoldShadow, [float]($cxLogo + 3), [float]93, $sf)
$gL.DrawString('HÀ NỘI', $fontMain, $brushGold1, [float]$cxLogo, [float]90, $sf)

# Text 2: Chạm Vào Ký Ức
$gL.DrawString('Chạm Vào Ký Ức', $fontSub, $brushGoldShadow, [float]($cxLogo + 2), [float]154, $sf)
$gL.DrawString('Chạm Vào Ký Ức', $fontSub, $brushGold2, [float]$cxLogo, [float]152, $sf)

# Divider Line with center circle
$gL.DrawLine($penGold, [float]($cxLogo - 100), [float]185, [float]($cxLogo - 15), [float]185)
$gL.DrawLine($penGold, [float]($cxLogo + 15), [float]185, [float]($cxLogo + 100), [float]185)
$gL.FillEllipse($brushGold1, [float]($cxLogo - 4), [float]181, [float]8, [float]8)

# Subtitle English
$gL.DrawString('H A N O I :  O P E N   R E V E R I E', $fontEn, $brushGoldShadow, [float]($cxLogo + 1), [float]211, $sf)
$gL.DrawString('H A N O I :  O P E N   R E V E R I E', $fontEn, $brushGold1, [float]$cxLogo, [float]210, $sf)

$penGold.Dispose()
$gL.Dispose()
$logo.Save('assets\ui\logo_reverie.png', [System.Drawing.Imaging.ImageFormat]::Png)
$logo.Dispose()
Write-Host 'Successfully created logo_reverie.png'
