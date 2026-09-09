from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
FRAME_W, FRAME_H = 48, 96


def remove_chroma(image: Image.Image) -> Image.Image:
    image = image.convert("RGBA")
    rgba = image.load()
    for y in range(image.height):
        for x in range(image.width):
            red, green, blue, alpha = rgba[x, y]
            if green >= 145 and green - max(red, blue) >= 38:
                rgba[x, y] = (red, green, blue, 0)
    return image


def fit_frame(cell: Image.Image, width: int, height: int) -> Image.Image:
    alpha = cell.getchannel("A")
    bbox = alpha.point(lambda value: 255 if value > 8 else 0).getbbox()
    frame = Image.new("RGBA", (width, height))
    if not bbox:
        return frame
    subject = cell.crop(bbox)
    scale = min((width - 4) / subject.width, (height - 2) / subject.height)
    subject = subject.resize(
        (max(1, round(subject.width * scale)), max(1, round(subject.height * scale))),
        Image.Resampling.LANCZOS,
    )
    frame.alpha_composite(subject, ((width - subject.width) // 2, height - subject.height - 1))
    return frame


def build_walking_sheet() -> None:
    source = remove_chroma(Image.open(ROOT / "output/imagegen/zuige-walk-sheet-v1.png"))
    source = source.resize((2048, 2048), Image.Resampling.LANCZOS)
    frames = []
    for row in range(4):
        row_frames = []
        for column in range(4):
            cell = source.crop((column * 512, row * 512, (column + 1) * 512, (row + 1) * 512))
            row_frames.append(fit_frame(cell, FRAME_W, FRAME_H))
        frames.append(row_frames)

    output_dir = ROOT / "asset/image/avatar/character/zuige"
    output_dir.mkdir(parents=True, exist_ok=True)
    standby = Image.new("RGBA", (FRAME_W, FRAME_H * 4))
    walking = Image.new("RGBA", (FRAME_W * 4, FRAME_H * 4))
    for row in range(4):
        standby.alpha_composite(frames[row][0], (0, row * FRAME_H))
        for column in range(4):
            walking.alpha_composite(frames[row][column], (column * FRAME_W, row * FRAME_H))
    standby.save(output_dir / "Zuige_standby.png", optimize=True)
    walking.save(output_dir / "Zuige_walk.png", optimize=True)


def build_face() -> None:
    face = remove_chroma(Image.open(ROOT / "output/imagegen/zuige-face-v1.png"))
    face.thumbnail((256, 256), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (256, 256))
    canvas.alpha_composite(face, ((256 - face.width) // 2, (256 - face.height) // 2))
    output_dir = ROOT / "asset/image/picture/face/zuige"
    output_dir.mkdir(parents=True, exist_ok=True)
    canvas.save(output_dir / "Zuige_normal.png", optimize=True)


def build_skill_icons() -> None:
    source = remove_chroma(Image.open(ROOT / "output/imagegen/zuige-skill-icons-sheet-v1.png"))
    source = source.resize((1536, 1024), Image.Resampling.LANCZOS)
    names = [
        "Zuige_drink",
        "Zuige_combo",
        "Zuige_step",
        "Zuige_mist",
        "Zuige_breaker",
        "Zuige_mastery",
    ]
    output_dir = ROOT / "asset/image/picture/icon/skill"
    output_dir.mkdir(parents=True, exist_ok=True)
    for index, name in enumerate(names):
        column = index % 3
        row = index // 3
        cell = source.crop((column * 512, row * 512, (column + 1) * 512, (row + 1) * 512))
        cell.resize((100, 100), Image.Resampling.LANCZOS).save(output_dir / f"{name}.png", optimize=True)
    # Status/class icons use the same visual language at their native UI sizes.
    control_dir = ROOT / "asset/image/picture/control"
    control_dir.mkdir(parents=True, exist_ok=True)
    source.crop((2 * 512, 1 * 512, 3 * 512, 2 * 512)).resize((34, 34), Image.Resampling.LANCZOS).save(
        control_dir / "icon_occupation_8.png", optimize=True
    )


if __name__ == "__main__":
    build_walking_sheet()
    build_face()
    build_skill_icons()
    print("Built Zuige walking, face, skill, and class art")
