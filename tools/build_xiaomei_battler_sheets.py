from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "output/imagegen/xiaomei/Xiaomei_battler_pose_board_v4.png"
OUTPUT_DIR = ROOT / "asset/image/avatar/battler/xiaomei"
FRAME_SIZE = 220
FRAME_COUNT = 13

ACTIONS = {
    "standby": (0, 0),
    "attack": (1, 0),
    "release": (2, 0),
    "hit": (0, 1),
    "defense": (1, 1),
    "die": (2, 1),
}


def remove_green(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            red, green, blue, _ = pixels[x, y]
            dominance = green - max(red, blue)
            if green > 110 and dominance > 35:
                alpha = max(0, min(255, 255 - (dominance - 35) * 4))
            else:
                alpha = 255
            # Suppress green spill on antialiased silhouette edges.
            if green > red and green > blue:
                green = max(red, blue)
            pixels[x, y] = (red, green, blue, alpha)
    return rgba


def suppress_green_spill(image: Image.Image) -> Image.Image:
    pixels = image.load()
    for y in range(image.height):
        for x in range(image.width):
            red, green, blue, alpha = pixels[x, y]
            if alpha > 0 and green > red and green > blue:
                pixels[x, y] = (red, max(red, blue), blue, alpha)
    return image


def fit_frame(cell: Image.Image) -> Image.Image:
    bbox = cell.getbbox()
    if not bbox:
        raise RuntimeError("Generated pose cell is empty")
    sprite = cell.crop(bbox)
    scale = min(208 / sprite.width, 208 / sprite.height)
    size = (max(1, round(sprite.width * scale)), max(1, round(sprite.height * scale)))
    sprite = suppress_green_spill(sprite.resize(size, Image.Resampling.LANCZOS))
    frame = Image.new("RGBA", (FRAME_SIZE, FRAME_SIZE), (0, 0, 0, 0))
    x = (FRAME_SIZE - sprite.width) // 2
    y = FRAME_SIZE - sprite.height - 4
    frame.alpha_composite(sprite, (x, y))
    return frame


def shifted(frame: Image.Image, x: int, y: int) -> Image.Image:
    result = Image.new("RGBA", frame.size, (0, 0, 0, 0))
    result.alpha_composite(frame, (x, y))
    return result


def build_sheet(frame: Image.Image, action: str) -> Image.Image:
    offsets = {
        "standby": [(0, 0), (0, -1), (0, -1), (0, 0)],
        "attack": [(-3, 0), (-1, 0), (1, 0), (3, 0), (2, 0), (1, 0)],
        "release": [(-2, 0), (0, 0), (2, 0), (3, 0), (1, 0)],
        "hit": [(2, 0), (-2, 0), (1, 0), (0, 0)],
        "defense": [(0, 0), (0, -1), (0, 0)],
        "die": [(0, -2), (0, -1), (0, 0)],
    }[action]
    sheet = Image.new("RGBA", (FRAME_SIZE * FRAME_COUNT, FRAME_SIZE), (0, 0, 0, 0))
    for index in range(FRAME_COUNT):
        x, y = offsets[index % len(offsets)]
        sheet.alpha_composite(shifted(frame, x, y), (index * FRAME_SIZE, 0))
    return sheet


def main() -> None:
    board = remove_green(Image.open(SOURCE))
    cell_width = board.width // 3
    cell_height = board.height // 2
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for action, (column, row) in ACTIONS.items():
        cell = board.crop((
            column * cell_width,
            row * cell_height,
            (column + 1) * cell_width,
            (row + 1) * cell_height,
        ))
        frame = fit_frame(cell)
        output = OUTPUT_DIR / f"Xiaomei_{action}_v3.png"
        build_sheet(frame, action).save(output)
        print(f"Wrote {output.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
