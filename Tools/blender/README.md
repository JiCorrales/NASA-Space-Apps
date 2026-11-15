# Blender model scripts

These scripts generate the game's 3D models from code and export them as FBX for Unity, so anyone can
change a number and rerun them. No `.blend` file is kept: the scripts are the source.

Written for Blender 4.5 LTS (tested with 4.5.16). Run Blender headless only:

```sh
blender --background --factory-startup --python Tools/blender/build.py
blender --background --factory-startup --python Tools/blender/verify.py
```

Rebuild only some models with `-- --only CubeSat_3U Earth` after `build.py` or `verify.py`.

| File | What it does |
|---|---|
| `shapes.py` | Geometry helpers: boxes, cylinders, tubes and convex hulls in one mesh with named material slots; the Unity FBX export settings. |
| `models.py` | One function per model, and the `MODELS` registry: nominal size, origin rule, what it is for. |
| `build.py` | Builds every model and writes `Assets/_Project/Art/Models/<name>.fbx`. Takes about 5 s. |
| `verify.py` | Reopens every FBX and stops with an error if a check fails. `-- --write-docs` rewrites `Assets/_Project/Art/Models/MODELS.md` from the measured files; `-- --previews <dir>` renders a 480 x 360 PNG per model on the CPU (about 4 min for all). Keep previews out of the repo. |

## What `verify.py` checks

- The FBX is under 2 MB and contains no texture or embedded media.
- The file declares Y up and Z front, its raw vertices are already in Unity axes, and the model node has
  no translation, rotation or scale (transforms applied).
- Size and origin match the model rebuilt in memory, and the nominal size in `models.py` (1 mm tolerance).
- Fewer than 5,000 triangles.
- Material slots are named, unique, all used, and from this list only: `Hull`, `Panel`, `SolarCell`,
  `Metal`, `Glass`, `Emissive`, `Dark`.
- Normals: no degenerate faces, every edge shared by two faces, and every loose part encloses a positive
  volume (normals point outward).

## Conventions

- Lengths in metres. Blender axes in the scripts: X right, -Y front, Z up. The export turns these into
  Unity's: Blender -Y becomes Unity +Z (front), Blender Z becomes Unity Y (up).
- Every model is one mesh object at the origin with no transform. Each part is a closed solid.
- Edges sharper than 35 degrees are hard; the rest are smooth. UVs are a world-scale box projection
  (1 m = 1 UV unit), except the Earth, which has equirectangular UVs.
- Unity creates the `.meta` files on first import; commit them together with the FBX files.
