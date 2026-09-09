"""Build deterministic, project-local pixel art for 岚绫.

The source pack already contains a human-proportioned dual-blade thief.  This
script gives it a separate palette (deep teal, warm orange and brass), creates
the diagonal views required by the eight-direction avatar format, and emits
newly named battler, face, class and skill/status icons.  No source asset is
overwritten.
"""

from __future__ import annotations

import colorsys
import json
import math
import os
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter, ImageOps


ROOT = Path(__file__).resolve().parents[1]
CELL_W, CELL_H = 48, 96
ROWS_4 = {"down": 0, "left": 1, "right": 2, "up": 3}
ROWS_8 = ("left", "up_left", "up", "up_right", "right", "down_right", "down", "down_left")
REFERENCE_ENV = "YANLING_REFERENCE"
REFERENCE_DEFAULT = Path(r"C:\Users\TU\AppData\Local\Temp\codex-clipboard-7e8656b5-367a-42a9-8e13-76f50ffca477.png")


def recolor(image: Image.Image) -> Image.Image:
    """Shift the source thief palette without changing its silhouette/alpha."""
    image = image.convert("RGBA")
    pixels = image.load()
    for y in range(image.height):
        for x in range(image.width):
            r, g, b, a = pixels[x, y]
            if a == 0:
                continue
            h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            # Green cloth -> blue/cyan martial-arts fabric from the reference palette.
            if s > 0.18 and 0.18 <= h <= 0.48 and g >= r * 1.04:
                h = 0.62 if v < 0.60 else 0.54
                s = min(0.88, s * 1.14)
                v = min(0.94, v * 0.94 + 0.03)
            # Brown/red cloth and knife hilts -> warm orange/red accents.
            elif s > 0.22 and (h <= 0.08 or h >= 0.96) and r >= g * 1.08:
                h = 0.035 if v > 0.45 else 0.98
                s = min(0.92, s * 1.16)
                v = min(0.96, v * 1.04)
            # Near-black outlines become a cool navy, retaining contrast.
            elif v < 0.22:
                h, s, v = 0.68, 0.52, max(0.10, v * 0.92)
            pixels[x, y] = tuple(round(c * 255) for c in colorsys.hsv_to_rgb(h, s, v)) + (a,)
    return image


def alpha_bbox(image: Image.Image):
    alpha = image.getchannel("A")
    return alpha.point(lambda value: 255 if value > 8 else 0).getbbox()


def fit_frame(image: Image.Image) -> Image.Image:
    frame = Image.new("RGBA", (CELL_W, CELL_H))
    bbox = alpha_bbox(image)
    if not bbox:
        return frame
    subject = image.crop(bbox)
    scale = min((CELL_W - 4) / subject.width, (CELL_H - 2) / subject.height)
    subject = subject.resize(
        (max(1, round(subject.width * scale)), max(1, round(subject.height * scale))),
        Image.Resampling.LANCZOS,
    )
    frame.alpha_composite(subject, ((CELL_W - subject.width) // 2, CELL_H - subject.height - 1))
    return frame


def add_hair_accent(frame: Image.Image) -> Image.Image:
    """Give the pixel sprite a readable magenta crest without changing its body."""
    bbox = alpha_bbox(frame)
    if not bbox:
        return frame
    x0, y0, x1, y1 = bbox
    cx = (x0 + x1) // 2
    head_y = y0 + max(2, round((y1 - y0) * 0.12))
    magenta = (210, 54, 143, 245)
    dark_magenta = (100, 26, 90, 255)
    draw = ImageDraw.Draw(frame)
    draw.polygon(
        [(cx - 10, head_y + 7), (cx - 7, head_y - 3), (cx - 3, head_y + 3),
         (cx, head_y - 7), (cx + 3, head_y + 2), (cx + 8, head_y - 2),
         (cx + 9, head_y + 8)],
        fill=dark_magenta,
    )
    draw.line([(cx - 7, head_y + 5), (cx - 3, head_y - 1), (cx, head_y + 3),
               (cx + 3, head_y - 2), (cx + 7, head_y + 5)], fill=magenta, width=2)
    return frame


def add_walk_identity(frame: Image.Image) -> Image.Image:
    """Carry Yanling's magenta hair, orange sash and cyan blade cues into 48px sprites."""
    bbox = alpha_bbox(frame)
    if not bbox:
        return frame
    x0, y0, x1, y1 = bbox
    cx = (x0 + x1) // 2
    height = max(1, y1 - y0)
    pixels = frame.load()
    for y in range(y0, y1):
        rel_y = (y - y0) / max(1, y1 - y0)
        for x in range(x0, x1):
            r, g, b, a = pixels[x, y]
            if a < 20:
                continue
            spread = max(r, g, b) - min(r, g, b)
            value = max(r, g, b) / 255
            # The source sprite's gray cloth becomes blue-violet fabric while
            # leaving skin and the dark outline untouched.
            if 0.22 <= rel_y <= 0.86 and spread < 48 and value < 0.82:
                h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
                h = 0.69 if rel_y < 0.58 else 0.78
                s = 0.58 if value > 0.28 else 0.42
                pixels[x, y] = tuple(round(c * 255) for c in colorsys.hsv_to_rgb(h, s, v)) + (a,)
    draw = ImageDraw.Draw(frame)
    magenta = (210, 54, 143, 235)
    dark_magenta = (91, 26, 87, 255)
    orange = (228, 107, 48, 235)
    cyan = (50, 198, 216, 210)
    head_y = y0 + max(1, round(height * 0.13))
    draw.polygon(
        [(cx - 7, head_y + 5), (cx - 6, head_y - 2), (cx - 3, head_y + 1),
         (cx, head_y - 6), (cx + 3, head_y + 1), (cx + 6, head_y - 2),
         (cx + 7, head_y + 6)],
        fill=dark_magenta,
    )
    draw.line([(cx - 6, head_y + 4), (cx - 3, head_y - 1), (cx, head_y + 2),
               (cx + 3, head_y - 1), (cx + 6, head_y + 4)], fill=magenta, width=2)
    waist_y = y0 + round(height * 0.58)
    draw.line([(max(x0, cx - 9), waist_y), (min(x1, cx + 9), waist_y)], fill=orange, width=2)
    if x1 - x0 >= 16:
        blade_x = min(x1 + 1, cx + 13)
        draw.line([(blade_x - 4, y0 + round(height * 0.36)),
                   (blade_x + 1, y0 + round(height * 0.65))], fill=cyan, width=2)
    return frame


def extract_reference_subject(source_path: Path) -> Image.Image:
    """Extract the central fighter from the supplied reference without shipping it."""
    image = Image.open(source_path).convert("RGBA")
    width, height = image.size
    # Coordinates are normalized from the supplied transparent key art. The
    # mask keeps the low stance, crossed arms and both karambit hands while
    # excluding most of the surrounding paint strokes.
    points = [
        (0.38, 0.08), (0.56, 0.08), (0.67, 0.26), (0.65, 0.43),
        (0.76, 0.59), (0.95, 0.84), (0.93, 0.96), (0.74, 0.97),
        (0.58, 0.79), (0.50, 0.91), (0.35, 0.97), (0.09, 0.93),
        (0.11, 0.79), (0.29, 0.61), (0.34, 0.44), (0.34, 0.27),
    ]
    mask = Image.new("L", image.size, 0)
    ImageDraw.Draw(mask).polygon([(round(x * width), round(y * height)) for x, y in points], fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(radius=max(1, round(width * 0.002))))
    image.putalpha(ImageChops.multiply(image.getchannel("A"), mask))
    bbox = image.getchannel("A").getbbox()
    if not bbox:
        raise ValueError("Reference image has no usable transparent subject")
    subject = image.crop(bbox)
    # Reduce the photographic sheen so it sits with the project's illustrated
    # battlers, while preserving the magenta/cyan/orange identity.
    subject = ImageEnhance.Color(subject).enhance(1.12)
    subject = ImageEnhance.Contrast(subject).enhance(1.05)
    return subject


def extract_reference_upper(source_path: Path) -> Image.Image:
    """Extract only the detailed head, arms and torso for the walk sprite."""
    image = Image.open(source_path).convert("RGBA")
    width, height = image.size
    points = [
        (0.29, 0.05), (0.59, 0.05), (0.67, 0.20), (0.68, 0.38),
        (0.64, 0.55), (0.67, 0.72), (0.53, 0.78), (0.43, 0.72),
        (0.30, 0.76), (0.24, 0.59), (0.25, 0.37), (0.28, 0.19),
    ]
    mask = Image.new("L", image.size, 0)
    ImageDraw.Draw(mask).polygon([(round(x * width), round(y * height)) for x, y in points], fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(radius=max(1, round(width * 0.002))))
    image.putalpha(ImageChops.multiply(image.getchannel("A"), mask))
    bbox = image.getchannel("A").getbbox()
    if not bbox:
        raise ValueError("Reference image has no usable upper-body subject")
    subject = image.crop(bbox)
    subject = ImageEnhance.Color(subject).enhance(1.10)
    subject = ImageEnhance.Contrast(subject).enhance(1.04)
    return subject


def fit_reference_square(
    subject: Image.Image,
    size: int = 220,
    rotation: float = 0,
    scale: float = 1.0,
    offset: tuple[int, int] = (0, 0),
    stretch: tuple[float, float] = (1.0, 1.0),
) -> Image.Image:
    """Place a reference pose into one battler cell with controlled motion."""
    canvas = Image.new("RGBA", (size, size))
    fit = ImageOps.contain(subject, (size - 8, size - 8), Image.Resampling.LANCZOS)
    fit = fit.resize((max(1, round(fit.width * scale)), max(1, round(fit.height * scale))), Image.Resampling.LANCZOS)
    fit = fit.resize(
        (max(1, round(fit.width * stretch[0])), max(1, round(fit.height * stretch[1]))),
        Image.Resampling.LANCZOS,
    )
    fit = fit.rotate(rotation, resample=Image.Resampling.BICUBIC, expand=True)
    fit = ImageOps.contain(fit, (size - 4, size - 4), Image.Resampling.LANCZOS)
    canvas.alpha_composite(
        fit,
        ((size - fit.width) // 2 + offset[0], (size - fit.height) // 2 + offset[1]),
    )
    return canvas


def draw_action_effects(canvas: Image.Image, action: str, frame_index: int) -> None:
    """Add readable blue/pink arcs matching the reference video's motion language."""
    draw = ImageDraw.Draw(canvas)
    cyan = (46, 201, 224, 180)
    pink = (238, 92, 180, 175)
    white = (238, 242, 255, 185)
    if action == "attack":
        if 2 <= frame_index <= 9:
            start = 208 - frame_index * 9
            end = 312 - frame_index * 4
            draw.arc((-28, 36, 248, 230), start, end, fill=cyan, width=7)
            draw.arc((-18, 46, 238, 220), start + 5, end + 7, fill=pink, width=3)
        if 4 <= frame_index <= 8:
            draw.line([(32, 182), (96 + frame_index * 6, 114), (202, 82)], fill=white, width=3)
    elif action == "release":
        sweep = 18 + frame_index * 24
        draw.arc((-24, -12, 244, 242), sweep, sweep + 110, fill=cyan, width=9)
        draw.arc((12, 12, 208, 208), sweep + 28, sweep + 102, fill=pink, width=5)
        if 3 <= frame_index <= 9:
            draw.line([(26, 182), (110, 110), (198, 34)], fill=white, width=3)
    elif action == "defense":
        draw.arc((18, 12, 202, 204), 205, 335, fill=cyan, width=6)
        draw.arc((28, 24, 192, 194), 210, 325, fill=pink, width=3)
    elif action == "hit" and frame_index <= 7:
        draw.line([(182, 54), (204, 42)], fill=pink, width=5)
        draw.line([(184, 72), (211, 70)], fill=cyan, width=4)


def action_pose(action: str, frame_index: int) -> tuple[float, float, tuple[int, int], tuple[float, float]]:
    """Return rotation, scale, offset and squash for a 13-frame action."""
    poses = {
        "standby": (
            [0, -1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0],
            [1.00, 1.01, 1.01, 1.00, 0.99, 0.99, 1.00, 1.01, 1.01, 1.00, 0.99, 0.99, 1.00],
            [(0, 0), (0, 1), (0, 1), (0, 0), (0, -1), (0, -1), (0, 0), (0, 1), (0, 1), (0, 0), (0, -1), (0, -1), (0, 0)],
            [(1.00, 1.00)] * 13,
        ),
        "attack": (
            [-13, -11, -7, 0, 10, 22, 31, 18, 5, -7, -4, 0, 3],
            [0.97, 0.99, 1.01, 1.04, 1.07, 1.10, 1.08, 1.05, 1.02, 1.00, 0.99, 1.00, 1.00],
            [(-6, 4), (-4, 3), (0, 2), (5, 1), (10, 0), (14, 1), (11, 4), (6, 5), (1, 3), (-4, 1), (-3, 0), (0, 0), (1, 0)],
            [(1.00, 1.00), (1.02, 0.98), (1.05, 0.96), (1.08, 0.94), (1.10, 0.92), (1.12, 0.90), (1.08, 0.93), (1.04, 0.96), (1.02, 0.98), (1.00, 1.00), (1.00, 1.00), (1.00, 1.00), (1.00, 1.00)],
        ),
        "release": (
            [0, -8, -18, -31, -10, 14, 39, 62, 40, 19, 8, 1, -3],
            [0.98, 1.00, 1.02, 1.05, 1.08, 1.10, 1.08, 1.05, 1.03, 1.01, 1.00, 0.99, 0.99],
            [(0, 2), (1, 1), (3, 0), (6, -2), (9, -1), (10, 2), (6, 5), (0, 7), (-5, 5), (-5, 3), (-3, 1), (0, 0), (0, 0)],
            [(1.00, 1.00), (1.02, 0.98), (1.04, 0.96), (1.08, 0.92), (1.10, 0.91), (1.12, 0.90), (1.14, 0.88), (1.10, 0.91), (1.06, 0.94), (1.03, 0.97), (1.01, 0.99), (1.00, 1.00), (1.00, 1.00)],
        ),
        "hit": (
            [0, -6, -12, -17, -12, -7, -2, 4, 8, 5, 2, 0, 0],
            [1.00, 1.00, 0.98, 0.96, 0.95, 0.96, 0.98, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00],
            [(0, 0), (-2, 0), (-5, 1), (-8, 4), (-10, 7), (-9, 9), (-6, 8), (-3, 5), (-1, 2), (0, 1), (0, 0), (0, 0), (0, 0)],
            [(1.00, 1.00), (0.98, 1.02), (0.96, 1.04), (0.94, 1.06), (0.93, 1.07), (0.95, 1.05), (0.98, 1.02), (1.00, 1.00), (1.00, 1.00), (1.00, 1.00), (1.00, 1.00), (1.00, 1.00), (1.00, 1.00)],
        ),
        "defense": (
            [2, 4, 7, 10, 8, 5, 2, 0, -2, 0, 2, 2, 2],
            [0.98, 0.98, 0.97, 0.96, 0.97, 0.98, 0.99, 1.00, 1.00, 0.99, 0.98, 0.98, 0.98],
            [(0, 3), (0, 3), (0, 4), (0, 5), (0, 5), (0, 4), (0, 3), (0, 2), (0, 1), (0, 1), (0, 2), (0, 2), (0, 2)],
            [(1.00, 1.00)] * 13,
        ),
        "die": (
            [3, 10, 19, 30, 42, 54, 66, 78, 88, 98, 108, 116, 122],
            [1.00, 1.00, 0.99, 0.98, 0.97, 0.96, 0.95, 0.94, 0.93, 0.92, 0.91, 0.90, 0.89],
            [(0, 0), (1, 2), (2, 5), (3, 9), (4, 13), (5, 18), (6, 23), (8, 28), (10, 32), (12, 35), (14, 38), (16, 40), (18, 41)],
            [(1.00, 1.00), (1.00, 1.00), (1.02, 0.98), (1.04, 0.96), (1.06, 0.94), (1.08, 0.92), (1.10, 0.90), (1.12, 0.88), (1.15, 0.85), (1.18, 0.82), (1.20, 0.80), (1.22, 0.78), (1.24, 0.76)],
        ),
    }
    rotations, scales, offsets, stretches = poses[action]
    return rotations[frame_index], scales[frame_index], offsets[frame_index], stretches[frame_index]


def build_reference_art(subject: Image.Image) -> None:
    """Create the portrait and six full-size battle sheets from the reference pose."""
    output_dir = ROOT / "asset/image/avatar/battler/yanling"
    output_dir.mkdir(parents=True, exist_ok=True)
    for action in ("standby", "attack", "release", "die", "hit", "defense"):
        sheet = Image.new("RGBA", (220 * 13, 220))
        for frame_index in range(13):
            angle, scale, offset, stretch = action_pose(action, frame_index)
            frame = Image.new("RGBA", (220, 220))
            draw_action_effects(frame, action, frame_index)
            frame.alpha_composite(fit_reference_square(subject, 220, angle, scale, offset, stretch))
            sheet.alpha_composite(frame, (frame_index * 220, 0))
        sheet.save(output_dir / f"Yanling_{action}.png", optimize=True)

    face_dir = ROOT / "asset/image/picture/face/yanling"
    face_dir.mkdir(parents=True, exist_ok=True)
    face = ImageOps.contain(subject, (244, 244), Image.Resampling.LANCZOS)
    face_canvas = Image.new("RGBA", (256, 256))
    face_canvas.alpha_composite(face, ((256 - face.width) // 2, (256 - face.height) // 2))
    face_canvas.save(face_dir / "Yanling_normal.png", optimize=True)


def three_quarter(side: Image.Image, depth: Image.Image) -> Image.Image:
    scale = 4
    size = (CELL_W * scale, CELL_H * scale)
    side_layer = side.resize(size, Image.Resampling.LANCZOS)
    depth_layer = depth.resize(size, Image.Resampling.LANCZOS)
    mask = Image.new("L", size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle(
        (round(size[0] * 0.18), round(size[1] * 0.05), round(size[0] * 0.84), round(size[1] * 0.90)),
        radius=round(size[0] * 0.14),
        fill=74,
    )
    mask = mask.filter(ImageFilter.GaussianBlur(radius=round(size[0] * 0.06)))
    overlay_alpha = ImageChops.multiply(depth_layer.getchannel("A"), mask)
    overlay = depth_layer.copy()
    overlay.putalpha(overlay_alpha)
    result = side_layer.copy()
    result.alpha_composite(overlay)
    return result.resize((CELL_W, CELL_H), Image.Resampling.LANCZOS)


# Draw at 2x and reduce with nearest-neighbour to keep intentional pixel blocks.
WALK_DRAW_SCALE = 2


def _walk_xy(point: tuple[float, float]) -> tuple[int, int]:
    return (round(point[0] * WALK_DRAW_SCALE), round(point[1] * WALK_DRAW_SCALE))


def _walk_polygon(draw: ImageDraw.ImageDraw, points, fill, outline=None, width=1) -> None:
    scaled = [_walk_xy(point) for point in points]
    draw.polygon(scaled, fill=fill)
    if outline:
        draw.line(scaled + [scaled[0]], fill=outline, width=width * WALK_DRAW_SCALE, joint="curve")


def _walk_line(draw: ImageDraw.ImageDraw, points, fill, width=1) -> None:
    draw.line([_walk_xy(point) for point in points], fill=fill, width=max(1, width * WALK_DRAW_SCALE), joint="curve")


def _walk_ellipse(draw: ImageDraw.ImageDraw, box, fill, outline=None, width=1) -> None:
    scaled = tuple(round(value * WALK_DRAW_SCALE) for value in box)
    draw.ellipse(scaled, fill=fill, outline=outline, width=width * WALK_DRAW_SCALE if outline else 1)


def new_walk_frame(direction: str, frame_index: int) -> Image.Image:
    """Draw a new human-proportioned Yanling sprite without reusing old frames."""
    image = Image.new("RGBA", (CELL_W * WALK_DRAW_SCALE, CELL_H * WALK_DRAW_SCALE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    outline = (24, 19, 38, 255)
    hair_dark = (93, 25, 86, 255)
    hair = (208, 56, 143, 255)
    hair_light = (239, 111, 183, 255)
    skin = (219, 137, 100, 255)
    skin_shadow = (156, 73, 72, 255)
    blue = (35, 68, 151, 255)
    blue_light = (47, 143, 190, 255)
    purple = (83, 43, 126, 255)
    orange = (226, 91, 47, 255)
    wrap = (220, 214, 211, 255)
    blade = (102, 227, 227, 255)
    blade_shadow = (30, 126, 161, 255)

    # Four-frame contact cycle: planted, passing, extended, passing.
    stride_values = (-4, -1, 4, 1)
    stride = stride_values[frame_index % 4]
    bob = (1, 0, -1, 0)[frame_index % 4]
    is_back = direction in ("up", "up_left", "up_right")
    is_side = direction in ("left", "right")
    is_right = direction in ("right", "up_right", "down_right")
    depth = 1 if direction in ("down_left", "down_right") else 0
    cx = 24 + (2 if is_side and is_right else -2 if is_side else 0)
    head_y = 18 + bob
    hip_y = 53 + bob

    # Legs are drawn behind the tunic so the silhouette reads clearly at 1x.
    back_leg = stride * 0.65
    front_leg = -stride * 0.85
    if is_back:
        _walk_polygon(draw, [(cx - 6, hip_y), (cx - 1, hip_y), (cx - 5 + back_leg, 68 + bob), (cx - 8 + back_leg, 85), (cx - 12 + back_leg, 85), (cx - 9 + back_leg, 66 + bob)], purple, outline)
        _walk_polygon(draw, [(cx + 1, hip_y), (cx + 7, hip_y), (cx + 9 + front_leg, 67 + bob), (cx + 13 + front_leg, 84), (cx + 9 + front_leg, 87), (cx + 4 + front_leg, 69 + bob)], blue, outline)
    else:
        _walk_polygon(draw, [(cx - 6, hip_y), (cx - 1, hip_y + 1), (cx - 5 + back_leg, 68 + bob), (cx - 9 + back_leg, 85), (cx - 13 + back_leg, 85), (cx - 9 + back_leg, 66 + bob)], blue, outline)
        _walk_polygon(draw, [(cx + 1, hip_y + 1), (cx + 7, hip_y), (cx + 9 + front_leg, 67 + bob), (cx + 14 + front_leg, 84), (cx + 10 + front_leg, 87), (cx + 4 + front_leg, 69 + bob)], purple, outline)
    _walk_line(draw, [(cx - 8 + back_leg, 84), (cx - 13 + back_leg, 87)], orange, 2)
    _walk_line(draw, [(cx + 10 + front_leg, 85), (cx + 15 + front_leg, 87)], orange, 2)

    # Low, athletic torso and sash.
    _walk_polygon(draw, [(cx - 9, 28 + bob), (cx + 8, 28 + bob), (cx + 9, hip_y), (cx + 4, 59 + bob), (cx - 7, 59 + bob), (cx - 10, hip_y)], blue, outline)
    _walk_polygon(draw, [(cx - 3, 31 + bob), (cx + 5, 31 + bob), (cx + 4, 54 + bob), (cx - 4, 54 + bob)], purple)
    _walk_line(draw, [(cx - 9, 48 + bob), (cx + 9, 48 + bob)], orange, 2)
    _walk_line(draw, [(cx - 6, 49 + bob), (cx - 2, 63 + bob)], orange, 1)
    _walk_line(draw, [(cx + 6, 49 + bob), (cx + 2, 63 + bob)], orange, 1)

    if is_back:
        _walk_polygon(draw, [(cx - 7, 30 + bob), (cx + 7, 30 + bob), (cx + 5, 49 + bob), (cx - 5, 49 + bob)], (28, 46, 111, 255))
        _walk_line(draw, [(cx - 5, 34 + bob), (cx + 5, 34 + bob)], blue_light, 1)

    # Wrapped forearms and two small karambit silhouettes.
    if is_side:
        hand_x = cx + (13 if is_right else -13)
        _walk_line(draw, [(cx + (5 if is_right else -5), 32 + bob), (hand_x, 43 + bob)], skin_shadow, 5)
        _walk_line(draw, [(cx + (6 if is_right else -6), 33 + bob), (hand_x, 42 + bob)], wrap, 3)
        _walk_line(draw, [(hand_x, 42 + bob), (hand_x + (9 if is_right else -9), 39 + bob)], blade_shadow, 3)
        _walk_line(draw, [(hand_x, 42 + bob), (hand_x + (10 if is_right else -10), 38 + bob)], blade, 1)
    else:
        left_hand = (cx - 10, 42 + bob + depth)
        right_hand = (cx + 10, 42 + bob + depth)
        _walk_line(draw, [(cx - 7, 32 + bob), left_hand], skin_shadow, 5)
        _walk_line(draw, [(cx - 7, 32 + bob), left_hand], wrap, 3)
        _walk_line(draw, [(cx + 7, 32 + bob), right_hand], skin_shadow, 5)
        _walk_line(draw, [(cx + 7, 32 + bob), right_hand], wrap, 3)
        _walk_line(draw, [left_hand, (cx - 17, 36 + bob)], blade_shadow, 3)
        _walk_line(draw, [left_hand, (cx - 18, 34 + bob)], blade, 1)
        _walk_line(draw, [right_hand, (cx + 17, 36 + bob)], blade_shadow, 3)
        _walk_line(draw, [right_hand, (cx + 18, 34 + bob)], blade, 1)

    # Head, face and the distinctive magenta crest are drawn last.
    _walk_ellipse(draw, (cx - 7, head_y - 7, cx + 7, head_y + 9), skin_shadow if is_back else skin, outline, 1)
    if not is_back:
        _walk_ellipse(draw, (cx - 5, head_y - 1, cx - 2, head_y + 2), outline)
        _walk_ellipse(draw, (cx + 2, head_y - 1, cx + 5, head_y + 2), outline)
        _walk_line(draw, [(cx - 4, head_y + 5), (cx + 4, head_y + 5)], skin_shadow, 1)
    _walk_polygon(
        draw,
        [(cx - 8, head_y + 1), (cx - 8, head_y - 6), (cx - 4, head_y - 11),
         (cx - 1, head_y - 8), (cx + 2, head_y - 13), (cx + 4, head_y - 8),
         (cx + 8, head_y - 10), (cx + 8, head_y + 2), (cx + 4, head_y - 2),
         (cx, head_y - 1), (cx - 4, head_y - 2)],
        hair_dark,
        outline,
    )
    _walk_line(draw, [(cx - 6, head_y - 5), (cx - 3, head_y - 8), (cx, head_y - 5),
                      (cx + 3, head_y - 10), (cx + 6, head_y - 6)], hair, 2)
    _walk_line(draw, [(cx - 2, head_y - 6), (cx + 1, head_y - 10)], hair_light, 1)

    return image.resize((CELL_W, CELL_H), Image.Resampling.NEAREST)


def reference_walk_frame(subject: Image.Image, upper: Image.Image, direction: str, frame_index: int) -> Image.Image:
    """Build a detailed walk cell from new upper-body art plus new leg poses."""
    rotations = {
        "left": -16, "up_left": -10, "up": 0, "up_right": 10,
        "right": 16, "down_right": 10, "down": 0, "down_left": -10,
    }
    stride = (-3, 0, 3, 0)[frame_index % 4]
    bob = (1, 0, -1, 0)[frame_index % 4]
    direction_rotation = rotations[direction]
    frame = Image.new("RGBA", (CELL_W, CELL_H))
    draw = ImageDraw.Draw(frame)
    outline = (24, 19, 38, 255)
    blue = (35, 68, 151, 255)
    blue_light = (47, 143, 190, 255)
    purple = (83, 43, 126, 255)
    orange = (226, 91, 47, 255)
    cyan = (50, 198, 216, 220)
    cx = 24 + stride * 0.35
    hip_y = 52 + bob
    back_leg = stride * 0.75
    front_leg = -stride * 0.90
    # New lower-body construction gives the sprite a stable adult silhouette.
    _walk_polygon(draw, [(cx - 7, hip_y), (cx - 1, hip_y), (cx - 5 + back_leg, 67 + bob), (cx - 10 + back_leg, 85), (cx - 14 + back_leg, 85), (cx - 9 + back_leg, 65 + bob)], blue, outline)
    _walk_polygon(draw, [(cx + 1, hip_y), (cx + 7, hip_y), (cx + 9 + front_leg, 67 + bob), (cx + 14 + front_leg, 84), (cx + 10 + front_leg, 87), (cx + 4 + front_leg, 69 + bob)], purple, outline)
    _walk_line(draw, [(cx - 10 + back_leg, 84), (cx - 15 + back_leg, 87)], orange, 2)
    _walk_line(draw, [(cx + 10 + front_leg, 85), (cx + 15 + front_leg, 87)], orange, 2)
    _walk_polygon(draw, [(cx - 10, 43 + bob), (cx + 10, 43 + bob), (cx + 8, 61 + bob), (cx + 3, 66 + bob), (cx - 6, 64 + bob), (cx - 10, 58 + bob)], purple, outline)
    _walk_line(draw, [(cx - 9, 48 + bob), (cx + 9, 48 + bob)], orange, 2)
    # Refit only the upper body; this preserves the reference's face and wraps.
    upper_fit = ImageOps.contain(upper, (42, 58), Image.Resampling.LANCZOS)
    upper_fit = upper_fit.rotate(direction_rotation + stride * 0.45, resample=Image.Resampling.BICUBIC, expand=True)
    upper_fit = ImageOps.contain(upper_fit, (44, 59), Image.Resampling.LANCZOS)
    if direction in ("right", "up_right", "down_right"):
        upper_fit = ImageOps.mirror(upper_fit)
    if direction in ("up", "up_left", "up_right"):
        # A cooler value shift distinguishes the back-facing rows while
        # preserving the same hair and costume silhouette.
        upper_fit = ImageEnhance.Brightness(upper_fit).enhance(0.72)
        upper_fit = ImageEnhance.Color(upper_fit).enhance(0.88)
    frame.alpha_composite(upper_fit, ((CELL_W - upper_fit.width) // 2 + round(stride * 0.35), 4 + bob))
    draw = ImageDraw.Draw(frame)
    # Tiny cyan edge highlights read as the twin karambit blades at 1x.
    if direction in ("left", "up_left", "down_left"):
        _walk_line(draw, [(10, 38 + bob), (3, 34 + bob)], cyan, 1)
    else:
        _walk_line(draw, [(38, 38 + bob), (45, 34 + bob)], cyan, 1)
    return frame


def recolor_pixel_reference(image: Image.Image) -> Image.Image:
    """Create a new Yanling palette from the project's detailed female pixel template."""
    image = image.convert("RGBA")
    pixels = image.load()
    for y in range(image.height):
        local_y = y % CELL_H
        rel_y = local_y / CELL_H
        for x in range(image.width):
            r, g, b, a = pixels[x, y]
            if a < 16:
                continue
            h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            # Preserve outlines, face, bandages and highlights. Re-map only
            # the colored costume/hair clusters into Yanling's palette.
            if v < 0.18 or (s < 0.12 and v > 0.78):
                continue
            if rel_y < 0.34 and s > 0.20:
                # Hair: purple/pink crest.
                h, s, v = 0.92, min(0.90, max(0.55, s)), min(0.95, v * 1.06)
            elif 0.27 <= rel_y < 0.65 and s > 0.18:
                # Jacket and sash: deep blue with cyan edge pixels.
                h, s, v = (0.60, 0.78, min(0.90, v * 1.05)) if h > 0.45 else (0.03, 0.82, min(0.90, v * 1.04))
            elif rel_y >= 0.53 and s > 0.18:
                # Trousers and boots: violet/navy.
                h, s, v = 0.76, min(0.82, max(0.48, s)), min(0.88, v * 0.98)
            pixels[x, y] = tuple(round(c * 255) for c in colorsys.hsv_to_rgb(h, s, v)) + (a,)
    return image


def pixel_three_quarter(frame: Image.Image, shear: int, darken: float = 1.0) -> Image.Image:
    """Make a hard-edged diagonal direction while retaining the source pixel clusters."""
    frame = frame.transform(
        frame.size,
        Image.Transform.AFFINE,
        (1, shear / 96, -shear / 2, 0, 1, 0),
        resample=Image.Resampling.NEAREST,
    )
    if darken != 1.0:
        frame = ImageEnhance.Brightness(frame).enhance(darken)
    return frame


def add_pixel_weapons(cell: Image.Image, direction: str, frame_index: int) -> Image.Image:
    """Add newly drawn short-blade and sash pixels on top of the reference walk pose."""
    draw = ImageDraw.Draw(cell)
    orange = (226, 91, 47, 255)
    cyan = (50, 198, 216, 255)
    cyan_shadow = (30, 117, 155, 255)
    stride = (-2, 0, 2, 0)[frame_index % 4]
    if direction in ("left", "up_left", "down_left"):
        hand_x, tip_x = 13 + stride, 3 + stride
        draw.line([(hand_x, 40), (tip_x, 35)], fill=cyan_shadow, width=2)
        draw.line([(hand_x, 39), (tip_x - 1, 34)], fill=cyan, width=1)
    else:
        hand_x, tip_x = 35 + stride, 45 + stride
        draw.line([(hand_x, 40), (tip_x, 35)], fill=cyan_shadow, width=2)
        draw.line([(hand_x, 39), (tip_x + 1, 34)], fill=cyan, width=1)
    draw.line([(17, 51), (31, 51)], fill=orange, width=1)
    draw.point((23, 52), fill=(255, 174, 72, 255))
    return cell


def build_walking() -> None:
    # Use the project's detailed female pixel template as a style reference,
    # then create a separate Yanling palette and new weapon/sash pixels.
    source_path = ROOT / "asset/image/avatar/character/xiaomei/Xiaomei_walk_v4.png"
    if source_path.exists():
        source = recolor_pixel_reference(Image.open(source_path))
        frames = {
            direction: [
                source.crop((column * CELL_W, row * CELL_H, (column + 1) * CELL_W, (row + 1) * CELL_H))
                for column in range(4)
            ]
            for direction, row in ROWS_4.items()
        }
        rows = []
        for direction in ROWS_8:
            row = []
            for column in range(4):
                if direction in frames:
                    cell = frames[direction][column].copy()
                elif direction == "up_left":
                    cell = pixel_three_quarter(frames["up"][column].copy(), -5, 0.84)
                elif direction == "up_right":
                    cell = pixel_three_quarter(frames["up"][column].copy(), 5, 0.84)
                elif direction == "down_left":
                    cell = pixel_three_quarter(frames["down"][column].copy(), -5)
                else:
                    cell = pixel_three_quarter(frames["down"][column].copy(), 5)
                row.append(add_pixel_weapons(cell, direction, column))
            rows.append(row)
    else:
        rows = [[new_walk_frame(direction, column) for column in range(4)] for direction in ROWS_8]

    output_dir = ROOT / "asset/image/avatar/character/yanling"
    output_dir.mkdir(parents=True, exist_ok=True)
    standby = Image.new("RGBA", (CELL_W, CELL_H * len(rows)))
    walking = Image.new("RGBA", (CELL_W * 4, CELL_H * len(rows)))
    for row_index, row in enumerate(rows):
        standby.alpha_composite(row[0], (0, row_index * CELL_H))
        for column, frame in enumerate(row):
            walking.alpha_composite(frame, (column * CELL_W, row_index * CELL_H))
    standby.save(output_dir / "Yanling_standby_8dir.png", optimize=True)
    walking.save(output_dir / "Yanling_walk_8dir.png", optimize=True)


def build_fallback_face() -> None:
    """Create the palette-only portrait when no reference image is available."""
    face = recolor(Image.open(ROOT / "asset/image/picture/face/Thief_1.png"))
    face.thumbnail((256, 256), Image.Resampling.LANCZOS)
    face_canvas = Image.new("RGBA", (256, 256))
    face_canvas.alpha_composite(face, ((256 - face.width) // 2, (256 - face.height) // 2))
    face_dir = ROOT / "asset/image/picture/face/yanling"
    face_dir.mkdir(parents=True, exist_ok=True)
    face_canvas.save(face_dir / "Yanling_normal.png", optimize=True)


def build_battlers() -> None:
    source_dir = ROOT / "asset/image/avatar/battler/thief_1"
    output_dir = ROOT / "asset/image/avatar/battler/yanling"
    output_dir.mkdir(parents=True, exist_ok=True)
    for action in ("standby", "attack", "release", "die", "hit", "defense"):
        # The legacy thief pack has no defense sheet; its hit pose is the
        # closest guarded stance and is kept as a source-only fallback.
        source_action = action if (source_dir / f"Thief_1_{action}.png").exists() else "hit"
        recolor(Image.open(source_dir / f"Thief_1_{source_action}.png")).save(
            output_dir / f"Yanling_{action}.png", optimize=True
        )


ICON_SCALE = 4
ICON_GOLD = (142, 160, 181, 255)  # weapon steel / silver edge
ICON_GOLD_HI = (239, 247, 255, 255)  # hard white-silver highlight
ICON_CYAN = (24, 155, 236, 255)  # electric-blue effect core
ICON_CYAN_HI = (164, 245, 255, 255)  # cold-white effect bloom
ICON_MAGENTA = (49, 95, 178, 255)  # deep royal-blue wrap and cloth accent
ICON_RED = (222, 59, 75, 255)
ICON_INK = (7, 13, 28, 255)


def _p(points):
    return [(round(x * ICON_SCALE), round(y * ICON_SCALE)) for x, y in points]


def _box(box):
    return tuple(round(value * ICON_SCALE) for value in box)


def icon_base() -> tuple[Image.Image, ImageDraw.ImageDraw]:
    """Build a saturated, Street-Fighter-inspired plate for a 100px icon."""
    s = ICON_SCALE
    image = Image.new("RGBA", (100 * s, 100 * s), (4, 9, 20, 255))
    draw = ImageDraw.Draw(image)
    draw.rectangle(_box((3, 3, 97, 97)), fill=(8, 22, 38, 255), outline=(19, 67, 87, 255), width=2 * s)
    draw.rectangle(_box((7, 7, 93, 93)), outline=(7, 126, 132, 255), width=s)
    draw.ellipse(_box((8, 8, 92, 92)), fill=(10, 36, 58, 255), outline=(244, 144, 49, 255), width=2 * s)
    draw.ellipse(_box((14, 14, 86, 86)), fill=(8, 28, 49, 255), outline=(26, 99, 112, 255), width=s)

    # Faint diagonal paint strokes echo the reference video's motion.
    for offset in range(-72, 123, 15):
        draw.line(_p([(offset, 92), (offset + 38, 8)]), fill=(15, 59, 76, 155), width=2 * s)
    for angle in range(0, 360, 45):
        radians = math.radians(angle)
        start = (50 + math.cos(radians) * 31, 50 + math.sin(radians) * 31)
        end = (50 + math.cos(radians) * 39, 50 + math.sin(radians) * 39)
        draw.line(_p([start, end]), fill=(29, 111, 117, 190), width=s)
    for y in range(20, 82, 9):
        for x in range(19, 83, 9):
            if ((x * 7 + y * 11) % 17 == 0) and (x - 50) ** 2 + (y - 50) ** 2 < 31 ** 2:
                draw.rectangle(_box((x, y, x + 1.5, y + 1.5)), fill=(54, 133, 136, 120))
    draw.arc(_box((8, 8, 92, 92)), 206, 331, fill=(255, 188, 75, 255), width=s)
    draw.arc(_box((12, 12, 88, 88)), 24, 146, fill=(31, 170, 170, 230), width=s)
    return image, draw


def _shadow_line(draw, points, color, width):
    draw.line(_p([(x + 1.5, y + 2) for x, y in points]), fill=ICON_INK, width=(width + 4) * ICON_SCALE, joint="curve")
    draw.line(_p(points), fill=(26, 39, 57, 255), width=(width + 2) * ICON_SCALE, joint="curve")
    draw.line(_p(points), fill=color, width=width * ICON_SCALE, joint="curve")


def blade(draw: ImageDraw.ImageDraw, points, color=ICON_GOLD, width=5):
    """Draw a chunky dual-blade stroke with ink outline and a hot edge."""
    _shadow_line(draw, points, color, width)
    if len(points) >= 2:
        edge = ICON_GOLD_HI if color == ICON_GOLD else ICON_CYAN_HI
        draw.line(_p(points[:2]), fill=edge, width=max(1, width // 2) * ICON_SCALE)
    tip = points[-1]
    draw.polygon(_p([(tip[0] + 5, tip[1] - 4), (tip[0] + 1, tip[1] + 4), (tip[0] - 6, tip[1] + 1)]), fill=color)


def spark(draw, cx, cy, color=ICON_GOLD_HI, radius=10):
    points = []
    for index in range(8):
        angle = math.radians(index * 45)
        length = radius if index % 2 == 0 else radius * 0.42
        points.append((cx + math.cos(angle) * length, cy + math.sin(angle) * length))
    draw.polygon(_p(points), fill=color)
    draw.rectangle(_box((cx - 2, cy - 2, cx + 2, cy + 2)), fill=(255, 246, 185, 255))


def node(draw, cx, cy, color, radius=4):
    draw.ellipse(_box((cx - radius - 2, cy - radius - 2, cx + radius + 2, cy + radius + 2)), fill=ICON_INK)
    draw.ellipse(_box((cx - radius, cy - radius, cx + radius, cy + radius)), fill=color)
    draw.rectangle(_box((cx - 1, cy - 1, cx + 1, cy + 1)), fill=ICON_GOLD_HI)


def arrow(draw, points, color=ICON_CYAN, width=4):
    _shadow_line(draw, points, color, width)
    end = points[-1]
    prev = points[-2]
    dx, dy = end[0] - prev[0], end[1] - prev[1]
    length = max(1.0, math.hypot(dx, dy))
    ux, uy = dx / length, dy / length
    px, py = -uy, ux
    head = [(end[0] + ux * 7, end[1] + uy * 7),
            (end[0] - ux * 8 + px * 6, end[1] - uy * 8 + py * 6),
            (end[0] - ux * 4, end[1] - uy * 4),
            (end[0] - ux * 8 - px * 6, end[1] - uy * 8 - py * 6)]
    draw.polygon(_p(head), fill=ICON_INK)
    draw.polygon(_p(head), fill=color)


def build_icons() -> None:
    """Render Yanling's skill/state icons as dense, high-contrast action glyphs."""
    icon_dir = ROOT / "asset/image/picture/icon/skill"
    icon_dir.mkdir(parents=True, exist_ok=True)
    for name in (
        "Yanling_probe", "Yanling_step", "Yanling_spin", "Yanling_cross", "Yanling_phase",
        "Yanling_finisher", "Yanling_mark", "Yanling_footwork", "Yanling_ring", "Yanling_bleed",
    ):
        image, draw = icon_base()
        if name == "Yanling_probe":
            draw.arc(_box((55, 17, 87, 49)), 205, 350, fill=ICON_CYAN_HI, width=3 * ICON_SCALE)
            draw.line(_p([(71, 26), (71, 40)]), fill=ICON_CYAN, width=ICON_SCALE)
            draw.line(_p([(64, 33), (78, 33)]), fill=ICON_CYAN, width=ICON_SCALE)
            blade(draw, [(22, 78), (39, 47), (67, 28)], ICON_GOLD, 6)
            draw.line(_p([(28, 77), (24, 84)]), fill=ICON_MAGENTA, width=3 * ICON_SCALE)
            node(draw, 71, 33, ICON_MAGENTA, 3)
        elif name == "Yanling_step":
            arrow(draw, [(19, 73), (39, 54), (53, 37)], ICON_CYAN, 5)
            arrow(draw, [(45, 78), (62, 58), (78, 28)], ICON_CYAN_HI, 4)
            draw.arc(_box((16, 38, 55, 78)), 205, 310, fill=ICON_MAGENTA, width=2 * ICON_SCALE)
            draw.rectangle(_box((24, 24, 30, 29)), fill=ICON_GOLD)
            draw.rectangle(_box((28, 20, 35, 24)), fill=ICON_GOLD_HI)
        elif name == "Yanling_spin":
            draw.arc(_box((16, 16, 84, 84)), 205, 45, fill=ICON_CYAN_HI, width=5 * ICON_SCALE)
            draw.arc(_box((20, 20, 80, 80)), 30, 175, fill=ICON_MAGENTA, width=3 * ICON_SCALE)
            blade(draw, [(20, 59), (47, 29), (80, 48)], ICON_GOLD, 6)
            blade(draw, [(24, 32), (53, 70), (83, 62)], ICON_CYAN, 5)
            spark(draw, 51, 50, ICON_GOLD_HI, 9)
        elif name == "Yanling_cross":
            draw.polygon(_p([(50, 40), (60, 50), (50, 60), (40, 50)]), fill=ICON_MAGENTA)
            blade(draw, [(17, 25), (50, 50), (84, 78)], ICON_GOLD, 7)
            blade(draw, [(83, 25), (50, 50), (17, 78)], ICON_CYAN, 6)
            spark(draw, 50, 50, ICON_GOLD_HI, 13)
            for x, y in ((31, 30), (69, 31), (29, 70), (70, 70)):
                draw.rectangle(_box((x - 2, y - 2, x + 2, y + 2)), fill=ICON_RED)
        elif name == "Yanling_phase":
            draw.ellipse(_box((19, 19, 81, 81)), outline=ICON_CYAN, width=4 * ICON_SCALE)
            draw.arc(_box((12, 12, 88, 88)), 215, 55, fill=ICON_GOLD_HI, width=4 * ICON_SCALE)
            draw.arc(_box((25, 25, 75, 75)), 35, 210, fill=ICON_MAGENTA, width=3 * ICON_SCALE)
            draw.polygon(_p([(50, 31), (69, 50), (50, 69), (31, 50)]), fill=ICON_INK)
            draw.polygon(_p([(50, 36), (64, 50), (50, 64), (36, 50)]), fill=ICON_GOLD)
            node(draw, 50, 50, ICON_MAGENTA, 4)
        elif name == "Yanling_finisher":
            for angle in (208, 228, 248, 268, 288, 308):
                radians = math.radians(angle)
                draw.line(_p([(50 + math.cos(radians) * 22, 50 + math.sin(radians) * 22),
                              (50 + math.cos(radians) * 44, 50 + math.sin(radians) * 44)]), fill=ICON_RED, width=2 * ICON_SCALE)
            draw.arc(_box((8, 8, 92, 92)), 190, 332, fill=ICON_GOLD_HI, width=7 * ICON_SCALE)
            draw.arc(_box((17, 18, 83, 86)), 202, 342, fill=ICON_GOLD, width=4 * ICON_SCALE)
            blade(draw, [(24, 73), (48, 51), (74, 22)], ICON_CYAN, 6)
            blade(draw, [(76, 78), (51, 52), (29, 23)], ICON_GOLD, 5)
            spark(draw, 50, 52, ICON_GOLD_HI, 15)
        elif name == "Yanling_mark":
            draw.polygon(_p([(50, 14), (86, 50), (50, 86), (14, 50)]), fill=ICON_INK)
            draw.polygon(_p([(50, 19), (81, 50), (50, 81), (19, 50)]), fill=ICON_GOLD)
            draw.polygon(_p([(50, 28), (72, 50), (50, 72), (28, 50)]), fill=(20, 84, 95, 255))
            draw.line(_p([(50, 32), (50, 68)]), fill=ICON_CYAN_HI, width=2 * ICON_SCALE)
            draw.line(_p([(32, 50), (68, 50)]), fill=ICON_CYAN_HI, width=2 * ICON_SCALE)
            node(draw, 50, 50, ICON_MAGENTA, 5)
            for cx, cy in ((50, 22), (78, 50), (50, 78), (22, 50)):
                node(draw, cx, cy, ICON_RED, 3)
        elif name == "Yanling_footwork":
            for points, color, width in (
                ([(17, 72), (34, 58), (44, 39)], ICON_CYAN, 5),
                ([(34, 80), (52, 60), (61, 40)], ICON_CYAN_HI, 5),
                ([(54, 77), (72, 57), (82, 30)], ICON_GOLD, 4),
            ):
                arrow(draw, points, color, width)
            draw.arc(_box((14, 20, 74, 81)), 196, 292, fill=ICON_MAGENTA, width=2 * ICON_SCALE)
            node(draw, 82, 30, ICON_GOLD_HI, 3)
        elif name == "Yanling_ring":
            draw.ellipse(_box((18, 18, 82, 82)), outline=ICON_CYAN, width=6 * ICON_SCALE)
            draw.arc(_box((12, 12, 88, 88)), 210, 335, fill=ICON_CYAN_HI, width=3 * ICON_SCALE)
            draw.arc(_box((24, 24, 76, 76)), 25, 180, fill=ICON_MAGENTA, width=3 * ICON_SCALE)
            blade(draw, [(20, 65), (48, 51), (79, 25)], ICON_GOLD, 6)
            for cx, cy in ((24, 61), (76, 30), (50, 18), (50, 82)):
                node(draw, cx, cy, ICON_GOLD_HI, 3)
        elif name == "Yanling_bleed":
            draw.arc(_box((12, 18, 91, 88)), 202, 350, fill=ICON_RED, width=8 * ICON_SCALE)
            draw.arc(_box((16, 22, 87, 84)), 205, 344, fill=(255, 105, 95, 255), width=2 * ICON_SCALE)
            blade(draw, [(18, 30), (47, 50), (80, 75)], ICON_GOLD, 6)
            for cx, cy, radius in ((77, 22, 4), (84, 33, 3), (70, 16, 2), (66, 79, 3)):
                draw.polygon(_p([(cx, cy - radius - 3), (cx + radius, cy), (cx, cy + radius + 4), (cx - radius, cy)]), fill=ICON_RED)
            node(draw, 48, 50, ICON_MAGENTA, 3)
        image.resize((100, 100), Image.Resampling.LANCZOS).save(icon_dir / f"{name}.png", optimize=True)

    control_dir = ROOT / "asset/image/picture/control"
    control_dir.mkdir(parents=True, exist_ok=True)
    class_icon, draw = icon_base()
    blade(draw, [(26, 76), (52, 23), (78, 76)], ICON_GOLD, width=5)
    spark(draw, 52, 23, ICON_GOLD_HI, 6)
    class_icon.resize((34, 34), Image.Resampling.LANCZOS).save(control_dir / "icon_occupation_9.png", optimize=True)


REAL_BG = (7, 12, 28, 255)
REAL_TEAL = (20, 66, 130, 255)
REAL_CYAN = (38, 159, 239, 255)
REAL_ORANGE = (47, 96, 173, 255)  # deep-blue wrap / cloth accent
REAL_GOLD = (144, 161, 183, 255)  # steel blade
REAL_HI = (232, 245, 255, 255)  # silver edge / effect bloom
REAL_RED = (129, 49, 129, 255)  # restrained magenta outfit accent
REAL_BLOOD = (197, 56, 78, 255)
REAL_PURPLE = (48, 57, 120, 255)
REAL_BLACK = (4, 7, 17, 255)


def _real_base(seed: int):
    """Use the project's full-bleed action art as a restrained texture reference."""
    reference_names = (
        "Ice_aoe.png", "Wind_single.png", "Thunder_single.png", "Archery_aim.png",
        "Water_aoe.png", "Ice_single.png", "Wind_aoe_hit.png", "Thunder_aoe.png",
        "Fire_light.png", "Ice_spike.png",
    )
    reference_path = ROOT / "asset/image/picture/icon/skill" / reference_names[(seed - 1) % len(reference_names)]
    if reference_path.exists():
        reference = Image.open(reference_path).convert("RGBA")
        # Keep the source's painterly/radial texture, but pull it into Yasmin's
        # deep-blue effect palette so the weapon and effects read as one set.
        reference = ImageOps.colorize(ImageOps.grayscale(reference), black=REAL_BG[:3], white=(35, 105, 190)).convert("RGBA")
        reference = ImageEnhance.Contrast(reference).enhance(1.08)
        image = reference.resize((100 * ICON_SCALE, 100 * ICON_SCALE), Image.Resampling.LANCZOS)
    else:
        image = Image.new("RGBA", (100 * ICON_SCALE, 100 * ICON_SCALE), REAL_BG)
    image.alpha_composite(Image.new("RGBA", image.size, (3, 7, 13, 42)))
    draw = ImageDraw.Draw(image)
    s = ICON_SCALE
    # Sparse, irregular dust and paint scratches keep the texture subordinate
    # to the weapon silhouette.
    for index in range(16):
        x = (index * 37 + seed * 13) % 100
        y = (index * 23 + seed * 7) % 100
        length = 3 + (index % 4) * 2
        draw.line(_p([(x, y), (x + length, y - length * 0.35)]), fill=(176, 223, 255, 82), width=s)
    for index in range(18):
        x = (index * 31 + seed * 17) % 96 + 2
        y = (index * 19 + seed * 11) % 96 + 2
        radius = 0.5 + (index % 3) * 0.5
        draw.ellipse(_box((x - radius, y - radius, x + radius, y + radius)), fill=(194, 232, 255, 72))
    return image, draw


def _real_brush(draw, points, color, width=4, highlight=None):
    draw.line(_p([(x + 1.8, y + 2.5) for x, y in points]), fill=REAL_BLACK, width=(width + 6) * ICON_SCALE, joint="curve")
    draw.line(_p(points), fill=(24, 28, 42, 255), width=(width + 3) * ICON_SCALE, joint="curve")
    draw.line(_p(points), fill=color, width=width * ICON_SCALE, joint="curve")
    if highlight:
        draw.line(_p([(x - 0.6, y - 0.8) for x, y in points]), fill=highlight, width=max(1, width // 2) * ICON_SCALE, joint="curve")


def _real_weapon(draw, start, end, color=REAL_GOLD, width=6):
    """Draw a grounded short blade with grip, guard, bevel and inked silhouette."""
    sx, sy = start
    ex, ey = end
    dx, dy = ex - sx, ey - sy
    length = max(1.0, math.hypot(dx, dy))
    ux, uy = dx / length, dy / length
    px, py = -uy, ux
    blade_start = (sx + ux * 10, sy + uy * 10)
    shoulder = (ex - ux * 8, ey - uy * 8)
    outline = [
        (blade_start[0] + px * (width + 2), blade_start[1] + py * (width + 2)),
        (shoulder[0] + px * (width * 0.72 + 2), shoulder[1] + py * (width * 0.72 + 2)),
        (ex + ux * 4, ey + uy * 4),
        (shoulder[0] - px * (width * 0.72 + 2), shoulder[1] - py * (width * 0.72 + 2)),
        (blade_start[0] - px * (width + 2), blade_start[1] - py * (width + 2)),
    ]
    blade_poly = [
        (blade_start[0] + px * width, blade_start[1] + py * width),
        (shoulder[0] + px * width * 0.72, shoulder[1] + py * width * 0.72),
        (ex + ux * 4, ey + uy * 4),
        (shoulder[0] - px * width * 0.72, shoulder[1] - py * width * 0.72),
        (blade_start[0] - px * width, blade_start[1] - py * width),
    ]
    draw.polygon(_p(outline), fill=REAL_BLACK)
    draw.polygon(_p(blade_poly), fill=color)
    draw.line(_p([(blade_start[0] + px * width * 0.45, blade_start[1] + py * width * 0.45),
                  (ex - ux * 3, ey - uy * 3)]), fill=REAL_HI if color == REAL_GOLD else REAL_CYAN, width=max(1, width // 2) * ICON_SCALE)
    grip_end = (sx - ux * 13, sy - uy * 13)
    draw.line(_p([grip_end, (sx, sy)]), fill=REAL_BLACK, width=(width + 3) * ICON_SCALE)
    draw.line(_p([grip_end, (sx, sy)]), fill=(71, 37, 40, 255), width=width * ICON_SCALE)
    for step in (0.25, 0.55, 0.82):
        gx = grip_end[0] + (sx - grip_end[0]) * step
        gy = grip_end[1] + (sy - grip_end[1]) * step
        draw.line(_p([(gx - px * 3, gy - py * 3), (gx + px * 3, gy + py * 3)]), fill=REAL_ORANGE, width=ICON_SCALE)
    guard_a = (sx + px * (width + 2), sy + py * (width + 2))
    guard_b = (sx - px * (width + 2), sy - py * (width + 2))
    draw.line(_p([guard_a, guard_b]), fill=REAL_BLACK, width=3 * ICON_SCALE)
    draw.line(_p([guard_a, guard_b]), fill=REAL_GOLD, width=ICON_SCALE)


def _real_stick(draw, start, end, color=REAL_ORANGE, width=5):
    """Draw a compact escrima stick with a wrapped grip and metal cap."""
    sx, sy = start
    ex, ey = end
    dx, dy = ex - sx, ey - sy
    length = max(1.0, math.hypot(dx, dy))
    ux, uy = dx / length, dy / length
    px, py = -uy, ux
    body_start = (sx + ux * 4, sy + uy * 4)
    body_end = (ex - ux * 4, ey - uy * 4)
    outer = [(body_start[0] + px * (width + 2), body_start[1] + py * (width + 2)),
             (body_end[0] + px * (width + 2), body_end[1] + py * (width + 2)),
             (body_end[0] - px * (width + 2), body_end[1] - py * (width + 2)),
             (body_start[0] - px * (width + 2), body_start[1] - py * (width + 2))]
    inner = [(body_start[0] + px * width, body_start[1] + py * width),
             (body_end[0] + px * width, body_end[1] + py * width),
             (body_end[0] - px * width, body_end[1] - py * width),
             (body_start[0] - px * width, body_start[1] - py * width)]
    draw.polygon(_p(outer), fill=REAL_BLACK)
    draw.polygon(_p(inner), fill=color)
    draw.line(_p([(body_start[0] + px * width * 0.45, body_start[1] + py * width * 0.45),
                  (body_end[0] + px * width * 0.45, body_end[1] + py * width * 0.45)]), fill=REAL_HI, width=max(1, width // 2) * ICON_SCALE)
    grip_end = (sx - ux * 11, sy - uy * 11)
    draw.line(_p([grip_end, (sx, sy)]), fill=REAL_BLACK, width=(width + 3) * ICON_SCALE)
    draw.line(_p([grip_end, (sx, sy)]), fill=(57, 26, 32, 255), width=width * ICON_SCALE)
    for step in (0.2, 0.43, 0.66, 0.88):
        gx = grip_end[0] + (sx - grip_end[0]) * step
        gy = grip_end[1] + (sy - grip_end[1]) * step
        draw.line(_p([(gx - px * 3, gy - py * 3), (gx + px * 3, gy + py * 3)]), fill=REAL_GOLD, width=ICON_SCALE)
    for cap in (grip_end, (ex, ey)):
        draw.ellipse(_box((cap[0] - 2.5, cap[1] - 2.5, cap[0] + 2.5, cap[1] + 2.5)), fill=REAL_BLACK)
        draw.ellipse(_box((cap[0] - 1.2, cap[1] - 1.2, cap[0] + 1.2, cap[1] + 1.2)), fill=REAL_HI)


def _real_karambit(draw, start, end, color=REAL_GOLD, width=4):
    """Draw a compact hooked claw blade rather than a straight sword."""
    sx, sy = start
    ex, ey = end
    dx, dy = ex - sx, ey - sy
    length = max(1.0, math.hypot(dx, dy))
    ux, uy = dx / length, dy / length
    px, py = -uy, ux
    mid = (sx + ux * length * 0.62, sy + uy * length * 0.62)
    hook_base = (ex - ux * 4, ey - uy * 4)
    hook_tip = (ex - ux * 10 + px * 8, ey - uy * 10 + py * 8)
    points = [(sx, sy), mid, hook_base, hook_tip]
    _real_brush(draw, points, color, width, REAL_HI)
    draw.line(_p([(sx - px * 5, sy - py * 5), (sx + px * 5, sy + py * 5)]), fill=REAL_BLACK, width=3 * ICON_SCALE)
    draw.line(_p([(sx - px * 4, sy - py * 4), (sx + px * 4, sy + py * 4)]), fill=REAL_ORANGE, width=ICON_SCALE)
    draw.polygon(_p([(hook_tip[0] + px * 2, hook_tip[1] + py * 2),
                     (hook_tip[0] - ux * 5, hook_tip[1] - uy * 5),
                     (hook_tip[0] - px * 2, hook_tip[1] - py * 2)]), fill=REAL_HI)


def _real_shards(draw, cx, cy, color, count=8, seed=0):
    for index in range(count):
        angle = math.radians((index * 47 + seed * 19) % 360)
        inner = 9 + (index % 3) * 3
        outer = inner + 4 + (index % 4) * 2
        ux, uy = math.cos(angle), math.sin(angle)
        px, py = -uy, ux
        points = [(cx + ux * inner + px * 1.4, cy + uy * inner + py * 1.4),
                  (cx + ux * outer, cy + uy * outer),
                  (cx + ux * inner - px * 1.4, cy + uy * inner - py * 1.4)]
        draw.polygon(_p(points), fill=REAL_BLACK)
        draw.line(_p(points[0:2]), fill=color, width=ICON_SCALE)


def _real_drops(draw, points, color=REAL_BLOOD):
    for index, (x, y, size) in enumerate(points):
        draw.polygon(_p([(x, y - size - 2), (x + size, y), (x, y + size + 2), (x - size, y)]), fill=REAL_BLACK)
        draw.polygon(_p([(x, y - size - 1), (x + size * 0.7, y), (x, y + size + 1), (x - size * 0.7, y)]), fill=color)


def _real_arc(draw, box, start, end, color, width=5):
    draw.arc(_box(box), start, end, fill=REAL_BLACK, width=(width + 4) * ICON_SCALE)
    draw.arc(_box(box), start, end, fill=color, width=width * ICON_SCALE)


def build_icons_realistic() -> None:
    """Render action-frame icons with weapon silhouettes and rough paint texture."""
    icon_dir = ROOT / "asset/image/picture/icon/skill"
    icon_dir.mkdir(parents=True, exist_ok=True)
    names = (
        "Yanling_probe", "Yanling_step", "Yanling_spin", "Yanling_cross", "Yanling_phase",
        "Yanling_finisher", "Yanling_mark", "Yanling_footwork", "Yanling_ring", "Yanling_bleed",
    )
    for seed, name in enumerate(names, 1):
        image, draw = _real_base(seed)
        if name == "Yanling_probe":
            _real_brush(draw, [(6, 83), (39, 54), (88, 11)], REAL_CYAN, 4, REAL_CYAN)
            _real_brush(draw, [(11, 91), (42, 61), (80, 23)], REAL_PURPLE, 2)
            _real_stick(draw, (24, 82), (56, 45), REAL_ORANGE, 5)
            _real_karambit(draw, (55, 46), (83, 17), REAL_GOLD, 4)
            draw.arc(_box((66, 14, 90, 39)), 150, 320, fill=REAL_CYAN, width=2 * ICON_SCALE)
            _real_shards(draw, 78, 22, REAL_HI, 5, seed)
        elif name == "Yanling_step":
            _real_brush(draw, [(5, 87), (34, 63), (70, 18)], REAL_CYAN, 8, REAL_CYAN)
            _real_brush(draw, [(23, 95), (51, 67), (87, 28)], REAL_CYAN, 4, REAL_HI)
            _real_brush(draw, [(11, 66), (32, 48), (52, 21)], REAL_PURPLE, 3)
            _real_stick(draw, (56, 75), (82, 27), REAL_ORANGE, 5)
            _real_stick(draw, (39, 77), (68, 42), REAL_GOLD, 4)
            _real_shards(draw, 67, 54, REAL_ORANGE, 5, seed)
        elif name == "Yanling_spin":
            _real_arc(draw, (4, 10, 96, 104), 204, 346, REAL_CYAN, 7)
            _real_arc(draw, (10, 2, 91, 91), 24, 168, REAL_ORANGE, 4)
            _real_stick(draw, (20, 67), (61, 31), REAL_ORANGE, 5)
            _real_stick(draw, (78, 75), (38, 31), REAL_CYAN, 5)
            _real_karambit(draw, (50, 50), (82, 26), REAL_GOLD, 3)
            _real_shards(draw, 50, 50, REAL_HI, 8, seed)
        elif name == "Yanling_cross":
            _real_stick(draw, (15, 20), (84, 82), REAL_ORANGE, 6)
            _real_stick(draw, (86, 21), (18, 80), REAL_CYAN, 6)
            _real_shards(draw, 50, 51, REAL_HI, 12, seed)
            _real_drops(draw, [(30, 33, 2), (72, 35, 2), (27, 69, 2), (73, 69, 2)], REAL_BLOOD)
        elif name == "Yanling_phase":
            _real_brush(draw, [(8, 24), (47, 48), (90, 78)], REAL_PURPLE, 10)
            _real_arc(draw, (13, 13, 91, 91), 212, 35, REAL_CYAN, 5)
            _real_arc(draw, (22, 22, 82, 82), 30, 210, REAL_GOLD, 3)
            _real_stick(draw, (24, 78), (57, 44), REAL_ORANGE, 5)
            _real_karambit(draw, (56, 45), (84, 30), REAL_GOLD, 4)
            _real_stick(draw, (34, 84), (77, 38), REAL_CYAN, 4)
            _real_shards(draw, 53, 51, REAL_HI, 6, seed)
        elif name == "Yanling_finisher":
            _real_arc(draw, (0, 5, 107, 113), 184, 338, REAL_CYAN, 10)
            _real_arc(draw, (4, 1, 105, 106), 198, 337, REAL_HI, 5)
            _real_stick(draw, (21, 82), (56, 52), REAL_CYAN, 6)
            _real_stick(draw, (79, 84), (43, 47), REAL_ORANGE, 5)
            _real_karambit(draw, (53, 50), (82, 17), REAL_GOLD, 4)
            _real_shards(draw, 51, 51, REAL_HI, 14, seed)
            _real_drops(draw, [(18, 24, 2), (28, 16, 1.5), (87, 39, 2), (87, 60, 1.5)], REAL_BLOOD)
        elif name == "Yanling_mark":
            draw.polygon(_p([(8, 42), (37, 25), (88, 29), (94, 52), (55, 73), (15, 67)]), fill=(16, 42, 93, 255))
            _real_brush(draw, [(13, 69), (43, 46), (88, 16)], REAL_CYAN, 8)
            _real_brush(draw, [(18, 85), (50, 56), (92, 31)], REAL_GOLD, 4, REAL_HI)
            _real_brush(draw, [(10, 54), (39, 38), (77, 35)], REAL_HI, 2)
            _real_drops(draw, [(78, 61, 3), (86, 69, 2), (66, 77, 2)], REAL_BLOOD)
        elif name == "Yanling_footwork":
            _real_brush(draw, [(4, 80), (29, 60), (46, 28)], REAL_CYAN, 6, REAL_CYAN)
            _real_brush(draw, [(22, 93), (51, 65), (65, 34)], REAL_CYAN, 5, REAL_HI)
            _real_brush(draw, [(49, 91), (73, 63), (91, 29)], REAL_ORANGE, 4, REAL_GOLD)
            _real_stick(draw, (73, 85), (91, 42), REAL_ORANGE, 4)
            _real_karambit(draw, (80, 43), (91, 24), REAL_GOLD, 3)
            _real_shards(draw, 34, 61, REAL_HI, 5, seed)
        elif name == "Yanling_ring":
            _real_arc(draw, (2, 3, 100, 103), 196, 354, REAL_CYAN, 9)
            _real_arc(draw, (9, 10, 91, 93), 214, 54, REAL_GOLD, 5)
            _real_arc(draw, (23, 24, 77, 78), 31, 210, REAL_PURPLE, 4)
            _real_stick(draw, (21, 70), (61, 46), REAL_ORANGE, 5)
            _real_karambit(draw, (60, 47), (80, 25), REAL_GOLD, 4)
            _real_shards(draw, 53, 53, REAL_HI, 6, seed)
        elif name == "Yanling_bleed":
            _real_arc(draw, (-7, 8, 107, 103), 196, 355, REAL_BLOOD, 12)
            _real_arc(draw, (-3, 14, 102, 97), 202, 350, REAL_RED, 5)
            _real_karambit(draw, (18, 27), (77, 72), REAL_GOLD, 5)
            _real_stick(draw, (18, 25), (55, 54), REAL_ORANGE, 4)
            _real_brush(draw, [(11, 87), (45, 56), (88, 21)], REAL_ORANGE, 2, REAL_HI)
            _real_drops(draw, [(78, 18, 3), (88, 29, 2), (69, 14, 1.5), (72, 84, 3)], REAL_BLOOD)
        image.resize((100, 100), Image.Resampling.LANCZOS).save(icon_dir / f"{name}.png", optimize=True)


def _unified_base(seed: int) -> tuple[Image.Image, ImageDraw.ImageDraw]:
    """Build a full-bleed action-icon plate matching the project's skill set."""
    size = 100 * ICON_SCALE
    image = Image.new("RGBA", (size, size))
    pixels = image.load()
    # A restrained radial field keeps the icon readable at the 100px UI size.
    for y in range(size):
        for x in range(size):
            dx = (x / ICON_SCALE - 50) / 70
            dy = (y / ICON_SCALE - 50) / 70
            distance = min(1.0, math.sqrt(dx * dx + dy * dy))
            ray = ((x + seed * 17) * 0.035 + (y - seed * 11) * 0.012) % 1.0
            glow = max(0.0, 1.0 - distance) * 8 + (3 if ray > 0.86 else 0)
            pixels[x, y] = (
                round(7 + glow),
                round(15 + glow * 1.5),
                round(27 + glow * 2.1),
                255,
            )
    draw = ImageDraw.Draw(image)
    # Subtle diagonal motion lines echo the existing physical skill icons.
    for offset in range(-80, 121, 18):
        draw.line(_p([(offset, 104), (offset + 42, -4)]), fill=(18, 52, 107, 145), width=1 * ICON_SCALE)
    draw.ellipse(_box((5, 5, 95, 95)), outline=(19, 67, 134, 190), width=1 * ICON_SCALE)
    return image, draw


def _u_outline_line(draw, points, color, width, highlight=None):
    """Use one heavy ink edge and a compact color highlight for small icons."""
    draw.line(_p([(x + 1.5, y + 2) for x, y in points]), fill=ICON_INK, width=(width + 5) * ICON_SCALE, joint="curve")
    draw.line(_p(points), fill=(18, 28, 40, 255), width=(width + 2) * ICON_SCALE, joint="curve")
    draw.line(_p(points), fill=color, width=width * ICON_SCALE, joint="curve")
    if highlight:
        draw.line(_p([(x - 0.7, y - 0.8) for x, y in points]), fill=highlight, width=max(1, width // 2) * ICON_SCALE, joint="curve")


def _u_stick(draw, start, end, color=ICON_GOLD, width=5):
    """Draw a compact escrima stick silhouette without realistic texture."""
    sx, sy = start
    ex, ey = end
    dx, dy = ex - sx, ey - sy
    length = max(1.0, math.hypot(dx, dy))
    ux, uy = dx / length, dy / length
    px, py = -uy, ux
    _u_outline_line(draw, [(sx - ux * 11, sy - uy * 11), (sx, sy), (ex, ey)], color, width, ICON_GOLD_HI)
    draw.line(_p([(sx - px * (width + 2), sy - py * (width + 2)), (sx + px * (width + 2), sy + py * (width + 2))]), fill=ICON_INK, width=2 * ICON_SCALE)
    draw.line(_p([(sx - px * width, sy - py * width), (sx + px * width, sy + py * width)]), fill=ICON_MAGENTA, width=ICON_SCALE)


def _u_blade(draw, points, color=ICON_GOLD, width=5):
    _u_outline_line(draw, points, color, width, ICON_GOLD_HI if color == ICON_GOLD else ICON_CYAN_HI)
    tip = points[-1]
    draw.polygon(_p([(tip[0] + 6, tip[1] - 3), (tip[0] + 1, tip[1] + 4), (tip[0] - 6, tip[1] + 1)]), fill=color)


def _u_karambit(draw, start, end, color=ICON_GOLD, width=6):
    """Draw the reference weapon as a compact hooked crescent blade."""
    sx, sy = start
    ex, ey = end
    dx, dy = ex - sx, ey - sy
    length = max(1.0, math.hypot(dx, dy))
    ux, uy = dx / length, dy / length
    px, py = -uy, ux
    curve = [
        (sx, sy),
        (sx + ux * length * 0.38 + px * 7, sy + uy * length * 0.38 + py * 7),
        (sx + ux * length * 0.70 + px * 13, sy + uy * length * 0.70 + py * 13),
        (ex - ux * 4 + px * 15, ey - uy * 4 + py * 15),
        (ex - ux * 12 + px * 5, ey - uy * 12 + py * 5),
    ]
    _u_outline_line(draw, curve, color, width, ICON_GOLD_HI)
    inner = [(x - px * max(1, width // 2), y - py * max(1, width // 2)) for x, y in curve[1:]]
    draw.line(_p(inner), fill=ICON_GOLD_HI, width=max(1, width // 2) * ICON_SCALE, joint="curve")
    # Wrapped handle and the small blue metal point visible in the reference.
    grip_end = (sx - ux * 13, sy - uy * 13)
    draw.line(_p([grip_end, (sx, sy)]), fill=ICON_INK, width=(width + 4) * ICON_SCALE)
    draw.line(_p([grip_end, (sx, sy)]), fill=ICON_MAGENTA, width=max(2, width - 1) * ICON_SCALE)
    for step in (0.25, 0.55, 0.82):
        gx = grip_end[0] + (sx - grip_end[0]) * step
        gy = grip_end[1] + (sy - grip_end[1]) * step
        draw.line(_p([(gx - px * 3, gy - py * 3), (gx + px * 3, gy + py * 3)]), fill=ICON_CYAN, width=ICON_SCALE)
    gem_x = ex + px * 5
    gem_y = ey + py * 5
    draw.ellipse(_box((gem_x - 3, gem_y - 3, gem_x + 3, gem_y + 3)), fill=ICON_INK)
    draw.ellipse(_box((gem_x - 1.5, gem_y - 1.5, gem_x + 1.5, gem_y + 1.5)), fill=ICON_CYAN_HI)


def _u_arc(draw, box, start, end, color, width):
    draw.arc(_box(box), start, end, fill=ICON_INK, width=(width + 5) * ICON_SCALE)
    draw.arc(_box(box), start, end, fill=color, width=width * ICON_SCALE)


def _u_drop(draw, x, y, radius=3):
    draw.polygon(_p([(x, y - radius - 3), (x + radius, y), (x, y + radius + 3), (x - radius, y)]), fill=ICON_INK)
    draw.polygon(_p([(x, y - radius - 1), (x + radius * 0.7, y), (x, y + radius + 1), (x - radius * 0.7, y)]), fill=ICON_RED)


def build_icons_unified() -> None:
    """Render Yanling icons in the same full-bleed, high-contrast language as other skills."""
    icon_dir = ROOT / "asset/image/picture/icon/skill"
    icon_dir.mkdir(parents=True, exist_ok=True)
    names = (
        "Yanling_probe", "Yanling_step", "Yanling_spin", "Yanling_cross", "Yanling_phase",
        "Yanling_finisher", "Yanling_mark", "Yanling_footwork", "Yanling_ring", "Yanling_bleed",
    )
    for seed, name in enumerate(names, 1):
        image, draw = _unified_base(seed)
        if name == "Yanling_probe":
            _u_karambit(draw, (18, 81), (74, 23), ICON_GOLD, 7)
            _u_arc(draw, (57, 17, 87, 47), 200, 340, ICON_CYAN, 3)
            node(draw, 73, 31, ICON_MAGENTA, 4)
        elif name == "Yanling_step":
            arrow(draw, [(15, 79), (39, 58), (59, 31)], ICON_CYAN, 6)
            arrow(draw, [(37, 86), (61, 62), (83, 28)], ICON_GOLD, 5)
            _u_arc(draw, (18, 35, 56, 77), 200, 300, ICON_MAGENTA, 2)
        elif name == "Yanling_spin":
            _u_arc(draw, (8, 8, 94, 96), 202, 342, ICON_CYAN, 7)
            _u_arc(draw, (17, 17, 84, 84), 22, 164, ICON_MAGENTA, 4)
            _u_karambit(draw, (18, 72), (62, 31), ICON_GOLD, 6)
            _u_karambit(draw, (81, 75), (39, 32), ICON_GOLD, 5)
            spark(draw, 50, 50, ICON_GOLD_HI, 10)
        elif name == "Yanling_cross":
            _u_karambit(draw, (13, 18), (86, 83), ICON_GOLD, 7)
            _u_karambit(draw, (87, 20), (15, 82), ICON_GOLD, 7)
            spark(draw, 50, 50, ICON_GOLD_HI, 14)
            for x, y in ((26, 28), (74, 29), (27, 72), (73, 72)):
                node(draw, x, y, ICON_RED, 3)
        elif name == "Yanling_phase":
            _u_arc(draw, (9, 9, 93, 93), 210, 35, ICON_CYAN, 6)
            _u_arc(draw, (19, 19, 83, 83), 32, 205, ICON_GOLD, 4)
            draw.polygon(_p([(50, 23), (77, 50), (50, 77), (23, 50)]), fill=ICON_INK)
            draw.polygon(_p([(50, 29), (70, 50), (50, 71), (30, 50)]), fill=(25, 75, 150, 255))
            node(draw, 50, 50, ICON_MAGENTA, 5)
        elif name == "Yanling_finisher":
            _u_arc(draw, (-2, 0, 103, 105), 186, 342, ICON_CYAN, 10)
            _u_arc(draw, (7, 8, 94, 96), 198, 337, ICON_CYAN_HI, 5)
            _u_karambit(draw, (23, 80), (78, 20), ICON_GOLD, 6)
            _u_karambit(draw, (78, 82), (27, 22), ICON_GOLD, 5)
            spark(draw, 50, 51, ICON_GOLD_HI, 14)
        elif name == "Yanling_mark":
            draw.polygon(_p([(50, 12), (89, 50), (50, 88), (11, 50)]), fill=ICON_INK)
            draw.polygon(_p([(50, 19), (82, 50), (50, 81), (18, 50)]), fill=(32, 72, 143, 255))
            draw.line(_p([(50, 27), (50, 73)]), fill=ICON_CYAN_HI, width=3 * ICON_SCALE)
            draw.line(_p([(27, 50), (73, 50)]), fill=ICON_CYAN, width=3 * ICON_SCALE)
            node(draw, 50, 50, ICON_GOLD_HI, 5)
        elif name == "Yanling_footwork":
            arrow(draw, [(11, 80), (34, 58), (50, 30)], ICON_CYAN, 6)
            arrow(draw, [(31, 89), (56, 64), (70, 35)], ICON_CYAN_HI, 5)
            arrow(draw, [(52, 88), (75, 61), (89, 28)], ICON_GOLD, 4)
            node(draw, 88, 28, ICON_MAGENTA, 3)
        elif name == "Yanling_ring":
            _u_arc(draw, (6, 6, 95, 95), 198, 350, ICON_CYAN, 8)
            _u_arc(draw, (17, 17, 84, 84), 215, 45, ICON_CYAN_HI, 4)
            _u_karambit(draw, (18, 72), (80, 25), ICON_GOLD, 6)
            for x, y in ((23, 69), (78, 27), (50, 16)):
                node(draw, x, y, ICON_GOLD_HI, 3)
        elif name == "Yanling_bleed":
            _u_arc(draw, (-5, 10, 105, 104), 194, 350, ICON_RED, 11)
            _u_karambit(draw, (16, 27), (81, 76), ICON_GOLD, 6)
            _u_outline_line(draw, [(13, 86), (46, 57), (87, 22)], ICON_CYAN, 2, ICON_CYAN_HI)
            for x, y, radius in ((77, 19, 4), (87, 32, 3), (69, 15, 2), (74, 84, 3)):
                _u_drop(draw, x, y, radius)
        image.resize((100, 100), Image.Resampling.LANCZOS).save(icon_dir / f"{name}.png", optimize=True)


# Keep the public entry point on the project's painterly action-icon renderer.
build_icons = build_icons_realistic


def main() -> None:
    reference_path = Path(os.environ.get(REFERENCE_ENV, str(REFERENCE_DEFAULT)))
    has_reference_art = (ROOT / "asset/image/avatar/battler/yanling/Yanling_standby.png").exists()
    has_reference_face = (ROOT / "asset/image/picture/face/yanling/Yanling_normal.png").exists()
    build_walking()
    build_icons()
    if reference_path.exists():
        build_reference_art(extract_reference_subject(reference_path))
        print(f"Applied Yasmine-inspired reference art from {reference_path.name}")
    elif not (has_reference_art and has_reference_face):
        build_battlers()
        build_fallback_face()
        print(f"Reference image not found at {reference_path}; built palette-based fallback art")
    else:
        print(f"Reference image not found at {reference_path}; retained existing reference-based art")
    print("Built Yanling eight-direction, battler, face, class and skill/status art")


if __name__ == "__main__":
    main()
