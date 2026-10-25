#!/usr/bin/env python3
"""Replaces a replay's initialBlocks with the full map from the world files, and adds walkY/voidY to the meta.

The camera bot only sees chunks near itself, so on big maps its snapshot misses the bases. The map is static
(players' blocks are in replay.blocks), so the world on disk is the better source.

Usage: fill_initial.py <replay.json> <world dir> <arena.yml> <paper-world.yml>
Needs nbtlib + numpy (e.g. maps-work/venv).
"""
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from mca import World  # noqa: E402

replay_path, world_dir, arena_path, paper_path = sys.argv[1:5]
arena = Path(arena_path).read_text(encoding="utf-8")


def loc(key):
    m = re.search(rf"^{key}: ([-\d.]+);([-\d.]+);([-\d.]+)", arena, re.M)
    return [float(v) for v in m.groups()]


p1, p2 = loc("pos1"), loc("pos2")
spawn_y = [float(v) for v in re.findall(r"^    spawn: [-\d.]+;([-\d.]+);", arena, re.M)]
walk_y = int(sorted(spawn_y)[len(spawn_y) // 2])
off = re.search(r"void-damage-min-build-height-offset: ([-\d.]+)", Path(paper_path).read_text(encoding="utf-8"))
void_y = -64 + float(off.group(1)) if off else walk_y - 34

w = World(str(Path(world_dir) / "dimensions" / "minecraft" / "overworld" / "region"))
AIR = {"air", "cave_air", "void_air"}
x0, x1 = int(min(p1[0], p2[0])), int(max(p1[0], p2[0]))
z0, z1 = int(min(p1[2], p2[2])), int(max(p1[2], p2[2]))
y0, y1 = walk_y - 12, walk_y + 26
blocks = []
for cx, cz in w.chunk_keys():
    if cx * 16 > x1 or cx * 16 + 15 < x0 or cz * 16 > z1 or cz * 16 + 15 < z0:
        continue
    for x in range(max(x0, cx * 16), min(x1, cx * 16 + 15) + 1):
        for z in range(max(z0, cz * 16), min(z1, cz * 16 + 15) + 1):
            for y in range(y0, y1 + 1):
                n = w.name(x, y, z)
                if n not in AIR:
                    blocks.append([x, y, z, n])

replay = json.loads(Path(replay_path).read_text(encoding="utf-8"))
before = len(replay.get("initialBlocks", []))
replay["initialBlocks"] = blocks
replay.setdefault("meta", {})["walkY"] = walk_y
replay["meta"]["voidY"] = void_y
Path(replay_path).write_text(json.dumps(replay, separators=(",", ":")), encoding="utf-8")
print(f"initialBlocks {before} -> {len(blocks)}, walkY {walk_y}, voidY {void_y}")
