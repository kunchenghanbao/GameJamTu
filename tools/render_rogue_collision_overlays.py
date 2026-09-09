import argparse
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


GRID_SIZE = 48
DEFAULT_SCENES = [20, 21, 22, 23, 24]


def load_json(path):
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def load_font(size):
    for path in [
        Path("C:/Windows/Fonts/consola.ttf"),
        Path("C:/Windows/Fonts/arial.ttf"),
    ]:
        if path.exists():
            return ImageFont.truetype(str(path), size)
    return ImageFont.load_default()


def render_scene(root, scene_id, output_dir):
    client = load_json(root / f"asset/json/scene/data/scene{scene_id}.json")
    server = load_json(root / f"asset/json/server/scene/s{scene_id}.json")
    image_path = root / client["LayerDatas"][0]["img"]
    base = Image.open(image_path).convert("RGBA")
    if base.size != (client["width"], client["height"]):
        base = base.resize((client["width"], client["height"]), Image.Resampling.LANCZOS)

    overlay = Image.new("RGBA", base.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    font = load_font(13)
    grid = client["dataLayers"][0]
    blocked = 0

    for x, column in enumerate(grid):
        for y, value in enumerate(column):
            if value == 1:
                blocked += 1
                draw.rectangle(
                    (x * GRID_SIZE, y * GRID_SIZE, (x + 1) * GRID_SIZE - 1, (y + 1) * GRID_SIZE - 1),
                    fill=(255, 24, 24, 112),
                    outline=(255, 64, 64, 220),
                    width=2,
                )

    for x in range(0, base.width + 1, GRID_SIZE):
        draw.line((x, 0, x, base.height), fill=(0, 0, 0, 105), width=1)
    for y in range(0, base.height + 1, GRID_SIZE):
        draw.line((0, y, base.width, y), fill=(0, 0, 0, 105), width=1)

    for x in range(len(grid)):
        draw.text((x * GRID_SIZE + 3, 2), str(x), font=font, fill=(255, 255, 255, 235), stroke_width=2, stroke_fill=(0, 0, 0, 220))
    for y in range(len(grid[0])):
        draw.text((3, y * GRID_SIZE + 17), str(y), font=font, fill=(255, 255, 255, 235), stroke_width=2, stroke_fill=(0, 0, 0, 220))

    for obj in server.get("sceneObjects", []):
        if not obj:
            continue
        x = int(obj.get("x", 0))
        y = int(obj.get("y", 0))
        name = obj.get("name", "")
        if name == "肉鸽出生点":
            color = (30, 220, 90, 255)
            label = "SPAWN"
        elif 6 in (obj.get("moduleIDs") or []):
            color = (255, 220, 30, 255)
            label = "BOSS" if name.startswith("BOSS") else "ENEMY"
        else:
            continue
        draw.ellipse((x - 10, y - 10, x + 10, y + 10), fill=color, outline=(0, 0, 0, 255), width=2)
        draw.text((x + 12, y - 9), label, font=font, fill=color, stroke_width=2, stroke_fill=(0, 0, 0, 230))

    result = Image.alpha_composite(base, overlay).convert("RGB")
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / f"scene{scene_id}_collision_overlay.png"
    result.save(output_path, optimize=True)
    print(f"scene {scene_id}: {blocked} blocked cells -> {output_path}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("scene_ids", nargs="*", type=int, default=DEFAULT_SCENES)
    parser.add_argument("--output-dir", default="output/rogue_collision_review")
    args = parser.parse_args()
    root = Path(__file__).resolve().parent.parent
    output_dir = root / args.output_dir
    for scene_id in args.scene_ids:
        render_scene(root, scene_id, output_dir)


if __name__ == "__main__":
    main()
