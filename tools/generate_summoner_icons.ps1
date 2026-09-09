param(
    [string]$ProjectRoot = (Split-Path -Parent $PSScriptRoot)
)

Add-Type -AssemblyName System.Drawing

$skillDir = Join-Path $ProjectRoot "asset/image/picture/icon/skill"
$classDir = Join-Path $ProjectRoot "asset/image/picture/control"
[System.IO.Directory]::CreateDirectory($skillDir) | Out-Null
[System.IO.Directory]::CreateDirectory($classDir) | Out-Null

function New-Canvas([int]$size, [System.Drawing.Color]$top, [System.Drawing.Color]$bottom) {
    $bitmap = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        (New-Object System.Drawing.Rectangle(0, 0, $size, $size)), $top, $bottom, 45
    )
    $graphics.FillRectangle($brush, 0, 0, $size, $size)
    $brush.Dispose()
    return @($bitmap, $graphics)
}

function Save-Icon($bitmap, $graphics, [string]$path) {
    $graphics.Dispose()
    $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $bitmap.Dispose()
}

function Add-Rays($graphics, [System.Drawing.Color]$color) {
    $pen = New-Object System.Drawing.Pen($color, 3)
    foreach ($angle in 0, 45, 90, 135, 180, 225, 270, 315) {
        $radians = $angle * [Math]::PI / 180
        $x1 = 50 + [Math]::Cos($radians) * 34
        $y1 = 50 + [Math]::Sin($radians) * 34
        $x2 = 50 + [Math]::Cos($radians) * 45
        $y2 = 50 + [Math]::Sin($radians) * 45
        $graphics.DrawLine($pen, [float]$x1, [float]$y1, [float]$x2, [float]$y2)
    }
    $pen.Dispose()
}

function Draw-MushroomIcon([string]$path) {
    $canvas = New-Canvas 100 ([System.Drawing.Color]::FromArgb(255, 31, 70, 75)) ([System.Drawing.Color]::FromArgb(255, 8, 29, 46))
    $bitmap, $g = $canvas
    Add-Rays $g ([System.Drawing.Color]::FromArgb(135, 101, 236, 196))
    $aura = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(90, 68, 244, 191))
    $g.FillEllipse($aura, 13, 65, 74, 22)
    $aura.Dispose()
    $outline = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 31, 26, 35), 6)
    $stem = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 238, 211, 145))
    $g.FillEllipse($stem, 38, 45, 25, 38); $g.DrawEllipse($outline, 38, 45, 25, 38)
    $cap = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 229, 88, 72))
    $g.FillEllipse($cap, 20, 19, 61, 46); $g.DrawEllipse($outline, 20, 19, 61, 46)
    $spot = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 231, 166))
    $g.FillEllipse($spot, 32, 29, 12, 10); $g.FillEllipse($spot, 57, 35, 10, 8)
    $eye = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 35, 37, 39))
    $g.FillEllipse($eye, 45, 58, 4, 6); $g.FillEllipse($eye, 55, 58, 4, 6)
    $outline.Dispose(); $stem.Dispose(); $cap.Dispose(); $spot.Dispose(); $eye.Dispose()
    Save-Icon $bitmap $g $path
}

function Draw-FlowerIcon([string]$path) {
    $canvas = New-Canvas 100 ([System.Drawing.Color]::FromArgb(255, 76, 44, 109)) ([System.Drawing.Color]::FromArgb(255, 21, 28, 67))
    $bitmap, $g = $canvas
    Add-Rays $g ([System.Drawing.Color]::FromArgb(145, 255, 170, 223))
    $outline = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 35, 24, 49), 5)
    $petal = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 246, 118, 194))
    foreach ($rect in @(@(39, 10, 22, 39), @(39, 51, 22, 39), @(10, 39, 39, 22), @(51, 39, 39, 22))) {
        $g.FillEllipse($petal, $rect[0], $rect[1], $rect[2], $rect[3]); $g.DrawEllipse($outline, $rect[0], $rect[1], $rect[2], $rect[3])
    }
    $leaf = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 87, 218, 137))
    $g.FillEllipse($leaf, 23, 24, 29, 29); $g.FillEllipse($leaf, 49, 47, 29, 29)
    $center = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 222, 92))
    $g.FillEllipse($center, 33, 33, 34, 34); $g.DrawEllipse($outline, 33, 33, 34, 34)
    $shine = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(210, 255, 255, 220))
    $g.FillEllipse($shine, 43, 40, 9, 9)
    $outline.Dispose(); $petal.Dispose(); $leaf.Dispose(); $center.Dispose(); $shine.Dispose()
    Save-Icon $bitmap $g $path
}

function Draw-TreeIcon([string]$path) {
    $canvas = New-Canvas 100 ([System.Drawing.Color]::FromArgb(255, 39, 85, 54)) ([System.Drawing.Color]::FromArgb(255, 13, 35, 31))
    $bitmap, $g = $canvas
    Add-Rays $g ([System.Drawing.Color]::FromArgb(145, 150, 239, 119))
    $outline = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 27, 28, 25), 6)
    $trunk = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 151, 96, 53))
    $g.FillPolygon($trunk, @(
        (New-Object System.Drawing.Point(41, 45)), (New-Object System.Drawing.Point(59, 45)),
        (New-Object System.Drawing.Point(64, 83)), (New-Object System.Drawing.Point(53, 75)),
        (New-Object System.Drawing.Point(46, 85)), (New-Object System.Drawing.Point(36, 81))
    )); $g.DrawPolygon($outline, @(
        (New-Object System.Drawing.Point(41, 45)), (New-Object System.Drawing.Point(59, 45)),
        (New-Object System.Drawing.Point(64, 83)), (New-Object System.Drawing.Point(53, 75)),
        (New-Object System.Drawing.Point(46, 85)), (New-Object System.Drawing.Point(36, 81))
    ))
    $crown = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 90, 190, 79))
    foreach ($rect in @(@(18, 22, 43, 43), @(40, 14, 43, 43), @(31, 4, 39, 42))) {
        $g.FillEllipse($crown, $rect[0], $rect[1], $rect[2], $rect[3]); $g.DrawEllipse($outline, $rect[0], $rect[1], $rect[2], $rect[3])
    }
    $light = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(220, 191, 244, 111))
    $g.FillEllipse($light, 38, 21, 12, 12); $g.FillEllipse($light, 58, 31, 8, 8)
    $outline.Dispose(); $trunk.Dispose(); $crown.Dispose(); $light.Dispose()
    Save-Icon $bitmap $g $path
}

function Draw-BlessingIcon([string]$path) {
    $canvas = New-Canvas 100 ([System.Drawing.Color]::FromArgb(255, 33, 88, 91)) ([System.Drawing.Color]::FromArgb(255, 18, 36, 70))
    $bitmap, $g = $canvas
    Add-Rays $g ([System.Drawing.Color]::FromArgb(160, 103, 244, 226))
    $outer = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 80, 242, 207), 6)
    $inner = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 255, 221, 101), 4)
    $g.DrawEllipse($outer, 15, 15, 70, 70); $g.DrawEllipse($inner, 27, 27, 46, 46)
    foreach ($angle in 0, 120, 240) {
        $radians = $angle * [Math]::PI / 180
        $x = 50 + [Math]::Cos($radians) * 25
        $y = 50 + [Math]::Sin($radians) * 25
        $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 116, 224, 123))
        $g.FillEllipse($brush, [float]($x - 9), [float]($y - 5), 18, 10)
        $brush.Dispose()
    }
    $core = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 244, 173))
    $g.FillEllipse($core, 41, 41, 18, 18)
    $outer.Dispose(); $inner.Dispose(); $core.Dispose()
    Save-Icon $bitmap $g $path
}

function Draw-ClassIcon([string]$path) {
    $bitmap = New-Object System.Drawing.Bitmap(34, 34, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bitmap)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.Clear([System.Drawing.Color]::Transparent)
    $shadow = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 18, 35, 50), 5)
    $gold = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 255, 207, 73), 3)
    $g.DrawEllipse($shadow, 3, 3, 28, 28); $g.DrawEllipse($gold, 4, 4, 26, 26)
    $stem = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 94, 235, 159), 3)
    $g.DrawLine($stem, 17, 25, 17, 12)
    $leaf = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 102, 238, 139))
    $g.FillEllipse($leaf, 9, 9, 10, 6); $g.FillEllipse($leaf, 16, 7, 10, 6)
    $spark = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 112, 239, 255))
    $g.FillEllipse($spark, 15, 16, 5, 5)
    $shadow.Dispose(); $gold.Dispose(); $stem.Dispose(); $leaf.Dispose(); $spark.Dispose()
    Save-Icon $bitmap $g $path
}

function Draw-MahoragaIcon([string]$path) {
    $canvas = New-Canvas 100 ([System.Drawing.Color]::FromArgb(255, 36, 47, 58)) ([System.Drawing.Color]::FromArgb(255, 12, 18, 29))
    $bitmap, $g = $canvas
    Add-Rays $g ([System.Drawing.Color]::FromArgb(145, 69, 232, 207))
    $dark = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 14, 18, 23), 7)
    $gold = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 224, 184, 81), 5)
    $g.DrawEllipse($dark, 18, 7, 64, 64); $g.DrawEllipse($gold, 20, 9, 60, 60)
    foreach ($angle in 0, 45, 90, 135, 180, 225, 270, 315) {
        $radians = $angle * [Math]::PI / 180
        $g.DrawLine($gold, 50, 39, [float](50 + [Math]::Cos($radians) * 36), [float](39 + [Math]::Sin($radians) * 36))
    }
    $body = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 218, 224, 213))
    $shadow = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 94, 110, 108))
    $outline = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 21, 27, 31), 5)
    $g.FillEllipse($body, 36, 25, 28, 27); $g.DrawEllipse($outline, 36, 25, 28, 27)
    $g.FillPolygon($body, @((New-Object System.Drawing.Point(31, 49)), (New-Object System.Drawing.Point(69, 49)), (New-Object System.Drawing.Point(76, 91)), (New-Object System.Drawing.Point(24, 91))))
    $g.DrawPolygon($outline, @((New-Object System.Drawing.Point(31, 49)), (New-Object System.Drawing.Point(69, 49)), (New-Object System.Drawing.Point(76, 91)), (New-Object System.Drawing.Point(24, 91))))
    $g.FillRectangle($shadow, 29, 68, 42, 10)
    $eye = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 74, 247, 213))
    $g.FillEllipse($eye, 41, 35, 6, 4); $g.FillEllipse($eye, 54, 35, 6, 4)
    $dark.Dispose(); $gold.Dispose(); $body.Dispose(); $shadow.Dispose(); $outline.Dispose(); $eye.Dispose()
    Save-Icon $bitmap $g $path
}

function Draw-MahoragaFrame($g, [int]$offsetX, [int]$offsetY, [int]$phase, [int]$facing) {
    $bob = if ($phase -eq 1 -or $phase -eq 3) { 1 } else { 0 }
    $wheelY = $offsetY + 5 + $bob
    $centerX = $offsetX + 24
    $centerY = $wheelY + 17
    $wheelShadow = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 13, 19, 23), 4)
    $wheel = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 210, 169, 67), 2)
    $g.DrawEllipse($wheelShadow, $offsetX + 8, $wheelY, 32, 32); $g.DrawEllipse($wheel, $offsetX + 9, $wheelY + 1, 30, 30)
    foreach ($angle in 0, 45, 90, 135, 180, 225, 270, 315) {
        $radians = $angle * [Math]::PI / 180
        $g.DrawLine($wheel, $centerX, $centerY, [float]($centerX + [Math]::Cos($radians) * 19), [float]($centerY + [Math]::Sin($radians) * 19))
    }

    $outline = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 18, 25, 29), 3)
    $skin = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 205, 214, 207))
    $armor = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 83, 102, 103))
    $cloth = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 30, 50, 55))
    $energy = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 65, 234, 202))

    $headX = if ($facing -eq 1) { $offsetX + 18 } elseif ($facing -eq 2) { $offsetX + 16 } else { $offsetX + 15 }
    $g.FillEllipse($skin, $headX, $offsetY + 27 + $bob, 18, 20); $g.DrawEllipse($outline, $headX, $offsetY + 27 + $bob, 18, 20)
    if ($facing -ne 3) {
        $eyeX = if ($facing -eq 1) { $headX + 4 } elseif ($facing -eq 2) { $headX + 11 } else { $headX + 4 }
        $g.FillEllipse($energy, $eyeX, $offsetY + 35 + $bob, 4, 3)
        if ($facing -eq 0) { $g.FillEllipse($energy, $headX + 11, $offsetY + 35 + $bob, 4, 3) }
    }

    $torso = [System.Drawing.Point[]]@(
        [System.Drawing.Point]::new(($offsetX + 13), ($offsetY + 45 + $bob)),
        [System.Drawing.Point]::new(($offsetX + 35), ($offsetY + 45 + $bob)),
        [System.Drawing.Point]::new(($offsetX + 39), ($offsetY + 72 + $bob)),
        [System.Drawing.Point]::new(($offsetX + 9), ($offsetY + 72 + $bob))
    )
    $g.FillPolygon($skin, $torso); $g.DrawPolygon($outline, $torso)
    $g.FillRectangle($armor, $offsetX + 11, $offsetY + 52 + $bob, 26, 9)
    $g.FillRectangle($cloth, $offsetX + 10, $offsetY + 66 + $bob, 28, 11)

    $armShift = if ($phase -eq 1) { 3 } elseif ($phase -eq 3) { -3 } else { 0 }
    $g.DrawLine($outline, $offsetX + 12, $offsetY + 50 + $bob, $offsetX + 5, $offsetY + 70 + $bob + $armShift)
    $g.DrawLine($outline, $offsetX + 36, $offsetY + 50 + $bob, $offsetX + 43, $offsetY + 70 + $bob - $armShift)
    $armPen = New-Object System.Drawing.Pen($skin.Color, 5)
    $g.DrawLine($armPen, $offsetX + 12, $offsetY + 51 + $bob, $offsetX + 6, $offsetY + 69 + $bob + $armShift)
    $g.DrawLine($armPen, $offsetX + 36, $offsetY + 51 + $bob, $offsetX + 42, $offsetY + 69 + $bob - $armShift)

    $leftLeg = if ($phase -eq 1) { -3 } elseif ($phase -eq 3) { 3 } else { 0 }
    $rightLeg = -$leftLeg
    $legPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 176, 188, 184), 7)
    $g.DrawLine($legPen, $offsetX + 17, $offsetY + 74 + $bob, $offsetX + 16 + $leftLeg, $offsetY + 90)
    $g.DrawLine($legPen, $offsetX + 31, $offsetY + 74 + $bob, $offsetX + 31 + $rightLeg, $offsetY + 90)
    $g.FillEllipse($energy, $offsetX + 21, $offsetY + 57 + $bob, 6, 6)

    $wheelShadow.Dispose(); $wheel.Dispose(); $outline.Dispose(); $skin.Dispose(); $armor.Dispose(); $cloth.Dispose(); $energy.Dispose(); $armPen.Dispose(); $legPen.Dispose()
}

function Draw-MahoragaSprites([string]$directory) {
    [System.IO.Directory]::CreateDirectory($directory) | Out-Null
    $standby = New-Object System.Drawing.Bitmap(48, 384, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $standbyG = [System.Drawing.Graphics]::FromImage($standby)
    $standbyG.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $standbyG.Clear([System.Drawing.Color]::Transparent)
    for ($facing = 0; $facing -lt 4; $facing++) { Draw-MahoragaFrame $standbyG 0 ($facing * 96) 0 $facing }
    Save-Icon $standby $standbyG (Join-Path $directory "Mahoraga_standby.png")

    $walk = New-Object System.Drawing.Bitmap(192, 384, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $walkG = [System.Drawing.Graphics]::FromImage($walk)
    $walkG.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $walkG.Clear([System.Drawing.Color]::Transparent)
    for ($facing = 0; $facing -lt 4; $facing++) {
        for ($phase = 0; $phase -lt 4; $phase++) { Draw-MahoragaFrame $walkG ($phase * 48) ($facing * 96) $phase $facing }
    }
    Save-Icon $walk $walkG (Join-Path $directory "Mahoraga_walk.png")
}

function Draw-MahoragaIconV2([string]$path) {
    $canvas = New-Canvas 100 ([System.Drawing.Color]::FromArgb(255, 53, 49, 47)) ([System.Drawing.Color]::FromArgb(255, 12, 16, 22))
    $bitmap, $g = $canvas
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $ink = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 10, 13, 17), 6)
    $gold = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 222, 174, 62), 4)
    $pale = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 214, 218, 204))
    $shade = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 119, 126, 119))
    $red = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 224, 79, 57))
    $steel = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 190, 213, 211))

    $g.DrawEllipse($ink, 15, 4, 70, 70); $g.DrawEllipse($gold, 17, 6, 66, 66)
    foreach ($angle in 0, 45, 90, 135, 180, 225, 270, 315) {
        $r = $angle * [Math]::PI / 180
        $x = 50 + [Math]::Cos($r) * 39; $y = 39 + [Math]::Sin($r) * 39
        $g.DrawLine($gold, 50, 39, [float]$x, [float]$y)
        $g.FillEllipse($red, [float]($x - 3), [float]($y - 3), 6, 6)
    }
    $faceWings = [System.Drawing.Point[]]@(
        [System.Drawing.Point]::new(20, 43), [System.Drawing.Point]::new(39, 31), [System.Drawing.Point]::new(42, 52)
    )
    $g.FillPolygon($pale, $faceWings); $g.DrawPolygon($ink, $faceWings)
    $faceWings2 = [System.Drawing.Point[]]@(
        [System.Drawing.Point]::new(80, 43), [System.Drawing.Point]::new(61, 31), [System.Drawing.Point]::new(58, 52)
    )
    $g.FillPolygon($pale, $faceWings2); $g.DrawPolygon($ink, $faceWings2)
    $g.FillEllipse($pale, 35, 27, 30, 34); $g.DrawEllipse($ink, 35, 27, 30, 34)
    $g.FillRectangle($shade, 38, 46, 24, 9)
    $g.FillEllipse($red, 41, 39, 6, 4); $g.FillEllipse($red, 53, 39, 6, 4)

    $torso = [System.Drawing.Point[]]@(
        [System.Drawing.Point]::new(25, 58), [System.Drawing.Point]::new(75, 58),
        [System.Drawing.Point]::new(68, 98), [System.Drawing.Point]::new(32, 98)
    )
    $g.FillPolygon($pale, $torso); $g.DrawPolygon($ink, $torso)
    $g.DrawLine($gold, 50, 63, 50, 88); $g.DrawArc($gold, 36, 66, 28, 18, 15, 150)
    $blade = [System.Drawing.Point[]]@(
        [System.Drawing.Point]::new(72, 62), [System.Drawing.Point]::new(96, 72),
        [System.Drawing.Point]::new(78, 82), [System.Drawing.Point]::new(65, 72)
    )
    $g.FillPolygon($steel, $blade); $g.DrawPolygon($ink, $blade)

    $ink.Dispose(); $gold.Dispose(); $pale.Dispose(); $shade.Dispose(); $red.Dispose(); $steel.Dispose()
    Save-Icon $bitmap $g $path
}

function Draw-MahoragaFrameV2($g, [int]$offsetX, [int]$offsetY, [int]$phase, [int]$facing) {
    $bob = if ($phase -eq 1 -or $phase -eq 3) { 2 } else { 0 }
    $cx = $offsetX + 48
    $cy = $offsetY + 29 + $bob
    $ink = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 13, 16, 19), 5)
    $detail = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 75, 81, 78), 2)
    $gold = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 218, 169, 56), 3)
    $pale = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 211, 216, 204))
    $light = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 239, 238, 218))
    $skinShade = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 125, 134, 128))
    $deep = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 25, 29, 34))
    $cloth = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 47, 51, 58))
    $red = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 190, 57, 43))
    $eye = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 238, 91, 57))
    $steel = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 190, 209, 207))
    $steelLight = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 239, 248, 232), 2)

    $g.DrawEllipse($ink, $offsetX + 16, $offsetY + 1 + $bob, 64, 56)
    $g.DrawEllipse($gold, $offsetX + 18, $offsetY + 3 + $bob, 60, 52)
    foreach ($angle in 0, 45, 90, 135, 180, 225, 270, 315) {
        $r = $angle * [Math]::PI / 180
        $ex = $cx + [Math]::Cos($r) * 37
        $ey = $cy + [Math]::Sin($r) * 32
        $g.DrawLine($gold, $cx, $cy, [float]$ex, [float]$ey)
        $g.FillEllipse($red, [float]($ex - 3), [float]($ey - 3), 6, 6)
    }

    $headShift = if ($facing -eq 1) { -4 } elseif ($facing -eq 2) { 4 } else { 0 }
    $hx = $offsetX + 37 + $headShift
    $hy = $offsetY + 31 + $bob
    $leftWing = [System.Drawing.Point[]]@(
        [System.Drawing.Point]::new(($hx - 18), ($hy + 10)), [System.Drawing.Point]::new(($hx + 3), ($hy + 2)), [System.Drawing.Point]::new(($hx + 5), ($hy + 20))
    )
    $rightWing = [System.Drawing.Point[]]@(
        [System.Drawing.Point]::new(($hx + 40), ($hy + 10)), [System.Drawing.Point]::new(($hx + 19), ($hy + 2)), [System.Drawing.Point]::new(($hx + 17), ($hy + 20))
    )
    $g.FillPolygon($pale, $leftWing); $g.DrawPolygon($ink, $leftWing)
    $g.FillPolygon($pale, $rightWing); $g.DrawPolygon($ink, $rightWing)
    $g.FillEllipse($pale, $hx, $hy, 24, 29); $g.DrawEllipse($ink, $hx, $hy, 24, 29)
    $g.FillPolygon($skinShade, [System.Drawing.Point[]]@(
        [System.Drawing.Point]::new(($hx + 2), ($hy + 20)), [System.Drawing.Point]::new(($hx + 22), ($hy + 17)), [System.Drawing.Point]::new(($hx + 18), ($hy + 27)), [System.Drawing.Point]::new(($hx + 5), ($hy + 28))
    ))
    if ($facing -ne 3) {
        if ($facing -ne 2) { $g.FillEllipse($eye, $hx + 5, $hy + 12, 5, 3) }
        if ($facing -ne 1) { $g.FillEllipse($eye, $hx + 15, $hy + 12, 5, 3) }
    }

    $torso = [System.Drawing.Point[]]@(
        [System.Drawing.Point]::new(($offsetX + 25), ($offsetY + 59 + $bob)),
        [System.Drawing.Point]::new(($offsetX + 71), ($offsetY + 59 + $bob)),
        [System.Drawing.Point]::new(($offsetX + 63), ($offsetY + 96 + $bob)),
        [System.Drawing.Point]::new(($offsetX + 33), ($offsetY + 96 + $bob))
    )
    $g.FillPolygon($pale, $torso); $g.DrawPolygon($ink, $torso)
    $g.FillPolygon($skinShade, [System.Drawing.Point[]]@(
        [System.Drawing.Point]::new(($offsetX + 25), ($offsetY + 60 + $bob)), [System.Drawing.Point]::new(($offsetX + 38), ($offsetY + 64 + $bob)),
        [System.Drawing.Point]::new(($offsetX + 36), ($offsetY + 93 + $bob)), [System.Drawing.Point]::new(($offsetX + 30), ($offsetY + 91 + $bob))
    ))
    $g.DrawLine($detail, $offsetX + 48, $offsetY + 65 + $bob, $offsetX + 48, $offsetY + 91 + $bob)
    $g.DrawArc($detail, $offsetX + 35, $offsetY + 67 + $bob, 26, 15, 15, 150)
    $g.DrawArc($detail, $offsetX + 35, $offsetY + 78 + $bob, 26, 12, 195, 150)

    $armSwing = if ($phase -eq 1) { 5 } elseif ($phase -eq 3) { -5 } else { 0 }
    $armPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 194, 202, 193), 12)
    $g.DrawLine($ink, $offsetX + 27, $offsetY + 65 + $bob, $offsetX + 13, $offsetY + 91 + $bob + $armSwing)
    $g.DrawLine($armPen, $offsetX + 28, $offsetY + 65 + $bob, $offsetX + 14, $offsetY + 90 + $bob + $armSwing)
    $g.DrawLine($ink, $offsetX + 69, $offsetY + 65 + $bob, $offsetX + 80, $offsetY + 91 + $bob - $armSwing)
    $g.DrawLine($armPen, $offsetX + 68, $offsetY + 65 + $bob, $offsetX + 79, $offsetY + 90 + $bob - $armSwing)

    $blade = [System.Drawing.Point[]]@(
        [System.Drawing.Point]::new(($offsetX + 73), ($offsetY + 76 + $bob - $armSwing)),
        [System.Drawing.Point]::new(($offsetX + 92), ($offsetY + 69 + $bob - $armSwing)),
        [System.Drawing.Point]::new(($offsetX + 88), ($offsetY + 99 + $bob - $armSwing)),
        [System.Drawing.Point]::new(($offsetX + 76), ($offsetY + 94 + $bob - $armSwing))
    )
    $g.FillPolygon($steel, $blade); $g.DrawPolygon($ink, $blade); $g.DrawLine($steelLight, $offsetX + 84, $offsetY + 76 + $bob - $armSwing, $offsetX + 84, $offsetY + 93 + $bob - $armSwing)

    $g.FillRectangle($red, $offsetX + 29, $offsetY + 91 + $bob, 38, 9); $g.DrawRectangle($ink, $offsetX + 29, $offsetY + 91 + $bob, 38, 9)
    $pants = [System.Drawing.Point[]]@(
        [System.Drawing.Point]::new(($offsetX + 29), ($offsetY + 99 + $bob)), [System.Drawing.Point]::new(($offsetX + 67), ($offsetY + 99 + $bob)),
        [System.Drawing.Point]::new(($offsetX + 74), ($offsetY + 119)), [System.Drawing.Point]::new(($offsetX + 53), ($offsetY + 116)),
        [System.Drawing.Point]::new(($offsetX + 48), ($offsetY + 105 + $bob)), [System.Drawing.Point]::new(($offsetX + 43), ($offsetY + 116)),
        [System.Drawing.Point]::new(($offsetX + 22), ($offsetY + 119))
    )
    $g.FillPolygon($cloth, $pants); $g.DrawPolygon($ink, $pants)
    $step = if ($phase -eq 1) { 5 } elseif ($phase -eq 3) { -5 } else { 0 }
    $legPen = New-Object System.Drawing.Pen($deep.Color, 12)
    $g.DrawLine($legPen, $offsetX + 39, $offsetY + 112, $offsetX + 36 + $step, $offsetY + 125)
    $g.DrawLine($legPen, $offsetX + 57, $offsetY + 112, $offsetX + 60 - $step, $offsetY + 125)
    $g.FillEllipse($light, $offsetX + 29 + $step, $offsetY + 121, 16, 6); $g.FillEllipse($light, $offsetX + 52 - $step, $offsetY + 121, 16, 6)

    $ink.Dispose(); $detail.Dispose(); $gold.Dispose(); $pale.Dispose(); $light.Dispose(); $skinShade.Dispose(); $deep.Dispose(); $cloth.Dispose(); $red.Dispose(); $eye.Dispose(); $steel.Dispose(); $steelLight.Dispose(); $armPen.Dispose(); $legPen.Dispose()
}

function Draw-MahoragaSpritesV2([string]$directory) {
    [System.IO.Directory]::CreateDirectory($directory) | Out-Null
    $standby = New-Object System.Drawing.Bitmap(96, 512, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $standbyG = [System.Drawing.Graphics]::FromImage($standby)
    $standbyG.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $standbyG.Clear([System.Drawing.Color]::Transparent)
    for ($facing = 0; $facing -lt 4; $facing++) { Draw-MahoragaFrameV2 $standbyG 0 ($facing * 128) 0 $facing }
    Save-Icon $standby $standbyG (Join-Path $directory "Mahoraga_standby.png")

    $walk = New-Object System.Drawing.Bitmap(384, 512, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $walkG = [System.Drawing.Graphics]::FromImage($walk)
    $walkG.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $walkG.Clear([System.Drawing.Color]::Transparent)
    for ($facing = 0; $facing -lt 4; $facing++) {
        for ($phase = 0; $phase -lt 4; $phase++) { Draw-MahoragaFrameV2 $walkG ($phase * 96) ($facing * 128) $phase $facing }
    }
    Save-Icon $walk $walkG (Join-Path $directory "Mahoraga_walk.png")
}

function Draw-MahoragaFace([string]$path) {
    [System.IO.Directory]::CreateDirectory((Split-Path -Parent $path)) | Out-Null
    $canvas = New-Canvas 400 ([System.Drawing.Color]::FromArgb(255, 61, 49, 48)) ([System.Drawing.Color]::FromArgb(255, 10, 15, 22))
    $bitmap, $g = $canvas
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $ink = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 12, 15, 18), 14)
    $line = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(210, 70, 77, 74), 5)
    $gold = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 218, 166, 51), 10)
    $goldLight = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 255, 218, 102), 3)
    $red = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 202, 57, 42))
    $eye = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 92, 59))
    $skinBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        (New-Object System.Drawing.Rectangle(40, 80, 320, 320)),
        ([System.Drawing.Color]::FromArgb(255, 242, 239, 214)),
        ([System.Drawing.Color]::FromArgb(255, 119, 130, 126)), 115
    )
    $shade = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(170, 69, 79, 80))
    $darkCloth = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 28, 31, 38))
    $steel = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        (New-Object System.Drawing.Rectangle(285, 205, 115, 195)),
        ([System.Drawing.Color]::FromArgb(255, 242, 246, 222)),
        ([System.Drawing.Color]::FromArgb(255, 94, 116, 119)), 35
    )

    $g.DrawEllipse($ink, 56, 8, 288, 288); $g.DrawEllipse($gold, 61, 13, 278, 278); $g.DrawEllipse($goldLight, 67, 19, 266, 266)
    foreach ($angle in 0, 45, 90, 135, 180, 225, 270, 315) {
        $r = $angle * [Math]::PI / 180
        $ex = 200 + [Math]::Cos($r) * 165; $ey = 152 + [Math]::Sin($r) * 165
        $ix = 200 + [Math]::Cos($r) * 24; $iy = 152 + [Math]::Sin($r) * 24
        $g.DrawLine($ink, [float]$ix, [float]$iy, [float]$ex, [float]$ey)
        $g.DrawLine($gold, [float]$ix, [float]$iy, [float]$ex, [float]$ey)
        $g.FillEllipse($red, [float]($ex - 12), [float]($ey - 12), 24, 24)
    }

    $torso = [System.Drawing.Point[]]@(
        [System.Drawing.Point]::new(35, 284), [System.Drawing.Point]::new(115, 230),
        [System.Drawing.Point]::new(285, 230), [System.Drawing.Point]::new(365, 284),
        [System.Drawing.Point]::new(399, 399), [System.Drawing.Point]::new(1, 399)
    )
    $g.FillPolygon($skinBrush, $torso); $g.DrawPolygon($ink, $torso)
    $g.FillPolygon($shade, [System.Drawing.Point[]]@(
        [System.Drawing.Point]::new(35, 284), [System.Drawing.Point]::new(115, 230), [System.Drawing.Point]::new(152, 251),
        [System.Drawing.Point]::new(125, 399), [System.Drawing.Point]::new(1, 399)
    ))
    $g.FillPolygon($shade, [System.Drawing.Point[]]@(
        [System.Drawing.Point]::new(365, 284), [System.Drawing.Point]::new(285, 230), [System.Drawing.Point]::new(259, 251),
        [System.Drawing.Point]::new(294, 399), [System.Drawing.Point]::new(399, 399)
    ))

    $neck = [System.Drawing.Point[]]@(
        [System.Drawing.Point]::new(158, 205), [System.Drawing.Point]::new(242, 205),
        [System.Drawing.Point]::new(259, 270), [System.Drawing.Point]::new(141, 270)
    )
    $g.FillPolygon($skinBrush, $neck); $g.DrawPolygon($ink, $neck)
    $g.DrawLine($line, 200, 235, 200, 388)
    $g.DrawArc($line, 111, 260, 178, 82, 15, 150); $g.DrawArc($line, 108, 304, 184, 60, 195, 150)
    $g.DrawArc($line, 70, 284, 115, 83, 285, 95); $g.DrawArc($line, 215, 284, 115, 83, 160, 95)

    $leftWing = [System.Drawing.Point[]]@(
        [System.Drawing.Point]::new(80, 145), [System.Drawing.Point]::new(153, 103),
        [System.Drawing.Point]::new(163, 178), [System.Drawing.Point]::new(112, 199)
    )
    $rightWing = [System.Drawing.Point[]]@(
        [System.Drawing.Point]::new(320, 145), [System.Drawing.Point]::new(247, 103),
        [System.Drawing.Point]::new(237, 178), [System.Drawing.Point]::new(288, 199)
    )
    $g.FillPolygon($skinBrush, $leftWing); $g.DrawPolygon($ink, $leftWing)
    $g.FillPolygon($skinBrush, $rightWing); $g.DrawPolygon($ink, $rightWing)
    $g.DrawLine($line, 105, 155, 156, 132); $g.DrawLine($line, 295, 155, 244, 132)

    $g.FillEllipse($skinBrush, 145, 72, 110, 158); $g.DrawEllipse($ink, 145, 72, 110, 158)
    $topFin = [System.Drawing.Point[]]@(
        [System.Drawing.Point]::new(172, 88), [System.Drawing.Point]::new(200, 35),
        [System.Drawing.Point]::new(228, 88), [System.Drawing.Point]::new(216, 112), [System.Drawing.Point]::new(184, 112)
    )
    $g.FillPolygon($skinBrush, $topFin); $g.DrawPolygon($ink, $topFin)
    $g.FillPolygon($shade, [System.Drawing.Point[]]@(
        [System.Drawing.Point]::new(149, 156), [System.Drawing.Point]::new(251, 142),
        [System.Drawing.Point]::new(238, 211), [System.Drawing.Point]::new(163, 222)
    ))
    $g.DrawLine($line, 200, 102, 200, 202)
    $g.DrawArc($line, 161, 151, 78, 53, 18, 144)
    $g.FillEllipse($eye, 166, 137, 22, 10); $g.FillEllipse($eye, 212, 137, 22, 10)
    $g.DrawLine($ink, 161, 131, 190, 139); $g.DrawLine($ink, 239, 131, 210, 139)

    $g.FillRectangle($red, 68, 362, 264, 38); $g.DrawRectangle($ink, 68, 362, 264, 38)
    $g.FillPolygon($darkCloth, [System.Drawing.Point[]]@(
        [System.Drawing.Point]::new(55, 394), [System.Drawing.Point]::new(345, 394), [System.Drawing.Point]::new(399, 400), [System.Drawing.Point]::new(1, 400)
    ))
    $blade = [System.Drawing.Point[]]@(
        [System.Drawing.Point]::new(294, 208), [System.Drawing.Point]::new(397, 162),
        [System.Drawing.Point]::new(367, 366), [System.Drawing.Point]::new(299, 322)
    )
    $g.FillPolygon($steel, $blade); $g.DrawPolygon($ink, $blade)
    $g.DrawLine($goldLight, 342, 210, 338, 330)
    $g.FillEllipse($red, 292, 250, 30, 30)

    for ($i = 0; $i -lt 36; $i++) {
        $x = 75 + (($i * 67) % 250); $y = 245 + (($i * 41) % 125)
        $g.FillEllipse($shade, $x, $y, 3 + ($i % 3), 2 + ($i % 2))
    }

    $ink.Dispose(); $line.Dispose(); $gold.Dispose(); $goldLight.Dispose(); $red.Dispose(); $eye.Dispose(); $skinBrush.Dispose(); $shade.Dispose(); $darkCloth.Dispose(); $steel.Dispose()
    Save-Icon $bitmap $g $path
}

function Draw-MahoragaReferenceAssets([string]$referencePath, [string]$facePath, [string]$iconPath) {
    [System.IO.Directory]::CreateDirectory((Split-Path -Parent $facePath)) | Out-Null
    $source = [System.Drawing.Image]::FromFile($referencePath)

    $face = New-Object System.Drawing.Bitmap(400, 400, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $faceG = [System.Drawing.Graphics]::FromImage($face)
    $faceG.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $faceG.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $faceG.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $faceCropSize = [Math]::Min($source.Width, $source.Height)
    $faceCropY = [Math]::Min(28, $source.Height - $faceCropSize)
    $faceG.DrawImage($source,
        (New-Object System.Drawing.Rectangle(0, 0, 400, 400)),
        (New-Object System.Drawing.Rectangle(0, $faceCropY, $faceCropSize, $faceCropSize)),
        [System.Drawing.GraphicsUnit]::Pixel)
    $faceG.Dispose(); $face.Save($facePath, [System.Drawing.Imaging.ImageFormat]::Png); $face.Dispose()

    $icon = New-Object System.Drawing.Bitmap(100, 100, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $iconG = [System.Drawing.Graphics]::FromImage($icon)
    $iconG.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $iconG.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $iconG.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $iconCropSize = [Math]::Min(360, [Math]::Min($source.Width, $source.Height))
    $iconCropX = [Math]::Max(0, [Math]::Floor(($source.Width - $iconCropSize) / 2))
    $iconCropY = 18
    $iconG.DrawImage($source,
        (New-Object System.Drawing.Rectangle(0, 0, 100, 100)),
        (New-Object System.Drawing.Rectangle($iconCropX, $iconCropY, $iconCropSize, $iconCropSize)),
        [System.Drawing.GraphicsUnit]::Pixel)
    $frame = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 39, 22, 71), 4)
    $iconG.DrawRectangle($frame, 1, 1, 98, 98)
    $frame.Dispose(); $iconG.Dispose(); $icon.Save($iconPath, [System.Drawing.Imaging.ImageFormat]::Png); $icon.Dispose(); $source.Dispose()
}

function New-MahoragaPixelFrame($source, [int]$sourceX, [int]$sourceY, [int]$phase) {
    $frame = New-Object System.Drawing.Bitmap(48, 96, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($frame)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::None
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
    $g.Clear([System.Drawing.Color]::Transparent)

    $wheelDark = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 35, 27, 18), 4)
    $wheelGold = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 220, 171, 47), 2)
    $g.DrawEllipse($wheelDark, 6, 1, 36, 32); $g.DrawEllipse($wheelGold, 7, 2, 34, 30)
    foreach ($angle in 0, 45, 90, 135, 180, 225, 270, 315) {
        $r = $angle * [Math]::PI / 180
        $g.DrawLine($wheelGold, 24, 17, [int](24 + [Math]::Cos($r) * 21), [int](17 + [Math]::Sin($r) * 18))
        $node = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 238, 194, 69))
        $g.FillRectangle($node, [int](22 + [Math]::Cos($r) * 21), [int](15 + [Math]::Sin($r) * 18), 4, 4)
        $node.Dispose()
    }

    $body = New-Object System.Drawing.Bitmap(48, 96, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    for ($y = 0; $y -lt 96; $y++) {
        for ($x = 0; $x -lt 48; $x++) {
            $color = $source.GetPixel($sourceX + $x, $sourceY + $y)
            if ($color.A -eq 0) { continue }
            if ($y -lt 35 -and $x -ge 8 -and $x -le 40) { continue }
            $luma = [int](0.299 * $color.R + 0.587 * $color.G + 0.114 * $color.B)
            if ($luma -lt 24) {
                $mapped = [System.Drawing.Color]::FromArgb($color.A, 20, 24, 28)
            }
            elseif ($y -gt 63) {
                $v = [Math]::Min(95, 31 + [int]($luma * 0.45))
                $mapped = [System.Drawing.Color]::FromArgb($color.A, $v - 4, $v, $v + 8)
            }
            else {
                $v = [Math]::Min(240, 118 + [int]($luma * 0.72))
                $mapped = [System.Drawing.Color]::FromArgb($color.A, $v, [Math]::Min(245, $v + 4), [Math]::Max(105, $v - 10))
            }
            $body.SetPixel($x, $y, $mapped)
        }
    }
    $g.DrawImageUnscaled($body, 0, 0)

    $outline = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 17, 20, 23), 2)
    $pale = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 218, 220, 204))
    $shade = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 116, 125, 120))
    $redEye = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 239, 67, 49))
    $purple = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 139, 67, 236), 2)
    $steel = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 218, 228, 218))

    $leftWing = [System.Drawing.Point[]]@(
        [System.Drawing.Point]::new(7, 21), [System.Drawing.Point]::new(20, 13), [System.Drawing.Point]::new(21, 27), [System.Drawing.Point]::new(13, 30)
    )
    $rightWing = [System.Drawing.Point[]]@(
        [System.Drawing.Point]::new(41, 21), [System.Drawing.Point]::new(28, 13), [System.Drawing.Point]::new(27, 27), [System.Drawing.Point]::new(35, 30)
    )
    $g.FillPolygon($pale, $leftWing); $g.DrawPolygon($outline, $leftWing)
    $g.FillPolygon($pale, $rightWing); $g.DrawPolygon($outline, $rightWing)
    $g.FillEllipse($pale, 18, 12, 13, 19); $g.DrawEllipse($outline, 18, 12, 13, 19)
    $g.FillPolygon($shade, [System.Drawing.Point[]]@(
        [System.Drawing.Point]::new(19, 23), [System.Drawing.Point]::new(30, 21), [System.Drawing.Point]::new(27, 29), [System.Drawing.Point]::new(21, 30)
    ))
    $g.FillRectangle($redEye, 20, 20, 3, 2); $g.FillRectangle($redEye, 26, 20, 3, 2)

    $blade = [System.Drawing.Point[]]@(
        [System.Drawing.Point]::new(35, 43), [System.Drawing.Point]::new(47, 36), [System.Drawing.Point]::new(44, 68), [System.Drawing.Point]::new(37, 62)
    )
    $g.FillPolygon($steel, $blade); $g.DrawPolygon($outline, $blade)
    $g.DrawLine($purple, 3, 43 + ($phase % 2), 8, 39); $g.DrawLine($purple, 42, 29, 46, 25)
    $g.DrawLine($purple, 5, 66, 10, 62); $g.DrawLine($purple, 37, 73, 44, 69)

    $wheelDark.Dispose(); $wheelGold.Dispose(); $body.Dispose(); $outline.Dispose(); $pale.Dispose(); $shade.Dispose(); $redEye.Dispose(); $purple.Dispose(); $steel.Dispose(); $g.Dispose()
    return $frame
}

function Draw-MahoragaPixelSprites([string]$projectRoot, [string]$directory) {
    $standbySource = [System.Drawing.Bitmap]::FromFile((Join-Path $projectRoot "asset/image/avatar/character/blackKnight/BlackKnight_standby.png"))
    $walkSource = [System.Drawing.Bitmap]::FromFile((Join-Path $projectRoot "asset/image/avatar/character/blackKnight/BlackKnight_walk.png"))
    $standby = New-Object System.Drawing.Bitmap(96, 768, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $walk = New-Object System.Drawing.Bitmap(384, 768, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $standbyG = [System.Drawing.Graphics]::FromImage($standby); $walkG = [System.Drawing.Graphics]::FromImage($walk)
    $standbyG.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
    $walkG.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
    $standbyG.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
    $walkG.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
    $standbyG.Clear([System.Drawing.Color]::Transparent); $walkG.Clear([System.Drawing.Color]::Transparent)
    for ($direction = 0; $direction -lt 4; $direction++) {
        $logical = New-MahoragaPixelFrame $standbySource 0 ($direction * 96) 0
        $standbyG.DrawImage($logical, (New-Object System.Drawing.Rectangle(0, ($direction * 192), 96, 192)), 0, 0, 48, 96, [System.Drawing.GraphicsUnit]::Pixel)
        $logical.Dispose()
        for ($phase = 0; $phase -lt 4; $phase++) {
            $logical = New-MahoragaPixelFrame $walkSource ($phase * 48) ($direction * 96) $phase
            $walkG.DrawImage($logical, (New-Object System.Drawing.Rectangle(($phase * 96), ($direction * 192), 96, 192)), 0, 0, 48, 96, [System.Drawing.GraphicsUnit]::Pixel)
            $logical.Dispose()
        }
    }
    $standbySource.Dispose(); $walkSource.Dispose(); $standbyG.Dispose(); $walkG.Dispose()
    $standby.Save((Join-Path $directory "Mahoraga_standby.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $walk.Save((Join-Path $directory "Mahoraga_walk.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $standby.Dispose(); $walk.Dispose()
}

Draw-MushroomIcon (Join-Path $skillDir "Summoner_mushroom.png")
Draw-FlowerIcon (Join-Path $skillDir "Summoner_flower.png")
Draw-TreeIcon (Join-Path $skillDir "Summoner_tree.png")
Draw-BlessingIcon (Join-Path $skillDir "Summoner_blessing.png")
Draw-ClassIcon (Join-Path $classDir "icon_occupation_summoner.png")
# Final Mahoraga art is generated from approved references and maintained by
# tools/process_mahoraga_generated_art.py. Do not overwrite it with placeholders.
