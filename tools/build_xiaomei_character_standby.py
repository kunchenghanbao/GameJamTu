from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "asset/image/avatar/character/xiaomei/Xiaomei_walk_v4.png"
OUTPUT = ROOT / "asset/image/avatar/character/xiaomei/Xiaomei_standby_v2.png"
FRAME_WIDTH = 48
FRAME_HEIGHT = 96
DIRECTION_COUNT = 4
WALK_FRAME_COUNT = 4


def main() -> None:
    source = Image.open(SOURCE).convert("RGBA")
    expected_size = (FRAME_WIDTH * WALK_FRAME_COUNT, FRAME_HEIGHT * DIRECTION_COUNT)
    if source.size != expected_size:
        raise RuntimeError(f"Unexpected Xiaomei walk sheet size: {source.size}, expected {expected_size}")

    standby = Image.new("RGBA", (FRAME_WIDTH, FRAME_HEIGHT * DIRECTION_COUNT), (0, 0, 0, 0))
    for direction in range(DIRECTION_COUNT):
        top = direction * FRAME_HEIGHT
        frame = source.crop((0, top, FRAME_WIDTH, top + FRAME_HEIGHT))
        standby.alpha_composite(frame, (0, top))

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    standby.save(OUTPUT)
    print(f"Wrote {OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
