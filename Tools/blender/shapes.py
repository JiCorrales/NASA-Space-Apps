"""Geometry helpers shared by the model scripts.

Every model is built into one bmesh from closed primitives (boxes, cylinders, tubes, convex hulls).
Each primitive is a closed solid, so normals can be recalculated outward and checked later.

Blender axes used by the builders: X right, -Y front, Z up. The FBX export converts them to Unity
(Y up, Z forward): Blender -Y becomes Unity +Z, Blender Z becomes Unity Y.
"""

import math

import bmesh
import bpy
from mathutils import Matrix, Vector

# The only material slot names a model may use.
MATERIALS = ("Hull", "Panel", "SolarCell", "Metal", "Glass", "Emissive", "Dark")

# Viewport colours, so the FBX carries a sensible base colour. No textures.
BASE_COLOURS = {
    "Hull": (0.75, 0.76, 0.78, 1.0),
    "Panel": (0.42, 0.44, 0.47, 1.0),
    "SolarCell": (0.03, 0.06, 0.20, 1.0),
    "Metal": (0.80, 0.80, 0.82, 1.0),
    "Glass": (0.60, 0.75, 0.85, 0.3),
    "Emissive": (0.40, 0.85, 1.00, 1.0),
    "Dark": (0.04, 0.04, 0.05, 1.0),
}


def _axis_matrix(axis):
    """Rotation that turns local +Z into the given axis."""
    return Vector((0.0, 0.0, 1.0)).rotation_difference(Vector(axis).normalized()).to_matrix().to_4x4()


class Builder:
    """Collects closed primitives into one mesh with named material slots."""

    def __init__(self, name, smooth_angle_deg=35.0, project_uvs=True):
        self.name = name
        self.bm = bmesh.new()
        self.slots = []
        self.smooth_angle = math.radians(smooth_angle_deg)
        self.project_uvs = project_uvs
        self.matrix = Matrix.Identity(4)

    # -- material slots -------------------------------------------------
    def _slot(self, material):
        if material not in MATERIALS:
            raise ValueError(f"unknown material slot {material!r}")
        if material not in self.slots:
            self.slots.append(material)
        return self.slots.index(material)

    def _tag(self, verts, material):
        index = self._slot(material)
        for face in {f for v in verts for f in v.link_faces}:
            face.material_index = index

    def _m(self, matrix):
        return self.matrix @ (matrix if matrix is not None else Matrix.Identity(4))

    # -- primitives -----------------------------------------------------
    def box(self, lo, hi, material, matrix=None):
        """Axis-aligned box from corner lo to corner hi (in the local frame of matrix)."""
        lo, hi = Vector(lo), Vector(hi)
        size = hi - lo
        if min(size) <= 0:
            raise ValueError(f"empty box {tuple(lo)} {tuple(hi)}")
        local = Matrix.Translation((lo + hi) / 2) @ Matrix.Diagonal((*size, 1.0))
        verts = bmesh.ops.create_cube(self.bm, size=1.0, matrix=self._m(matrix) @ local)["verts"]
        self._tag(verts, material)

    def cylinder(self, base, axis, length, radius, material, radius_top=None, segments=16, matrix=None):
        """Capped cylinder (or cone) starting at base and running length along axis."""
        radius_top = radius if radius_top is None else radius_top
        local = (Matrix.Translation(base) @ _axis_matrix(axis)
                 @ Matrix.Translation((0.0, 0.0, length / 2)))
        verts = bmesh.ops.create_cone(
            self.bm, cap_ends=True, cap_tris=False, segments=segments,
            radius1=radius, radius2=radius_top, depth=length, matrix=self._m(matrix) @ local)["verts"]
        self._tag(verts, material)

    def tube(self, base, axis, length, r_out, r_in, material, segments=16, matrix=None):
        """Hollow cylinder (a ring with thickness)."""
        m = self._m(matrix) @ Matrix.Translation(base) @ _axis_matrix(axis)
        rings = []
        for r, z in ((r_out, 0.0), (r_out, length), (r_in, length), (r_in, 0.0)):
            ring = []
            for i in range(segments):
                a = 2 * math.pi * i / segments
                ring.append(self.bm.verts.new(m @ Vector((r * math.cos(a), r * math.sin(a), z))))
            rings.append(ring)
        for k in range(4):
            a_ring, b_ring = rings[k], rings[(k + 1) % 4]
            for i in range(segments):
                j = (i + 1) % segments
                self.bm.faces.new((a_ring[i], a_ring[j], b_ring[j], b_ring[i]))
        self._tag([v for ring in rings for v in ring], material)

    def hull(self, points, material, matrix=None):
        """Convex solid around the given points."""
        m = self._m(matrix)
        verts = [self.bm.verts.new(m @ Vector(p)) for p in points]
        result = bmesh.ops.convex_hull(self.bm, input=verts)
        bmesh.ops.delete(self.bm, geom=result["geom_interior"] + result["geom_unused"], context="VERTS")
        kept = [v for v in result["geom"] if isinstance(v, bmesh.types.BMVert)]
        # Merge the coplanar triangles that convex_hull leaves into clean polygons.
        edges = list({e for v in kept for e in v.link_edges})
        bmesh.ops.dissolve_limit(self.bm, angle_limit=math.radians(0.5), verts=kept, edges=edges)
        kept = [v for v in kept if v.is_valid]
        self._tag(kept, material)

    def prism_xz(self, profile, y0, y1, material, matrix=None):
        """Convex profile in the XZ plane extruded from y0 to y1."""
        pts = [(x, y, z) for (x, z) in profile for y in (y0, y1)]
        self.hull(pts, material, matrix)

    def prism_yz(self, profile, x0, x1, material, matrix=None):
        """Convex profile in the YZ plane extruded from x0 to x1."""
        pts = [(x, y, z) for (y, z) in profile for x in (x0, x1)]
        self.hull(pts, material, matrix)

    def uv_sphere(self, radius, material, u_segments=64, v_segments=32):
        uv = self.bm.loops.layers.uv.verify()
        verts = bmesh.ops.create_uvsphere(self.bm, u_segments=u_segments, v_segments=v_segments,
                                          radius=radius, matrix=self.matrix, calc_uvs=True)["verts"]
        del uv
        self._tag(verts, material)

    # -- output ---------------------------------------------------------
    def _project_uvs(self):
        """World-scale box projection (1 m = 1 UV unit) so Unity can tile textures and bake lightmaps."""
        uv = self.bm.loops.layers.uv.verify()
        for face in self.bm.faces:
            n = face.normal
            axis = max(range(3), key=lambda i: abs(n[i]))
            u_axis, v_axis = [(1, 2), (0, 2), (0, 1)][axis]
            for loop in face.loops:
                co = loop.vert.co
                loop[uv].uv = (co[u_axis], co[v_axis])

    def finish(self):
        """Create the mesh object at the world origin with no transform."""
        bm = self.bm
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
        bm.normal_update()
        if self.project_uvs:
            self._project_uvs()
        for face in bm.faces:
            face.smooth = True
        for edge in bm.edges:
            sharp = (not edge.is_manifold) or edge.calc_face_angle(math.pi) > self.smooth_angle
            edge.smooth = not sharp
        mesh = bpy.data.meshes.new(self.name)
        bm.to_mesh(mesh)
        bm.free()
        for slot in self.slots:
            mesh.materials.append(get_material(slot))
        obj = bpy.data.objects.new(self.name, mesh)
        bpy.context.scene.collection.objects.link(obj)
        return obj


def get_material(name):
    mat = bpy.data.materials.get(name)
    if mat is None:
        mat = bpy.data.materials.new(name)
        mat.diffuse_color = BASE_COLOURS[name]
        mat.use_nodes = True
        bsdf = mat.node_tree.nodes.get("Principled BSDF")
        if bsdf is not None:
            bsdf.inputs["Base Color"].default_value = BASE_COLOURS[name]
            bsdf.inputs["Metallic"].default_value = 1.0 if name == "Metal" else 0.0
    return mat


def clear_scene():
    """Remove every object and data block so material names stay exact (no .001 suffixes)."""
    for collection in (bpy.data.objects, bpy.data.meshes, bpy.data.materials, bpy.data.cameras,
                       bpy.data.lights, bpy.data.images, bpy.data.node_groups, bpy.data.worlds):
        for block in list(collection):
            collection.remove(block)


def export_fbx(obj, path):
    """Export one object for Unity: metres, Y up, Z forward, transforms baked into the mesh."""
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.export_scene.fbx(
        filepath=str(path),
        use_selection=True,
        object_types={"MESH"},
        apply_unit_scale=True,
        apply_scale_options="FBX_SCALE_ALL",
        axis_forward="-Z",
        axis_up="Y",
        bake_space_transform=True,
        use_mesh_modifiers=True,
        mesh_smooth_type="FACE",
        use_tspace=False,
        add_leaf_bones=False,
        bake_anim=False,
        path_mode="STRIP",
        embed_textures=False,
    )
