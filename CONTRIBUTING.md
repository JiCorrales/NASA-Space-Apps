# Development rules

Rules for everyone working on this repo, people and AI agents alike. Each one exists to avoid a problem
that costs hours during a 48-hour hackathon.

## Branches and pull requests

- Branch from `develop` as `type/slug` (`feat/mission-console`, `fix/door-collider`). One purpose per branch.
- Open a pull request into `develop`. Do not commit on `develop` or `main` directly.
- `main` is protected and only receives `develop` through a pull request, when the build is known to work.
- Keep branches short: merge within hours, not days. Update with `git rebase origin/develop`.
- Never force-push a branch someone else is using.
- Agents working in parallel use one git worktree per branch and never run `git stash` (the stash is shared
  between worktrees, so one agent takes another's changes).

## Commits

- Conventional Commits: `type(scope): imperative summary`, 72 characters or fewer. The body says why.
- One logical change per commit. Read `git status` before staging; no blind `git add -A`.
- Never commit credentials, API keys or tokens.

## Unity

- **One Unity version for the whole team.** It is the one recorded in `ProjectSettings/ProjectVersion.txt`.
  Opening the project with another version rewrites files for everyone.
- **The Unity project lives at the repo root** (`Assets/`, `Packages/`, `ProjectSettings/`). The `.gitignore`
  is written for that layout.
- **Always commit `.meta` files** together with their asset, and delete them together. Unity links assets by
  the ID inside the `.meta`; a missing one breaks references on every other machine.
- **Never commit `Library/`, `Temp/`, `Logs/` or `UserSettings/`.** They are caches Unity rebuilds.
- **One owner per scene at a time.** Scene files merge badly. Say in the team chat which scene you hold.
- **Build things as prefabs; scenes only place them.** Two people can then work on the same room without
  touching the same file.
- **The ship is generated.** `Assets/_Project/Scenes/Ship.unity` and the prefabs it places
  (`Assets/_Project/Prefabs/`) come from the ship builder, `Assets/_Project/Scripts/Editor/Ship/ShipBuilder.cs`.
  Nobody edits or merges them by hand: change the builder and rerun it, from the menu **Space Apps > Build Ship
  Scene** or headless with `-executeMethod SpaceApps.Ship.Editor.ShipBuilder.Build`. Commit regenerated files
  only together with the builder change that caused them (a rerun gives the scene new internal IDs, so the diff
  is large even when nothing changed). On a merge conflict in them, take either side and rerun the builder.
- Project settings: Asset Serialization = Force Text, Version Control = Visible Meta Files.
- Our own files go under `Assets/_Project/` (`Scenes`, `Scripts`, `Prefabs`, `Art`, `Data`). Downloaded
  assets go under `Assets/ThirdParty/<source>/` and are never edited in place.
- No file over 100 MB: GitHub rejects the push.

## Mission data

- Numbers the game uses (launchers, orbits, instruments, costs) live in data files under
  `Assets/_Project/Data/`, not hard-coded in scripts.
- Every value taken from NASA or another agency records its source next to it. The judges score how
  central NASA data is to the solution.

## Third-party assets and AI

- Before committing any asset you did not make, add it to [CREDITS.md](CREDITS.md): name, author, source
  link and licence. This includes free and CC0 assets. The submission form requires the full list.
- Unity Asset Store packages (Standard Asset Store EULA) must not be committed to this public repository. They
  live in `Assets/ThirdParty/AssetStore/`, which git ignores, and may only ship inside builds.
- Code must work without that folder: load such assets by name from a `Resources` folder and treat null as
  "not installed" (see `SpaceSky`). The tests must pass with and without it.
- Only use assets whose licence allows it. If you cannot find the licence, do not use the asset.
- Nothing may show NASA logos, flags or mission identifiers. Real NASA spacecraft models often carry the
  insignia on their textures: check before importing.
- No images, video or audio of people under 18.
- AI use is allowed but must be declared in [AI_USAGE.md](AI_USAGE.md). AI-generated images and video
  need a visible watermark.

## Language

- Everything in the repo and in the submission is in English: code, comments, UI text, docs, commits.

## Builds

- WebGL, from the repo root:
  `<Unity> -batchmode -quit -projectPath . -buildTarget WebGL -executeMethod SpaceApps.Editor.Build.WebGLBuild.Build -logFile build.log`.
  It builds the scenes enabled in Build Settings and exits non-zero on failure.
- The output goes to `Builds/WebGL/`, which is ignored by git. Serve the folder over HTTP to test it; opening
  `index.html` from disk does not work.
- Compression is disabled for this build only, because GitHub Pages cannot send `Content-Encoding` headers.
- Windows VR (Meta Quest over Link, and keyboard and mouse), from the repo root:
  `<Unity> -batchmode -quit -projectPath . -buildTarget Win64 -executeMethod SpaceApps.Editor.Build.WindowsBuild.Build -logFile build.log`,
  optionally with `-windowsBuildOutput <folder>`. The output goes to `Builds/Windows/SpaceMissionDesignGame.exe`. It builds
  with Mono (restored to the project's IL2CPP afterwards) and fails if `openxr_loader.dll` is missing from the player.
- **A build or platform switch rewrites shared settings files.** Unity changes `ProjectSettings/ProjectSettings.asset`,
  `GraphicsSettings.asset`, `EditorBuildSettings.asset`, `Assets/XR/Settings/OpenXRPackageSettings.asset`,
  `Assets/DefaultVolumeProfile.asset` and the URP assets in `Assets/Settings/Project Configuration/`.
  The `ProjectSettings.asset` change empties `preloadedAssets`, which breaks the VR build. Restore these files
  with `git restore` after building and never commit them.

## Before you open a pull request

1. The project opens in Unity with no errors in the Console.
2. The scene you touched enters Play mode and the change works.
3. `git status` shows only the files you meant to change, with their `.meta` files.
4. New assets are in `CREDITS.md`; AI-generated content is in `AI_USAGE.md`.

## Validation flow

1. Validate on the development PC in the Unity editor.
2. Then update the PC with the headset and test in VR.
3. Only what passed both steps is promoted from `develop` to `main`.
