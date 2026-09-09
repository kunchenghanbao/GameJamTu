from collections import deque
from pathlib import Path
from shutil import copy2

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
FRAME_SIZE = 220
FRAME_COUNT = 13

CHARACTERS = [
    # 艾露恩使用独立的召唤师战斗动作源图；地图四方向行走图仍由 avatar90 保持。
    (7, "elune", "Elune", "output/imagegen/elune-battler-action-sheet-v3.png", False, None),
    (8, "zuige", "Zuige", "output/imagegen/zuige-battler-action-sheet-v1.png", False, None),
    (1012, "mahoraga_rogue", "Mahoraga", "output/imagegen/mahoraga_actions_source.png", False, None),
    (1013, "feiren_ling", "FeirenLing", "output/imagegen/npc16-action-sheet.png", True, "npc_16_actions.png"),
    (1014, "chiwei_saluo", "ChiweiSaluo", "output/imagegen/npc17-action-sheet.png", True, "npc_17_actions.png"),
    (1015, "zhimu_luonie", "ZhimuLuonie", "output/imagegen/npc18-action-sheet.png", True, "npc_18_actions.png"),
    (1016, "senjiao_fuluo", "SenjiaoFuluo", "output/imagegen/npc19-action-sheet.png", True, "npc_19_actions.png"),
    (1017, "yanjiao_keke", "YanjiaoKeke", "output/imagegen/npc20-action-sheet.png", True, "npc_20_actions.png"),
    (1018, "yuetu_mobai", "YuetuMobai", "output/imagegen/npc21-action-sheet.png", True, "npc_21_actions.png"),
    (1019, "chaoge_lan", "ChaogeLan", "output/imagegen/npc22-action-sheet.png", True, "npc_22_actions.png"),
    (1020, "xingdian_moyu", "XingdianMoyu", "output/imagegen/npc23-action-sheet.png", True, "npc_23_actions.png"),
    (1021, "yingxian_lin", "YingxianLin", "output/imagegen/npc24-action-sheet.png", True, "npc_24_actions.png"),
    (1022, "fengxiu_qianhe", "FengxiuQianhe", "output/imagegen/npc25-action-sheet.png", True, "npc_25_actions.png"),
]

ACTION_FRAMES = {
    "standby": (0, [0, 1, 2, 1, 0, 1, 2, 3, 2, 1, 0, 1, 0]),
    # Row 1 is the dedicated braced/charge pose from each generated action sheet.
    "defense": (1, [0, 1, 2, 3, 2, 1, 0, 1, 2, 1, 0, 0, 0]),
    "attack": (2, [0, 0, 1, 1, 2, 2, 3, 3, 2, 1, 0, 0, 0]),
    "release": (2, [0, 1, 2, 2, 3, 3, 3, 2, 1, 0, 0, 0, 0]),
    "hit": (3, [0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
    "die": (3, [0, 1, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3]),
}


def normalized_sheet(source: Path) -> Image.Image:
    image = Image.open(source).convert("RGBA")
    # The generated action sheets use a saturated green chroma background.
    pixels = []
    for red, green, blue, alpha in image.get_flattened_data():
        if green >= 145 and green - max(red, blue) >= 38:
            pixels.append((red, green, blue, 0))
        else:
            pixels.append((red, green, blue, alpha))
    image.putdata(pixels)
    if image.size != (1024, 1024):
        image = image.resize((1024, 1024), Image.Resampling.LANCZOS)
    return image


def mirrored_cell(sheet: Image.Image, row: int, column: int) -> Image.Image:
    cell = sheet.crop((column * 256, row * 256, (column + 1) * 256, (row + 1) * 256))
    return cell.transpose(Image.Transpose.FLIP_LEFT_RIGHT)


def remove_top_bleed(cell: Image.Image) -> Image.Image:
    """Remove small alpha components that crossed down from the previous grid row.

    Image generators occasionally let a coat, hair, or effect from the row above
    intrude into the next cell. Those fragments touch the cell's top edge but are
    disconnected from the character in the current cell. Keep real large
    silhouettes intact and clear only the small top-connected components.
    """
    alpha = cell.getchannel("A")
    width, height = cell.size
    mask = alpha.load()
    visited: set[tuple[int, int]] = set()
    remove: set[tuple[int, int]] = set()
    for start_x in range(width):
        if mask[start_x, 0] == 0 or (start_x, 0) in visited:
            continue
        queue = deque([(start_x, 0)])
        visited.add((start_x, 0))
        component: list[tuple[int, int]] = []
        while queue:
            x, y = queue.popleft()
            component.append((x, y))
            for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                if not (0 <= nx < width and 0 <= ny < height):
                    continue
                if (nx, ny) in visited or mask[nx, ny] == 0:
                    continue
                visited.add((nx, ny))
                queue.append((nx, ny))
        if len(component) <= 5000:
            remove.update(component)
    if remove:
        rgba = cell.load()
        for x, y in remove:
            red, green, blue, _ = rgba[x, y]
            rgba[x, y] = (red, green, blue, 0)
    return cell


def mirrored_action_sheet(sheet: Image.Image) -> Image.Image:
    output = Image.new("RGBA", sheet.size)
    for row in range(4):
        for column in range(4):
            output.alpha_composite(mirrored_cell(sheet, row, column), (column * 256, row * 256))
    return output


def save_map_avatar_sheet(sheet: Image.Image, filename: str) -> None:
    output_dir = ROOT / "asset/image/avatar/character/npc_pack_2"
    output_dir.mkdir(parents=True, exist_ok=True)
    mirrored_action_sheet(sheet).save(output_dir / filename, optimize=True)


def render_cell(
    sheet: Image.Image, row: int, column: int, pixel_art: bool, clean_grid_bleed: bool = False
) -> Image.Image:
    # Generated sheets face right, while one-direction GameCreator avatars use left-facing source art.
    cell = mirrored_cell(sheet, row, column)
    if clean_grid_bleed:
        cell = remove_top_bleed(cell)
        # The generated rows have generous top margins for the actual pose. Clear
        # any remaining low-alpha antialias specks in that margin so neighboring
        # grid rows cannot appear as floating fragments in battle frames.
        top_clear = (8, 55, 45, 25)[row]
        rgba = cell.load()
        for y in range(top_clear):
            for x in range(cell.width):
                red, green, blue, _ = rgba[x, y]
                rgba[x, y] = (red, green, blue, 0)
    alpha = cell.getchannel("A")
    bbox = alpha.point(lambda value: 255 if value > 8 else 0).getbbox()
    if not bbox:
        return Image.new("RGBA", (FRAME_SIZE, FRAME_SIZE))
    subject = cell.crop(bbox)
    max_width = FRAME_SIZE - 12
    max_height = FRAME_SIZE - 8
    scale = min(max_width / subject.width, max_height / subject.height)
    size = (max(1, round(subject.width * scale)), max(1, round(subject.height * scale)))
    resampling = Image.Resampling.NEAREST if pixel_art else Image.Resampling.LANCZOS
    subject = subject.resize(size, resampling)
    frame = Image.new("RGBA", (FRAME_SIZE, FRAME_SIZE))
    x = (FRAME_SIZE - subject.width) // 2
    y = FRAME_SIZE - subject.height - 2
    frame.alpha_composite(subject, (x, y))
    return frame


def build_character(
    folder: str, prefix: str, source_path: str, pixel_art: bool, map_avatar_filename: str | None
) -> Image.Image:
    source = ROOT / source_path
    if not source.exists():
        raise FileNotFoundError(source)
    output_dir = ROOT / "asset/image/avatar/battler" / folder
    output_dir.mkdir(parents=True, exist_ok=True)
    sheet = normalized_sheet(source)
    if map_avatar_filename:
        save_map_avatar_sheet(sheet, map_avatar_filename)
    clean_grid_bleed = prefix in ("Elune", "Zuige")
    cells = [
        [render_cell(sheet, row, column, pixel_art, clean_grid_bleed) for column in range(4)]
        for row in range(4)
    ]
    for action, (row, columns) in ACTION_FRAMES.items():
        strip = Image.new("RGBA", (FRAME_SIZE * FRAME_COUNT, FRAME_SIZE))
        for frame_index, column in enumerate(columns):
            strip.alpha_composite(cells[row][column], (frame_index * FRAME_SIZE, 0))
        strip.save(output_dir / f"{prefix}_{action}.png", optimize=True)
    if prefix == "Mahoraga":
        copy2(source, output_dir / "Mahoraga_action_source.png")
    return cells[0][0]


def main() -> None:
    preview = Image.new("RGBA", (FRAME_SIZE * 6, FRAME_SIZE * 2), (28, 28, 32, 255))
    action_preview = Image.new(
        "RGBA", (FRAME_SIZE * len(ACTION_FRAMES), FRAME_SIZE * len(CHARACTERS)), (28, 28, 32, 255)
    )
    for index, (_, folder, prefix, source_path, pixel_art, map_avatar_filename) in enumerate(CHARACTERS):
        idle = build_character(folder, prefix, source_path, pixel_art, map_avatar_filename)
        preview.alpha_composite(idle, ((index % 6) * FRAME_SIZE, (index // 6) * FRAME_SIZE))
        output_dir = ROOT / "asset/image/avatar/battler" / folder
        for action_index, action in enumerate(ACTION_FRAMES):
            strip = Image.open(output_dir / f"{prefix}_{action}.png").convert("RGBA")
            frame_index = 6 if action in ("attack", "release", "die") else 2
            frame = strip.crop(
                (frame_index * FRAME_SIZE, 0, (frame_index + 1) * FRAME_SIZE, FRAME_SIZE)
            )
            action_preview.alpha_composite(frame, (action_index * FRAME_SIZE, index * FRAME_SIZE))
    preview_path = ROOT / "output/imagegen/character_battlers_preview.png"
    preview_path.parent.mkdir(parents=True, exist_ok=True)
    preview.save(preview_path, optimize=True)
    action_preview_path = ROOT / "output/imagegen/character_battlers_actions_preview.png"
    action_preview.save(action_preview_path, optimize=True)
    print(
        f"Built {len(CHARACTERS)} battler sets, {preview_path.relative_to(ROOT)}, "
        f"and {action_preview_path.relative_to(ROOT)}"
    )


if __name__ == "__main__":
    main()
