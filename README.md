# Tradeoff

*Every decision made on Earth lands on Mars with you.*

A game by team LaPeace for the
[Space Mission Design Game](https://www.spaceappschallenge.org/2026/challenges/space-mission-design-game/)
challenge of the NASA Space Apps Challenge 2026.

Four players design a Mars relay satellite with real NASA data (objective, spacecraft, instruments, launch
vehicle and orbit), launch it, and then live 30 sols on the surface with the satellite they built. The game
gives no odds and no advice while playing: the causes are named only in the final report, and every attempt
is saved.

The repository holds two versions:

- **The Mars version** (the game described above): a web page in TypeScript and React, under `web/`. The plan
  is in [docs/mars-plan.md](docs/mars-plan.md) and the sourced numbers in `Resources/10-mars-surface/`.
- **Earth Watch**, the earlier version: a 3D Unity ship whose screens decide an Earth-observation mission,
  with a web page drawn over the Unity canvas. It is the Unity project at the root of this repository; the
  branch `backup/earth-watch` keeps a snapshot of it.

## Running the Mars version

```bash
cd web
pnpm install
pnpm dev      # then open /mars-act1.html (the design) or /mars.html (the 30 sols) on the printed address
pnpm test     # the rules, the screens and the balance
```

See [web/README.md](web/README.md) for the pages and builds.

## Requirements for the Unity project

## Requirements

- Unity 6000.6.9f1, the version pinned in `ProjectSettings/ProjectVersion.txt`. Install exactly that one from
  Unity Hub.
- Git

The project was created from Unity Hub's VR template (OpenXR, XR Interaction Toolkit, URP).

## Getting started with Unity

```bash
git clone https://github.com/JiCorrales/NASA-Space-Apps.git
```

Open the cloned folder from Unity Hub with "Add project from disk".

To check that the project imports and compiles without opening the editor window (the path is the Linux
default; adjust it on Windows):

```bash
~/Unity/Hub/Editor/6000.6.9f1/Editor/Unity -batchmode -nographics -projectPath . -quit -logFile import.log
grep -c "error CS" import.log   # 0 means no compile errors
```

## Working on the project

What the game must do, where each requirement comes from and what the team still has to decide is in
[docs/requirements-specification.md](docs/requirements-specification.md).

Read [CONTRIBUTING.md](CONTRIBUTING.md) before the first commit. In short: branch from `develop`, open a
pull request into `develop`, always commit `.meta` files, and record every external asset in
[CREDITS.md](CREDITS.md).

## Credits and AI use

- [CREDITS.md](CREDITS.md) lists the NASA resources and every third-party asset used.
- [AI_USAGE.md](AI_USAGE.md) declares where AI tools were used.
