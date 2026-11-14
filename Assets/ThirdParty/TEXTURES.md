# Third-party textures

Every downloaded texture under `Assets/ThirdParty/`, with its size, the map it holds and the surface it is meant for.
Authors, licences and source pages are in [CREDITS.md](../../CREDITS.md). No `.meta` files are committed yet:
Unity creates them the first time the project is opened, and they must be committed with these files.

## NASA

| File | Resolution | Map | Meant for |
|---|---|---|---|
| `NASA/DeepStarMaps/starmap_4k.jpg` | 4096x2048 | Colour, equirectangular star map (celestial coordinates) | Skybox seen through the windows (Skybox/Panoramic, Latitude Longitude Layout) |
| `NASA/BlueMarbleNextGeneration/world.200407.3x5400x2700.jpg` | 4096x2048 (downscaled from 5400x2700; original name kept) | Colour, equirectangular Earth surface, July, cloud-free | Earth sphere outside the windows |

## Poly Haven (CC0)

All maps are 2048x2048 JPG and tile seamlessly. Normal maps use the OpenGL convention (`nor_gl`), which is what Unity
expects: import them with Texture Type = Normal map. Roughness maps are greyscale; the URP Lit shader reads smoothness,
so invert them (1 - roughness) into the alpha of the metallic or base map, or use a shader that takes roughness.
Import roughness maps with sRGB off.

| File | Resolution | Map | Meant for |
|---|---|---|---|
| `PolyHaven/blue_metal_plate/blue_metal_plate_diff_2k.jpg` | 2048x2048 | Colour (albedo): blue painted steel panels with seams and scratches | Hull walls |
| `PolyHaven/blue_metal_plate/blue_metal_plate_nor_gl_2k.jpg` | 2048x2048 | Normal (OpenGL) | Hull walls |
| `PolyHaven/blue_metal_plate/blue_metal_plate_rough_2k.jpg` | 2048x2048 | Roughness (greyscale) | Hull walls |
| `PolyHaven/metal_plate/metal_plate_diff_2k.jpg` | 2048x2048 | Colour (albedo): worn diamond-plate steel, chipped green paint, some rust | Floor / deck |
| `PolyHaven/metal_plate/metal_plate_nor_gl_2k.jpg` | 2048x2048 | Normal (OpenGL) | Floor / deck |
| `PolyHaven/metal_plate/metal_plate_rough_2k.jpg` | 2048x2048 | Roughness (greyscale) | Floor / deck |
| `PolyHaven/rubber_tiles/rubber_tiles_diff_2k.jpg` | 2048x2048 | Colour (albedo): dark grey matte tiles with shallow seams | Consoles and desks |
| `PolyHaven/rubber_tiles/rubber_tiles_nor_gl_2k.jpg` | 2048x2048 | Normal (OpenGL) | Consoles and desks |
| `PolyHaven/rubber_tiles/rubber_tiles_rough_2k.jpg` | 2048x2048 | Roughness (greyscale) | Consoles and desks |

The floor colour map is brown-green and rusty. For a cleaner ship, tint it grey in the material or desaturate it.

## Not included

- Light strips: no CC0 emissive texture made for light strips was found (Poly Haven has none; ambientCG's
  emissive sets are office ceilings and building facades). A plain URP Lit material with Emission enabled is enough.
