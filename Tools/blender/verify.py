"""Reopen every exported FBX and check it; optionally render previews and write MODELS.md.

    blender --background --python Tools/blender/verify.py
    blender --background --python Tools/blender/verify.py -- --previews <dir> --write-docs

Checks per model (the script stops with an error if one fails):
- the FBX exists, is under 2 MB and embeds no texture;
- the file declares Y up, Z front and a 1 cm unit, and its raw vertices already are in Unity axes
  (FBX Y = Blender Z), so Unity needs no rotation;
- one mesh object whose FBX model node has no translation, rotation or scale (transforms applied);
- the size and origin match the freshly built model and the nominal size in models.py (1 mm);
- under 5,000 triangles;
- material slots are named, unique and in the allowed list;
- normals: no degenerate faces, every edge shared by exactly two faces, every loose part has a positive
  signed volume (normals point outward).
"""

import argparse
import math
import pathlib
import sys

import bmesh
import bpy
from mathutils import Vector

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

import shapes  # noqa: E402
from models import MODELS  # noqa: E402

REPO = HERE.parents[1]
MODEL_DIR = REPO / "Assets" / "_Project" / "Art" / "Models"
MAX_TRIS = 5000
MAX_BYTES = 2 * 1024 * 1024
TOL = 0.001


def bbox(obj):
    pts = [obj.matrix_world @ v.co for v in obj.data.vertices]
    lo = Vector([min(p[i] for p in pts) for i in range(3)])
    hi = Vector([max(p[i] for p in pts) for i in range(3)])
    return lo, hi


def triangles(mesh):
    return sum(len(p.vertices) - 2 for p in mesh.polygons)


def fbx_header(path):
    """Read GlobalSettings and the raw vertex bounds straight from the FBX file."""
    from io_scene_fbx import parse_fbx

    root, _version = parse_fbx.parse(str(path))
    settings, verts, textures, models = {}, [], 0, []

    def walk(elem):
        nonlocal textures
        if elem.id == b"GlobalSettings":
            for sub in elem.elems:
                if sub.id == b"Properties70":
                    for p in sub.elems:
                        settings[p.props[0].decode()] = p.props[-1]
        if elem.id == b"Model":
            props = {}
            for sub in elem.elems:
                if sub.id == b"Properties70":
                    for p in sub.elems:
                        props[p.props[0].decode()] = tuple(p.props[4:])
            models.append(props)
        if elem.id == b"Vertices":
            verts.extend(elem.props[0])
        if elem.id in (b"Texture", b"Video"):
            textures += 1
        for sub in elem.elems:
            walk(sub)

    walk(root)
    xs, ys, zs = verts[0::3], verts[1::3], verts[2::3]
    unit = settings["UnitScaleFactor"] / 100.0  # metres per file unit
    lo = Vector((min(xs), min(ys), min(zs))) * unit
    hi = Vector((max(xs), max(ys), max(zs))) * unit
    return settings, lo, hi, textures, models


def check_normals(mesh, name):
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bad_area = sum(1 for f in bm.faces if f.calc_area() < 1e-10)
    non_manifold = sum(1 for e in bm.edges if len(e.link_faces) != 2)
    # Loose parts by union-find over edges.
    parent = list(range(len(bm.verts)))

    def find(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i

    for e in bm.edges:
        a, b = find(e.verts[0].index), find(e.verts[1].index)
        if a != b:
            parent[a] = b
    volume = {}
    for f in bm.faces:
        v = [l.vert.co for l in f.loops]
        part = find(f.verts[0].index)
        for i in range(1, len(v) - 1):
            volume[part] = volume.get(part, 0.0) + v[0].dot(v[i].cross(v[i + 1])) / 6.0
    inward = sum(1 for vol in volume.values() if vol <= 0)
    bm.free()
    assert bad_area == 0, f"{name}: {bad_area} degenerate faces"
    assert non_manifold == 0, f"{name}: {non_manifold} open or non-manifold edges"
    assert inward == 0, f"{name}: {inward} of {len(volume)} parts have inward normals"
    return len(volume)


def expected_axis(spec, lo, hi, axis):
    if spec == "c":
        return abs(lo[axis] + hi[axis]) < 2 * TOL
    if spec == "min":
        return abs(lo[axis]) < TOL
    if spec == "max":
        return abs(hi[axis]) < TOL
    return abs(lo[axis] - spec) < TOL


def verify(model):
    name = model["name"]
    path = MODEL_DIR / f"{name}.fbx"
    assert path.exists(), f"{name}: {path} missing"
    size_bytes = path.stat().st_size
    assert size_bytes < MAX_BYTES, f"{name}: {size_bytes} bytes"

    # Reference: build the model again in memory.
    shapes.clear_scene()
    ref = model["build"]()
    ref_lo, ref_hi = bbox(ref)
    ref_tris = triangles(ref.data)
    ref_slots = [m.name for m in ref.data.materials]

    # Raw file: axes, units, Unity-space bounds.
    settings, f_lo, f_hi, textures, fbx_models = fbx_header(path)
    # Transforms applied: the model node carries no translation, rotation or scale (absent = identity).
    assert len(fbx_models) == 1, f"{name}: {len(fbx_models)} model nodes"
    node = fbx_models[0]
    for prop, identity in (("Lcl Translation", 0.0), ("Lcl Rotation", 0.0), ("Lcl Scaling", 1.0)):
        values = node.get(prop, (identity,) * 3)
        assert all(abs(v - identity) < 1e-6 for v in values), f"{name}: {prop} = {values}"
    assert textures == 0, f"{name}: {textures} texture nodes in the FBX"
    assert settings["UpAxis"] == 1 and settings["UpAxisSign"] == 1, f"{name}: up axis {settings}"
    assert settings["FrontAxis"] == 2, f"{name}: front axis {settings}"
    assert settings["CoordAxis"] == 0, f"{name}: coord axis {settings}"
    # Blender (x, y, z) -> FBX (x, z, -y).
    want_lo = Vector((ref_lo.x, ref_lo.z, -ref_hi.y))
    want_hi = Vector((ref_hi.x, ref_hi.z, -ref_lo.y))
    assert (f_lo - want_lo).length < TOL and (f_hi - want_hi).length < TOL, \
        f"{name}: file bounds {tuple(f_lo)} {tuple(f_hi)} != {tuple(want_lo)} {tuple(want_hi)}"

    # Reimport.
    shapes.clear_scene()
    bpy.ops.import_scene.fbx(filepath=str(path))
    objs = [o for o in bpy.context.scene.objects]
    assert len(objs) == 1 and objs[0].type == "MESH", f"{name}: imported {[o.name for o in objs]}"
    obj = objs[0]
    assert obj.name == name, f"{name}: object called {obj.name}"
    lo, hi = bbox(obj)
    assert (lo - ref_lo).length < TOL and (hi - ref_hi).length < TOL, \
        f"{name}: reimported bounds {tuple(lo)} {tuple(hi)} != built {tuple(ref_lo)} {tuple(ref_hi)}"
    dims = hi - lo
    if model["size"] is not None:
        for axis in range(3):
            assert abs(dims[axis] - model["size"][axis]) < TOL, \
                f"{name}: size {tuple(dims)} != nominal {model['size']}"
    for axis, spec in enumerate(model["origin"]):
        assert expected_axis(spec, lo, hi, axis), f"{name}: origin rule {spec} fails on axis {axis}: {tuple(lo)} {tuple(hi)}"
    tris = triangles(obj.data)
    assert tris == ref_tris and tris < MAX_TRIS, f"{name}: {tris} triangles (built {ref_tris})"
    slots = [m.name for m in obj.data.materials]
    assert slots and len(set(slots)) == len(slots), f"{name}: slots {slots}"
    assert all(s in shapes.MATERIALS for s in slots), f"{name}: slots {slots}"
    assert sorted(slots) == sorted(ref_slots), f"{name}: slots {slots} != built {ref_slots}"
    used = {p.material_index for p in obj.data.polygons}
    assert used == set(range(len(slots))), f"{name}: unused or missing slots {used}"
    assert len(obj.data.uv_layers) == 1, f"{name}: {len(obj.data.uv_layers)} UV layers"
    parts = check_normals(obj.data, name)
    return dict(name=name, dims=dims, lo=lo, hi=hi, tris=tris, slots=slots, bytes=size_bytes, parts=parts, obj=obj)


# ---------------------------------------------------------------- previews

PREVIEW = {
    "Hull": ((0.72, 0.74, 0.77), 0.0, 0.5, 0.0),
    "Panel": ((0.36, 0.39, 0.43), 0.0, 0.6, 0.0),
    "SolarCell": ((0.02, 0.05, 0.22), 0.3, 0.25, 0.0),
    "Metal": ((0.85, 0.85, 0.87), 0.5, 0.35, 0.0),
    "Glass": ((0.35, 0.55, 0.70), 0.0, 0.05, 0.0),
    "Emissive": ((0.40, 0.85, 1.00), 0.0, 0.5, 4.0),
    "Dark": ((0.03, 0.03, 0.035), 0.0, 0.6, 0.0),
}


def preview_material(slot, checker=False):
    mat = bpy.data.materials.new(f"preview_{slot}")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    bsdf = nodes["Principled BSDF"]
    colour, metal, rough, emit = PREVIEW[slot]
    bsdf.inputs["Base Color"].default_value = (*colour, 1)
    bsdf.inputs["Metallic"].default_value = metal
    bsdf.inputs["Roughness"].default_value = rough
    if emit:
        bsdf.inputs["Emission Color"].default_value = (*colour, 1)
        bsdf.inputs["Emission Strength"].default_value = emit
    if checker:  # Shows the UV layout of the Earth sphere.
        tex = nodes.new("ShaderNodeTexChecker")
        tex.inputs["Scale"].default_value = 16
        tex.inputs["Color1"].default_value = (0.1, 0.3, 0.8, 1)
        tex.inputs["Color2"].default_value = (0.9, 0.9, 0.9, 1)
        coord = nodes.new("ShaderNodeTexCoord")
        mat.node_tree.links.new(coord.outputs["UV"], tex.inputs["Vector"])
        mat.node_tree.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    return mat


def render_preview(model, result, out_dir):
    obj = result["obj"]
    for i, slot in enumerate(result["slots"]):
        obj.data.materials[i] = preview_material(slot, checker=(model["name"] == "Earth"))
    scene = bpy.context.scene
    world = bpy.data.worlds.new("preview")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.05, 0.06, 0.08, 1)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.6
    scene.world = world

    lo, hi = result["lo"], result["hi"]
    centre = (lo + hi) / 2
    radius = (hi - lo).length / 2
    cam_data = bpy.data.cameras.new("cam")
    cam = bpy.data.objects.new("cam", cam_data)
    scene.collection.objects.link(cam)
    if model["view"] == "inside":
        cam_data.lens = 14
        cam.location = Vector((-0.9, -1.45, 1.6))
        target = Vector((0.6, 1.5, 1.1))
        lamp = bpy.data.lights.new("lamp", "POINT")
        lamp.energy = 70
        lamp_obj = bpy.data.objects.new("lamp", lamp)
        lamp_obj.location = (0.0, 0.0, 2.0)
        scene.collection.objects.link(lamp_obj)
    else:
        cam_data.lens = 50
        up = -0.65 if model["view"] == "below" else 0.65
        direction = Vector((0.75, -1.25, up)).normalized()
        fov = 2 * math.atan(27 / 2 / cam_data.lens)  # vertical field of view of a 36 x 27 mm frame
        cam.location = centre + direction * (radius / math.sin(fov / 2) * 1.05)
        target = centre
    cam.rotation_euler = (target - cam.location).to_track_quat("-Z", "Y").to_euler()
    scene.camera = cam
    sun = bpy.data.lights.new("sun", "SUN")
    sun.energy = 3.0
    sun_obj = bpy.data.objects.new("sun", sun)
    sun_obj.rotation_euler = (math.radians(50), 0, math.radians(30))
    scene.collection.objects.link(sun_obj)

    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = 32
    scene.cycles.use_denoising = True
    scene.render.resolution_x = 480
    scene.render.resolution_y = 360
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath = str(pathlib.Path(out_dir) / f"{model['name']}.png")
    bpy.ops.render.render(write_still=True)


# ---------------------------------------------------------------- MODELS.md

def unity_size(dims):
    """Blender (X, Y, Z) lengths -> Unity (X, Y, Z) lengths."""
    return dims.x, dims.z, dims.y


def write_docs(results):
    lines = [
        "# 3D models",
        "",
        "Generated by the scripts in `Tools/blender/` (see its README). Do not edit the FBX files by hand:",
        "change the script and rerun it. This file is written by `Tools/blender/verify.py` from the exported",
        "files, so the numbers below are measured, not typed.",
        "",
        "Conventions for every file:",
        "",
        "- Units: metres. Import with **Convert Units** on (the default); the scale is 1 and the rotation 0.",
        "- Axes: Unity's (Y up, Z forward). Models that have a front face Unity +Z. Blender X maps to Unity -X",
        "  (Unity mirrors the FBX X axis on import), so nothing is mirrored.",
        "- One mesh per file. No textures and no embedded media; create Unity materials for the slots below.",
        "- Material slots come from this list only: `Hull`, `Panel`, `SolarCell`, `Metal`, `Glass`, `Emissive`, `Dark`.",
        "- UVs: one channel, world-scale box projection (1 m = 1 UV unit); the Earth has equirectangular UVs.",
        "- `.meta` files are not committed with this change: Unity creates them on first import.",
        "",
        "Size is the bounding box in Unity axes, X x Y x Z, in metres.",
        "",
    ]
    by_group = {}
    for model, result in results:
        by_group.setdefault(model["group"], []).append((model, result))
    for group, items in by_group.items():
        lines += [f"## {group}", "", "| File | What it is for | Size (m) | Origin | Material slots | Triangles | File size |",
                  "|---|---|---|---|---|---|---|"]
        for model, r in items:
            x, y, z = unity_size(r["dims"])
            lines.append(
                f"| `{model['name']}.fbx` | {model['use']} | {x:.4f} x {y:.4f} x {z:.4f} | {model['origin_text']} "
                f"| {', '.join('`' + s + '`' for s in r['slots'])} | {r['tris']:,} | {r['bytes'] / 1024:.0f} KB |")
        lines.append("")
    (MODEL_DIR / "MODELS.md").write_text("\n".join(lines), encoding="utf-8", newline="\n")


def main():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--previews", default=None, help="folder for preview PNGs")
    parser.add_argument("--write-docs", action="store_true", help="write MODELS.md")
    parser.add_argument("--only", nargs="*", default=None)
    args = parser.parse_args(argv)
    if args.write_docs and args.only:
        parser.error("--write-docs needs every model; do not combine it with --only")

    results = []
    for model in MODELS:
        if args.only and model["name"] not in args.only:
            continue
        r = verify(model)
        x, y, z = unity_size(r["dims"])
        print(f"OK {r['name']}: {x:.4f} x {y:.4f} x {z:.4f} m (Unity XYZ), {r['tris']} tris, "
              f"{r['parts']} closed parts, slots {r['slots']}, {r['bytes']} bytes")
        if args.previews:
            render_preview(model, r, args.previews)
        results.append((model, r))
    if args.write_docs:
        write_docs(results)
    print(f"verified {len(results)} models")


if __name__ == "__main__":
    main()
