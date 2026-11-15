"""Build every model and export it as FBX for Unity.

    blender --background --python Tools/blender/build.py
    blender --background --python Tools/blender/build.py -- --only CubeSat_3U Earth

Output: Assets/_Project/Art/Models/<name>.fbx (no .meta files: Unity creates them).
"""

import argparse
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

import shapes  # noqa: E402
from models import MODELS  # noqa: E402

REPO = HERE.parents[1]
OUT_DIR = REPO / "Assets" / "_Project" / "Art" / "Models"


def main():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--only", nargs="*", default=None, help="model names to build")
    args = parser.parse_args(argv)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    selected = [m for m in MODELS if not args.only or m["name"] in args.only]
    for model in selected:
        shapes.clear_scene()
        obj = model["build"]()
        path = OUT_DIR / f"{model['name']}.fbx"
        shapes.export_fbx(obj, path)
        tris = sum(len(p.vertices) - 2 for p in obj.data.polygons)
        print(f"built {model['name']}: {tris} triangles, {path.stat().st_size} bytes")
    print(f"built {len(selected)} models into {OUT_DIR}")


if __name__ == "__main__":
    main()
