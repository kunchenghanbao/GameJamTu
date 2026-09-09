"""Build an eight-direction in-game walking sheet for 萧酉歌.

The project uses 48x96 cells.  The existing source has four clean views
(front, left, right, back); diagonal views are generated as restrained
three-quarter composites from the adjacent views so the character identity,
palette, and animation timing remain consistent with the existing art.
"""

from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
CELL_W, CELL_H = 48, 96
ROWS_4 = {"down": 0, "left": 1, "right": 2, "up": 3}
# Avatar oriMode=8 row order used by GameUtils.getOriByIndex().
ROWS_8 = ("left", "up_left", "up", "up_right", "right", "down_right", "down", "down_left")


def alpha_bbox(image: Image.Image):
    alpha = image.getchannel("A")
    return alpha.point(lambda value: 255 if value > 8 else 0).getbbox()


def fit_subject(image: Image.Image) -> Image.Image:
    """Keep the original 48x96 footprint and align feet to the same baseline."""
    image = image.convert("RGBA")
    bbox = alpha_bbox(image)
    frame = Image.new("RGBA", (CELL_W, CELL_H))
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


def three_quarter_composite(side: Image.Image, depth: Image.Image) -> Image.Image:
    """Turn a side view into a restrained three-quarter view.

    The side view remains the silhouette anchor.  A low-opacity, softly
    clipped front/back view contributes chest, sash, and facial detail only in
    the centre of the body, avoiding the doubled limbs caused by a full-image
    blend while still making diagonal directions visibly distinct.
    """
    # Work at 4x so the feather edge survives the final 48x96 downsample.
    scale = 4
    size = (CELL_W * scale, CELL_H * scale)
    side_layer = side.resize(size, Image.Resampling.LANCZOS)
    depth_layer = depth.resize(size, Image.Resampling.LANCZOS)
    centre_mask = Image.new("L", size, 0)
    draw = ImageDraw.Draw(centre_mask)
    draw.rounded_rectangle(
        (round(size[0] * 0.18), round(size[1] * 0.05), round(size[0] * 0.84), round(size[1] * 0.90)),
        radius=round(size[0] * 0.14),
        fill=74,
    )
    centre_mask = centre_mask.filter(ImageFilter.GaussianBlur(radius=round(size[0] * 0.06)))
    overlay_alpha = ImageChops.multiply(depth_layer.getchannel("A"), centre_mask)
    result = side_layer.copy()
    depth_overlay = depth_layer.copy()
    depth_overlay.putalpha(overlay_alpha)
    result.alpha_composite(depth_overlay)
    return result.resize((CELL_W, CELL_H), Image.Resampling.LANCZOS)


def build() -> None:
    source = Image.open(ROOT / "asset/image/avatar/character/zuige/Zuige_walk.png").convert("RGBA")
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
            if direction == "up_left":
                frame = three_quarter_composite(frames["left"][column], frames["up"][column])
            elif direction == "up_right":
                frame = three_quarter_composite(frames["right"][column], frames["up"][column])
            elif direction == "down_left":
                frame = three_quarter_composite(frames["left"][column], frames["down"][column])
            elif direction == "down_right":
                frame = three_quarter_composite(frames["right"][column], frames["down"][column])
            else:
                frame = frames[direction][column]
            row.append(fit_subject(frame))
        rows.append(row)

    output_dir = ROOT / "asset/image/avatar/character/zuige"
    output_dir.mkdir(parents=True, exist_ok=True)
    standby = Image.new("RGBA", (CELL_W, CELL_H * len(rows)))
    walking = Image.new("RGBA", (CELL_W * 4, CELL_H * len(rows)))
    for row_index, row in enumerate(rows):
        standby.alpha_composite(row[0], (0, row_index * CELL_H))
        for column, frame in enumerate(row):
            walking.alpha_composite(frame, (column * CELL_W, row_index * CELL_H))
    standby.save(output_dir / "Zuige_standby_8dir.png", optimize=True)
    walking.save(output_dir / "Zuige_walk_8dir.png", optimize=True)
    print("Built", output_dir / "Zuige_walk_8dir.png")


if __name__ == "__main__":
    build()
