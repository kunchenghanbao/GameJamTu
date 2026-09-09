from pathlib import Path

from PIL import Image, ImageDraw, ImageOps


ROOT = Path(__file__).resolve().parents[1]
GENERATED = ROOT / "output" / "imagegen"
AVATAR_DIR = ROOT / "asset" / "image" / "avatar" / "character" / "mahoraga"
FACE_DIR = ROOT / "asset" / "image" / "picture" / "face" / "mahoraga"
SKILL_DIR = ROOT / "asset" / "image" / "picture" / "icon" / "skill"


def remove_chroma(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = []
    for red, green, blue, _ in rgba.get_flattened_data():
        green_dominance = green - max(red, blue)
        if green >= 145 and green_dominance >= 38:
            pixels.append((red, green, blue, 0))
        else:
            pixels.append((red, green, blue, 255))
    rgba.putdata(pixels)
    return rgba


def cell(sheet: Image.Image, column: int, row: int) -> Image.Image:
    left = round(sheet.width * column / 4)
    top = round(sheet.height * row / 4)
    right = round(sheet.width * (column + 1) / 4)
    bottom = round(sheet.height * (row + 1) / 4)
    return sheet.crop((left, top, right, bottom))


def build_avatar_sheets() -> None:
    idle_source = remove_chroma(Image.open(GENERATED / "mahoraga-idle-sheet-v1.png"))
    walk_source = remove_chroma(Image.open(GENERATED / "mahoraga-walk-sheet-v1.png"))

    standby = Image.new("RGBA", (96, 768), (0, 0, 0, 0))
    walk = Image.new("RGBA", (384, 768), (0, 0, 0, 0))
    for row in range(4):
        idle_frame = cell(idle_source, 0, row).resize((96, 192), Image.Resampling.NEAREST)
        standby.alpha_composite(idle_frame, (0, row * 192))
        for column in range(4):
            walk_frame = cell(walk_source, column, row).resize(
                (96, 192), Image.Resampling.NEAREST
            )
            walk.alpha_composite(walk_frame, (column * 96, row * 192))

    AVATAR_DIR.mkdir(parents=True, exist_ok=True)
    standby.save(AVATAR_DIR / "Mahoraga_standby.png")
    walk.save(AVATAR_DIR / "Mahoraga_walk.png")


def dark_panel(size: int) -> Image.Image:
    panel = Image.new("RGBA", (size, size), (17, 14, 25, 255))
    draw = ImageDraw.Draw(panel)
    for y in range(size):
        shade = round(20 * y / max(1, size - 1))
        draw.line((0, y, size, y), fill=(24 + shade, 18 + shade // 2, 37 + shade, 255))
    return panel


def portrait_from_concept(size: int) -> Image.Image:
    concept = remove_chroma(Image.open(GENERATED / "mahoraga-pixel-concept-v1.png"))
    bounds = concept.getbbox()
    if not bounds:
        raise RuntimeError("Generated concept contains no visible character pixels")

    left, top, right, bottom = bounds
    subject_width = right - left
    portrait_bottom = min(bottom, top + round(subject_width * 0.92))
    portrait = concept.crop((left, top, right, portrait_bottom))
    portrait.thumbnail((size, size), Image.Resampling.NEAREST)

    result = dark_panel(size)
    x = (size - portrait.width) // 2
    y = max(0, size - portrait.height)
    result.alpha_composite(portrait, (x, y))
    return result


def build_portraits() -> None:
    FACE_DIR.mkdir(parents=True, exist_ok=True)
    SKILL_DIR.mkdir(parents=True, exist_ok=True)
    portrait_from_concept(400).save(FACE_DIR / "Mahoraga_face.png")

    icon_source = Image.open(GENERATED / "mahoraga-simple-skill-icon-v1.png").convert("RGBA")
    icon = ImageOps.fit(icon_source, (100, 100), Image.Resampling.LANCZOS)
    draw = ImageDraw.Draw(icon)
    draw.rectangle((1, 1, 98, 98), outline=(74, 39, 118, 255), width=3)
    icon.save(SKILL_DIR / "Summoner_mahoraga.png")


if __name__ == "__main__":
    build_avatar_sheets()
    build_portraits()
