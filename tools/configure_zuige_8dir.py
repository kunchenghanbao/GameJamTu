"""Point avatar91 at the generated eight-direction sheets."""

from copy import deepcopy
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
AVATAR_PATH = ROOT / "asset/json/avatar/data/avatar91.json"


def configure() -> None:
    with AVATAR_PATH.open("r", encoding="utf-8") as handle:
        avatar = json.load(handle)

    avatar["picUrls"] = [
        "asset/image/avatar/character/zuige/Zuige_standby_8dir.png",
        "asset/image/avatar/character/zuige/Zuige_walk_8dir.png",
    ]
    avatar["oriMode"] = 8

    # Existing avatar91 used four rows in the order down, left, right, up.
    # Re-map those rows into GameUtils' eight-direction order:
    # left, up-left, up, up-right, right, down-right, down, down-left.
    for action in avatar.get("actionListArr", []):
        old_rows = action.get("frameImageInfo", [])
        if len(old_rows) != 4:
            continue
        down, left, right, up = old_rows
        source_rows = [left, up, up, up, right, down, down, down]
        new_rows = []
        for row_index, source_row in enumerate(source_rows):
            row = []
            for frame in source_row:
                copy = deepcopy(frame)
                rect = list(copy.get("rect", [0, 0, 48, 96]))
                rect[1] = -96 * row_index
                copy["rect"] = rect
                row.append(copy)
            new_rows.append(row)
        action["frameImageInfo"] = new_rows

    with AVATAR_PATH.open("w", encoding="utf-8", newline="\n") as handle:
        json.dump(avatar, handle, ensure_ascii=False, indent=4)
        handle.write("\n")
    print("Configured avatar91 for eight directions")


if __name__ == "__main__":
    configure()
