"""Build coherent 8-direction Elune sprites from the generated source sheet.

The source is a 4x4 sheet (front, right, back, left rows).  The game expects
the same 8-row layout used by Zuige and Yanling, so diagonal rows reuse the
nearest cardinal pose while keeping every frame a complete, bottom-aligned
character.
"""

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "output/imagegen/elune-walk-transparent.png"
DEST = ROOT / "asset/image/avatar/character/elune"
PREVIEW = ROOT / "output/imagegen/elune-8dir-preview.png"

CELL_W = 48
CELL_H = 96
SHEET_COLS = 4
SHEET_ROWS = 8


def remove_magenta_fringe(image: Image.Image) -> Image.Image:
    """Drop the magenta generation fringe without touching enclosed magic."""

    image = image.convert("RGBA")
    pixels = image.load()
    # The source has a purple/magenta keyline. Only clear keyline pixels that
    # touch transparency, so enclosed purple crystals and spell effects remain.
    for _ in range(4):
        clear = []
        for y in range(1, image.height - 1):
            for x in range(1, image.width - 1):
                r, g, b, a = pixels[x, y]
                is_keyline = a and r > 25 and b > 25 and r > g * 1.7 and b > g * 1.7 and r + b > 80
                touches_transparent = any(pixels[x + dx, y + dy][3] == 0 for dx, dy in (
                    (-1, -1), (0, -1), (1, -1), (-1, 0), (1, 0), (-1, 1), (0, 1), (1, 1)
                ))
                if is_keyline and touches_transparent:
                    clear.append((x, y))
        for x, y in clear:
            r, g, b, _ = pixels[x, y]
            pixels[x, y] = (r, g, b, 0)
    return image


def source_cell(sheet: Image.Image, row: int, col: int) -> Image.Image:
    width, height = sheet.size
    left = round(col * width / 4)
    top = round(row * height / 4)
    right = round((col + 1) * width / 4)
    bottom = round((row + 1) * height / 4)
    cell = sheet.crop((left, top, right, bottom))
    bbox = cell.getchannel("A").getbbox()
    if bbox is None:
        raise ValueError(f"source cell {row},{col} is empty")
    return cell.crop(bbox)


def fit_frame(source: Image.Image) -> Image.Image:
    """Fit a complete source pose into the game's fixed 48x96 frame."""

    # Keep a small transparent margin like the existing character sheets.
    fitted = source.resize((44, 88), Image.Resampling.LANCZOS)
    # LANCZOS can reintroduce a one-pixel blend of the removed keyline.
    fitted = remove_magenta_fringe(fitted)
    # A few source frames contain a colored ground smear below the boots.
    # It is not part of the character and would read as a broken lower body.
    pixels = fitted.load()
    for y in range(78, fitted.height):
        for x in range(fitted.width):
            r, g, b, a = pixels[x, y]
            if a and r > 25 and b > 25 and r > g * 1.7 and b > g * 1.7 and r + b > 80:
                pixels[x, y] = (r, g, b, 0)
    alpha = fitted.getchannel("A").point(lambda value: 255 if value >= 48 else 0)
    fitted.putalpha(alpha)

    frame = Image.new("RGBA", (CELL_W, CELL_H), (0, 0, 0, 0))
    frame.alpha_composite(fitted, (2, 6))
    return frame


def build_sheets() -> tuple[Image.Image, Image.Image]:
    sheet = remove_magenta_fringe(Image.open(SOURCE))
    # Existing direction order: left, left-up, up, right-up, right,
    # right-down, down, left-down.  The source has cardinal rows 3/2/0/1.
    source_rows = [3, 3, 2, 1, 1, 1, 0, 3]

    standby = Image.new("RGBA", (CELL_W, CELL_H * SHEET_ROWS), (0, 0, 0, 0))
    walk = Image.new("RGBA", (CELL_W * SHEET_COLS, CELL_H * SHEET_ROWS), (0, 0, 0, 0))
    for direction, source_row in enumerate(source_rows):
        for frame_index in range(SHEET_COLS):
            frame = fit_frame(source_cell(sheet, source_row, frame_index))
            if frame_index == 0:
                standby.alpha_composite(frame, (0, direction * CELL_H))
            walk.alpha_composite(frame, (frame_index * CELL_W, direction * CELL_H))
    return standby, walk


def main() -> None:
    if not SOURCE.exists():
        raise FileNotFoundError(f"missing generated source: {SOURCE}")
    DEST.mkdir(parents=True, exist_ok=True)
    standby, walk = build_sheets()
    standby_path = DEST / "Elune_standby_8dir.png"
    walk_path = DEST / "Elune_walk_8dir.png"
    standby.save(standby_path)
    walk.save(walk_path)

    # Contact preview: four walk frames per direction, enlarged for review.
    preview = walk.resize((walk.width * 3, walk.height * 3), Image.Resampling.NEAREST)
    preview.save(PREVIEW)
    print(standby_path)
    print(walk_path)
    print(PREVIEW)


if __name__ == "__main__":
    main()
