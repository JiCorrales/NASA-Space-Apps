# CLAUDE.md

Unity game for the NASA Space Apps Challenge 2026. The rules are in [CONTRIBUTING.md](CONTRIBUTING.md):
read it before changing anything.

Agent-specific points:

- Work in your own git worktree on a `type/slug` branch from `develop`. Never `git stash`.
- Do not edit a scene another agent or person holds. Prefer adding prefabs and scripts.
- Create and delete `.meta` files only through Unity, or together with their asset.
- Everything written to the repo is in English.
- Declare generated assets in `AI_USAGE.md` and external ones in `CREDITS.md` in the same commit.
- Blender on the development PC is not on the PATH:
  `/home/isaac/Desktop/Trabajo/tooling/blender/blender-4.5.16-linux-x64/blender --background --python <script>`.
  Export FBX for Unity.
