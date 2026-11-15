"""Model definitions: one builder function per FBX, plus the registry the build and verify scripts use.

Lengths are in metres. Blender axes: X right, -Y front, Z up (Unity: X, +Z forward, Y up).
"""

import math

from mathutils import Matrix

from shapes import Builder

# CubeSat Design Specification: rails at least 8.5 mm wide; the rail ends stand out from the structure.
RAIL = 0.0085
RAIL_STANDOFF = 0.00675
CELL_GAP = 0.003


# ---------------------------------------------------------------- CubeSat bodies

def _cell(b, u0, u1, v0, v1, place):
    """Solar cell with cropped corners. place(u, v, w) maps face coordinates to XYZ."""
    c = min(u1 - u0, v1 - v0) * 0.12
    outline = [(u0 + c, v0), (u1 - c, v0), (u1, v0 + c), (u1, v1 - c),
               (u1 - c, v1), (u0 + c, v1), (u0, v1 - c), (u0, v0 + c)]
    pts = [place(u, v, w) for (u, v) in outline for w in (-0.001, 0.0006)]
    b.hull(pts, "SolarCell")


def _cell_grid(b, width, height, cols, rows, place):
    cw = (width - (cols + 1) * CELL_GAP) / cols
    ch = (height - (rows + 1) * CELL_GAP) / rows
    for i in range(cols):
        for j in range(rows):
            u0 = -width / 2 + CELL_GAP + i * (cw + CELL_GAP)
            v0 = -height / 2 + CELL_GAP + j * (ch + CELL_GAP)
            _cell(b, u0, u0 + cw, v0, v0 + ch, place)


def cubesat_body(name, wx, wy, length, cols_x_face, cols_y_face, rows):
    """Body standing on its long axis (Blender Z = Unity Y), origin at its geometric centre."""
    b = Builder(name)
    hx, hy, hz = wx / 2, wy / 2, length / 2
    # Four corner rails, full length.
    for sx in (-1, 1):
        for sy in (-1, 1):
            xs = sorted((sx * hx, sx * (hx - RAIL)))
            ys = sorted((sy * hy, sy * (hy - RAIL)))
            b.box((xs[0], ys[0], -hz), (xs[1], ys[1], hz), "Metal")
    # Structure core, 1 mm inside the rails, shorter than the rails by the standoff.
    cx, cy, cz = hx - 0.001, hy - 0.001, hz - RAIL_STANDOFF
    b.box((-cx, -cy, -cz), (cx, cy, cz), "Panel")
    # End plates with an access cover.
    for s in (-1, 1):
        z = s * cz
        b.box((-cx + RAIL, -cy + RAIL, min(z, z + s * 0.0012)), (cx - RAIL, cy - RAIL, max(z, z + s * 0.0012)), "Metal")
        b.box((-0.02, -0.02, min(z, z + s * 0.002)), (0.02, 0.02, max(z, z + s * 0.002)), "Dark")
    # Solar cells on the four long faces, between the rails.
    face_h = 2 * cz - 0.006
    span_x = wx - 2 * RAIL - 0.002
    span_y = wy - 2 * RAIL - 0.002
    for s in (-1, 1):
        _cell_grid(b, span_x, face_h, cols_x_face, rows, lambda u, v, w, s=s: (u, s * (cy + w), v))
        _cell_grid(b, span_y, face_h, cols_y_face, rows, lambda u, v, w, s=s: (s * (cx + w), u, v))
    return b.finish()


def cubesat_1u():
    return cubesat_body("CubeSat_1U", 0.10, 0.10, 0.1135, 2, 2, 1)


def cubesat_3u():
    return cubesat_body("CubeSat_3U", 0.10, 0.10, 0.34, 2, 2, 4)


def cubesat_6u():
    return cubesat_body("CubeSat_6U", 0.20, 0.10, 0.34, 4, 2, 4)


# ---------------------------------------------------------------- parts

def solar_wing():
    """Two-panel deployable wing, deployed flat. Hinge line on local Z through the origin."""
    b = Builder("Part_SolarWing")
    pw, ph, t = 0.100, 0.32, 0.0016
    for k, x0 in enumerate((0.004, 0.108)):
        b.box((x0, -t / 2, -ph / 2), (x0 + pw, t / 2, ph / 2), "Panel")
        # Cells face -Y (Unity +Z).
        _cell_grid(b, pw, ph, 2, 4, lambda u, v, w, x0=x0: (x0 + pw / 2 + u, -(t / 2 + w), v))
        # Hinge knuckles on the inner edge of each panel.
        hx = x0 - 0.004
        for z in (-0.12, 0.12):
            b.cylinder((hx, 0.0, z - 0.012), (0, 0, 1), 0.024, 0.002, "Metal", segments=8)
    return b.finish()


def antenna_uhf():
    """Deployed UHF tape whip, about a quarter wavelength at 437 MHz. Origin at the mounting face."""
    b = Builder("Part_AntennaUHF")
    b.box((-0.015, -0.010, 0.0), (0.015, 0.010, 0.008), "Metal")
    b.cylinder((0.0, 0.0, 0.008), (0, 0, 1), 0.006, 0.0045, "Dark", segments=12)
    b.box((-0.003, -0.0005, 0.014), (0.003, 0.0005, 0.184), "Metal")
    b.cylinder((0.0, 0.0, 0.180), (0, 0, 1), 0.004, 0.0025, "Dark", segments=8)
    return b.finish()


def antenna_sband():
    """Square S-band patch antenna. Origin at the centre of the mounting face."""
    b = Builder("Part_AntennaSBand")
    b.box((-0.035, -0.035, 0.0), (0.035, 0.035, 0.002), "Panel")
    b.box((-0.026, -0.026, 0.002), (0.026, 0.026, 0.006), "Hull")
    b.box((-0.016, -0.016, 0.006), (0.016, 0.016, 0.0065), "Metal")
    b.cylinder((0.006, 0.006, 0.0065), (0, 0, 1), 0.001, 0.0018, "Dark", segments=8)
    for sx in (-1, 1):
        for sy in (-1, 1):
            b.cylinder((sx * 0.031, sy * 0.031, 0.002), (0, 0, 1), 0.0015, 0.002, "Metal", segments=8)
    return b.finish()


def camera_basic():
    """Single-lens camera. Looks along local +Z (Unity +Y). Origin at the mounting flange."""
    b = Builder("Instrument_Camera")
    b.box((-0.025, -0.025, 0.0), (0.025, 0.025, 0.004), "Metal")
    b.cylinder((0, 0, 0.004), (0, 0, 1), 0.030, 0.021, "Dark", segments=20)
    b.cylinder((0, 0, 0.034), (0, 0, 1), 0.012, 0.018, "Metal", segments=20)
    b.tube((0, 0, 0.046), (0, 0, 1), 0.006, 0.017, 0.0135, "Dark", segments=20)
    b.cylinder((0, 0, 0.046), (0, 0, 1), 0.004, 0.0135, "Glass", segments=20)
    return b.finish()


def camera_multispectral():
    """Four lenses in a 2 x 2 array, one per spectral band. Origin at the mounting face."""
    b = Builder("Instrument_MultispectralCamera")
    b.box((-0.045, -0.045, 0.0), (0.045, 0.045, 0.004), "Metal")
    b.box((-0.042, -0.042, 0.004), (0.042, 0.042, 0.040), "Hull")
    b.box((-0.040, -0.040, 0.040), (0.040, 0.040, 0.043), "Dark")
    for sx in (-1, 1):
        for sy in (-1, 1):
            c = (sx * 0.019, sy * 0.019)
            b.tube((*c, 0.043), (0, 0, 1), 0.013, 0.015, 0.0115, "Metal", segments=16)
            b.cylinder((*c, 0.043), (0, 0, 1), 0.004, 0.0115, "Glass", segments=16)
    return b.finish()


def radiation_detector():
    """Scintillator module (28 x 28 x 40 mm) on its readout board. Origin at the board's mounting face."""
    b = Builder("Instrument_RadiationDetector")
    b.box((-0.030, -0.0225, 0.0), (0.030, 0.0225, 0.0016), "Panel")
    b.box((-0.014, -0.014, 0.0016), (0.014, 0.014, 0.0416), "Metal")
    b.box((-0.010, -0.010, 0.0416), (0.010, 0.010, 0.0426), "Dark")
    b.box((0.017, -0.006, 0.0016), (0.027, 0.006, 0.0076), "Dark")
    for sx in (-1, 1):
        for sy in (-1, 1):
            b.cylinder((sx * 0.026, sy * 0.0185, 0.0016), (0, 0, 1), 0.002, 0.0018, "Metal", segments=8)
    # Cooling ribs on the housing make it read as a detector, not a plain box.
    for z in (0.010, 0.018, 0.026, 0.034):
        b.box((-0.0155, -0.0155, z), (0.0155, 0.0155, z + 0.002), "Metal")
    return b.finish()


def magnetometer():
    """Sensor head on a short folding boom. Boom runs along local +Z. Origin at the hinge base."""
    b = Builder("Instrument_Magnetometer")
    b.box((-0.015, -0.010, 0.0), (0.015, 0.010, 0.010), "Metal")
    b.cylinder((-0.012, 0.0, 0.014), (1, 0, 0), 0.024, 0.005, "Metal", segments=12)
    b.box((-0.006, -0.006, 0.010), (0.006, 0.006, 0.022), "Metal")
    b.cylinder((0, 0, 0.022), (0, 0, 1), 0.250, 0.004, "Dark", segments=12)
    b.box((-0.016, -0.016, 0.272), (0.016, 0.016, 0.302), "Hull")
    b.box((-0.0165, -0.0165, 0.284), (0.0165, 0.0165, 0.290), "Panel")
    return b.finish()


def mass_spectrometer():
    """Ion and neutral mass spectrometer (13.5 x 9 x 9 cm) with its two ram apertures on top."""
    b = Builder("Instrument_MassSpectrometer")
    b.box((-0.0675, -0.045, 0.0), (0.0675, 0.045, 0.020), "Panel")
    b.box((-0.065, -0.043, 0.020), (0.065, 0.043, 0.090), "Hull")
    # Ion aperture: round collimator.
    b.tube((-0.030, 0.0, 0.090), (0, 0, 1), 0.016, 0.020, 0.014, "Metal", segments=20)
    b.cylinder((-0.030, 0.0, 0.090), (0, 0, 1), 0.004, 0.014, "Dark", segments=20)
    # Neutral aperture: slot with a frame.
    b.box((0.012, -0.022, 0.090), (0.052, 0.022, 0.096), "Metal")
    b.box((0.018, -0.016, 0.090), (0.046, 0.016, 0.0965), "Dark")
    # Radiator fins on one end.
    for y in (-0.030, -0.015, 0.0, 0.015, 0.030):
        b.box((0.065, y - 0.002, 0.025), (0.0675, y + 0.002, 0.085), "Metal")
    return b.finish()


def radiometer():
    """Sub-millimetre radiometer: receiver box, feed horn and a 45 degree scan mirror on a yoke."""
    b = Builder("Instrument_Radiometer")
    b.box((-0.045, -0.045, 0.0), (0.045, 0.045, 0.060), "Hull")
    b.box((-0.046, -0.046, 0.0), (0.046, 0.046, 0.008), "Panel")
    b.cylinder((0, 0, 0.060), (0, 0, 1), 0.035, 0.006, "Metal", radius_top=0.018, segments=20)
    for sx in (-1, 1):
        b.box((sx * 0.040 - 0.003, -0.006, 0.060), (sx * 0.040 + 0.003, 0.006, 0.125), "Metal")
    b.cylinder((-0.043, 0.0, 0.118), (1, 0, 0), 0.086, 0.003, "Metal", segments=8)
    tilt = Matrix.Translation((0, 0, 0.118)) @ Matrix.Rotation(math.radians(45), 4, "X")
    b.cylinder((0, 0, -0.002), (0, 0, 1), 0.004, 0.032, "Metal", segments=24, matrix=tilt)
    b.cylinder((0, 0, -0.0045), (0, 0, 1), 0.0025, 0.030, "Dark", segments=24, matrix=tilt)
    return b.finish()


# ---------------------------------------------------------------- ship interior

def console():
    """Operator console, 1.2 m wide. Back flush against the wall at y = 0, front toward -Y (Unity +Z)."""
    b = Builder("Ship_Console")
    b.box((-0.58, -0.52, 0.0), (0.58, -0.02, 0.08), "Dark")
    b.prism_yz([(0.0, 0.08), (-0.56, 0.08), (-0.70, 0.80), (-0.70, 0.85), (0.0, 1.05)], -0.60, 0.60, "Hull")
    # Side trims.
    for x0, x1 in ((-0.62, -0.60), (0.60, 0.62)):
        b.prism_yz([(0.0, 0.06), (-0.58, 0.06), (-0.72, 0.80), (-0.72, 0.87), (0.0, 1.07)], x0, x1, "Metal")
    # Front doors.
    for x0 in (-0.55, 0.01):
        b.prism_yz([(-0.57, 0.14), (-0.585, 0.14), (-0.69, 0.66), (-0.675, 0.66)], x0, x0 + 0.54, "Panel")
    # Desk top: tilted control surface, built in a frame lying on the slope.
    slope = math.atan2(1.05 - 0.85, 0.70)
    top = Matrix.Translation((0.0, -0.35, 0.95)) @ Matrix.Rotation(slope, 4, "X")
    b.box((-0.56, -0.30, 0.0), (0.56, 0.30, 0.012), "Panel", matrix=top)
    b.box((-0.30, -0.16, 0.012), (0.30, 0.22, 0.026), "Dark", matrix=top)
    b.box((-0.28, -0.14, 0.026), (0.28, 0.20, 0.029), "Emissive", matrix=top)
    for side in (-1, 1):
        for i in range(3):
            for j in range(2):
                x = side * (0.37 + i * 0.06)
                y = -0.05 + j * 0.12
                b.box((x - 0.02, y - 0.03, 0.012), (x + 0.02, y + 0.03, 0.024), "Emissive" if (i + j) % 2 else "Metal", matrix=top)
    # Front lip / hand rest.
    b.cylinder((-0.60, -0.71, 0.83), (1, 0, 0), 1.20, 0.025, "Metal", segments=12)
    return b.finish()


def _corridor(name, window):
    """Hull segment 3 m long (Y) x 3 m wide (X) x 2.6 m high (Z). Origin on the walkable floor, centred."""
    b = Builder(name)
    L = 1.5
    # Floor: dark slab with two raised plates.
    b.box((-1.5, -L, -0.10), (1.5, L, -0.01), "Dark")
    for y0, y1 in ((-1.48, -0.02), (0.02, 1.48)):
        b.box((-1.38, y0, -0.05), (1.38, y1, 0.0), "Panel")

    def shell(side, y0, y1):
        x_out, x_in = side * 1.5, side * 1.4
        b.box((min(x_out, x_in), y0, -0.10), (max(x_out, x_in), y1, 2.0), "Hull")

    # Walls (the window variant cuts an opening into the Blender +X wall, Unity -X).
    shell(-1, -L, L)
    if window:
        wy, z0, z1 = 0.9, 0.8, 1.8
        b.box((1.4, -L, -0.10), (1.5, L, z0), "Hull")
        b.box((1.4, -L, z1), (1.5, L, 2.0), "Hull")
        b.box((1.4, -L, z0), (1.5, -wy, z1), "Hull")
        b.box((1.4, wy, z0), (1.5, L, z1), "Hull")
        # Frame and pane.
        f = 0.08
        b.box((1.34, -wy - f, z0 - f), (1.42, wy + f, z0), "Metal")
        b.box((1.34, -wy - f, z1), (1.42, wy + f, z1 + f), "Metal")
        b.box((1.34, -wy - f, z0), (1.42, -wy, z1), "Metal")
        b.box((1.34, wy, z0), (1.42, wy + f, z1), "Metal")
        b.box((1.44, -wy, z0), (1.46, wy, z1), "Glass")
    else:
        shell(1, -L, L)
    # Chamfered upper corners and ceiling.
    for s in (-1, 1):
        b.prism_xz([(s * 1.5, 2.0), (s * 1.0, 2.6 - 0.1), (s * 1.0, 2.4), (s * 1.4, 2.0)], -L, L, "Hull")
    b.box((-1.0, -L, 2.4), (1.0, L, 2.5), "Hull")

    # Ribs: a frame at each end, plus one in the middle of the plain segment.
    ribs = [(-L, -L + 0.12), (L - 0.12, L)]
    if not window:
        ribs.append((-0.06, 0.06))
    for y0, y1 in ribs:
        for s in (-1, 1):
            b.box((min(s * 1.4, s * 1.28), y0, 0.0), (max(s * 1.4, s * 1.28), y1, 2.0), "Metal")
            b.prism_xz([(s * 1.4, 2.0), (s * 1.0, 2.4), (s * 1.0, 2.28), (s * 1.28, 2.0)], y0, y1, "Metal")
        b.box((-1.0, y0, 2.28), (1.0, y1, 2.4), "Metal")

    # Wall and ceiling panels between the ribs.
    bays = [(-1.32, 1.32)] if window else [(-1.32, -0.12), (0.12, 1.32)]
    for y0, y1 in bays:
        for s in (-1, 1):
            xs = sorted((s * 1.4, s * 1.37))
            if window and s == 1:
                b.box((xs[0], y0, 0.20), (xs[1], y1, 0.60), "Panel")
            else:
                b.box((xs[0], y0, 0.25), (xs[1], y1, 1.85), "Panel")
            xk = sorted((s * 1.4, s * 1.38))
            b.box((xk[0], y0, 0.0), (xk[1], y1, 0.12), "Dark")
        b.box((-0.85, y0, 2.37), (0.85, y1, 2.4), "Panel")

    # Conduits along the chamfers, touching the inner chamfer face.
    for s in (-1, 1):
        for x, z in ((1.27, 2.07), (1.15, 2.19)):
            b.cylinder((s * x, -L, z), (0, 1, 0), 2 * L, 0.04, "Metal", segments=16)
    return b.finish()


def corridor():
    return _corridor("Ship_Corridor", window=False)


def corridor_window():
    return _corridor("Ship_CorridorWindow", window=True)


def light_strip():
    """Ceiling light strip 1.2 m long along Y. Origin at the centre of the mounting face (top)."""
    b = Builder("Ship_LightStrip")
    b.box((-0.075, -0.60, -0.04), (0.075, 0.60, 0.0), "Metal")
    b.box((-0.05, -0.57, -0.048), (0.05, 0.57, -0.036), "Emissive")
    for s in (-1, 1):
        b.box((-0.078, s * 0.60 - 0.015, -0.045), (0.078, s * 0.60 + 0.015, 0.0), "Dark")
    return b.finish()


# ---------------------------------------------------------------- space

def earth():
    """UV sphere, 1 m diameter, poles on Blender Z (Unity Y). Equirectangular UVs, v = 1 at the north pole."""
    b = Builder("Earth", smooth_angle_deg=180.0, project_uvs=False)
    b.uv_sphere(0.5, "Hull", u_segments=64, v_segments=32)
    return b.finish()


# ---------------------------------------------------------------- registry
# size: nominal outer size (Blender X, Y, Z) that verify.py asserts, or None when the task gives no size.
# origin: per Blender axis, where the origin sits on the bounding box: "c" centre, "min", "max",
#         or a number = expected bounding-box minimum on that axis.
# view: preview camera, "outside", "below" or "inside".

MODELS = [
    dict(name="CubeSat_1U", group="CubeSat bodies", build=cubesat_1u, size=(0.10, 0.10, 0.1135),
         origin=("c", "c", "c"), view="outside",
         use="1U CubeSat body: corner rails, cell-covered side faces, end plates.",
         origin_text="Geometric centre"),
    dict(name="CubeSat_3U", group="CubeSat bodies", build=cubesat_3u, size=(0.10, 0.10, 0.34),
         origin=("c", "c", "c"), view="outside",
         use="3U CubeSat body, long axis vertical.", origin_text="Geometric centre"),
    dict(name="CubeSat_6U", group="CubeSat bodies", build=cubesat_6u, size=(0.20, 0.10, 0.34),
         origin=("c", "c", "c"), view="outside",
         use="6U CubeSat body (2 x 3U side by side), long axis vertical.", origin_text="Geometric centre"),
    dict(name="Part_SolarWing", group="Parts", build=solar_wing, size=None,
         origin=(-0.002, "c", "c"), view="outside",
         use="Deployable solar wing, two panels, shown deployed; cells face Unity +Z. Sized for the 3U/6U long side.",
         origin_text="Middle of the hinge line (attach to a body edge)"),
    dict(name="Part_AntennaUHF", group="Parts", build=antenna_uhf, size=None,
         origin=("c", "c", "min"), view="outside",
         use="UHF tape whip antenna (radio `uhf`), deployed.", origin_text="Centre of the mounting face; whip along Unity +Y"),
    dict(name="Part_AntennaSBand", group="Parts", build=antenna_sband, size=None,
         origin=("c", "c", "min"), view="outside",
         use="S-band patch antenna (radio `s-band`).", origin_text="Centre of the mounting face; radiates along Unity +Y"),
    dict(name="Instrument_Camera", group="Instruments", build=camera_basic, size=None,
         origin=("c", "c", "min"), view="outside",
         use="Instrument `camera-basic`: single lens.", origin_text="Centre of the mounting flange; looks along Unity +Y"),
    dict(name="Instrument_MultispectralCamera", group="Instruments", build=camera_multispectral, size=None,
         origin=("c", "c", "min"), view="outside",
         use="Instrument `camera-multispectral`: 2 x 2 lens array.", origin_text="Centre of the mounting face; looks along Unity +Y"),
    dict(name="Instrument_RadiationDetector", group="Instruments", build=radiation_detector, size=None,
         origin=("c", "c", "min"), view="outside",
         use="Instrument `dosimeter`: scintillator module on its board.", origin_text="Centre of the board's mounting face"),
    dict(name="Instrument_Magnetometer", group="Instruments", build=magnetometer, size=None,
         origin=("c", "c", "min"), view="outside",
         use="Instrument `magnetometer`: sensor head on a short boom, deployed.", origin_text="Centre of the hinge base; boom along Unity +Y"),
    dict(name="Instrument_MassSpectrometer", group="Instruments", build=mass_spectrometer, size=None,
         origin=("c", "c", "min"), view="outside",
         use="Instrument `plasma-probe` (ion and neutral mass spectrometer): box with two ram apertures.",
         origin_text="Centre of the mounting face; apertures face Unity +Y"),
    dict(name="Instrument_Radiometer", group="Instruments", build=radiometer, size=None,
         origin=("c", "c", "min"), view="outside",
         use="Instrument `radiometer`: receiver, feed horn and 45 degree scan mirror.",
         origin_text="Centre of the mounting face"),
    dict(name="Ship_Console", group="Ship interior", build=console, size=None,
         origin=("c", "max", "min"), view="outside",
         use="Operator console; stands against the wall under a wall screen (top edge at 1.07 m). Faces Unity +Z.",
         origin_text="Floor, centre of the back edge (against the wall)"),
    dict(name="Ship_Corridor", group="Ship interior", build=corridor, size=(3.0, 3.0, 2.6),
         origin=("c", "c", -0.10), view="inside",
         use="Corridor hull segment with ribs, wall and ceiling panels and conduits. Ends are open; tiles every 3 m along Unity Z.",
         origin_text="Centre of the walkable floor (the floor slab goes 0.1 m below it)"),
    dict(name="Ship_CorridorWindow", group="Ship interior", build=corridor_window, size=(3.0, 3.0, 2.6),
         origin=("c", "c", -0.10), view="inside",
         use="Same segment with a 1.8 x 1.0 m window (sill at 0.8 m) in the Unity -X wall, on the left when looking along +Z; glass pane in slot `Glass`.",
         origin_text="Centre of the walkable floor"),
    dict(name="Ship_LightStrip", group="Ship interior", build=light_strip, size=None,
         origin=("c", "c", "max"), view="below",
         use="Ceiling light strip, 1.2 m along Unity Z; slot `Emissive` is the diffuser.",
         origin_text="Centre of the top (mounting) face"),
    dict(name="Earth", group="Space", build=earth, size=(1.0, 1.0, 1.0),
         origin=("c", "c", "c"), view="outside",
         use="UV sphere for the Earth, 1 m diameter (scale it in Unity). Equirectangular UVs: v = 1 at the north pole (Unity +Y); at the equator u = 0.5 faces Unity -X and u = 0.75 faces Unity -Z, so a map centred on longitude 0 puts it on -X. Assign the Earth texture material to slot `Hull`.",
         origin_text="Centre; poles on Unity Y"),
]
