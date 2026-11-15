// Three designs for tests and previews: a good one, a middling one and a poor one.
import type { Act1Design } from "./types";

export const GOOD_DESIGN: Act1Design = {
  region: "jezero", orbit: "low-sso", revisit: "watch", format: "6u", power: "large", attitude: "star", storage: "large",
  instrument: "sounder", radio: "uhf-reflectarray", groundStation: "dsn70-2h", backupStation: "orbiters", launch: "cargo-free",
  tests: ["vibration", "thermal", "deploy", "ditl"],
};

export const MIDDLING_DESIGN: Act1Design = {
  region: "gale", orbit: "high-circular", revisit: "watch", format: "3u", power: "deploy", attitude: "wheels", storage: "small",
  instrument: "weather-camera", radio: "uhf-patch", groundStation: "dsn34-1h", backupStation: "none", launch: "cargo-free",
  tests: ["vibration", "ditl"],
};

export const POOR_DESIGN: Act1Design = {
  region: "elysium", orbit: "areostationary", revisit: "relay", format: "3u", power: "body", attitude: "wheels", storage: "small",
  instrument: "weather-camera", radio: "uhf-patch", groundStation: null, backupStation: "none", launch: "cargo-free",
  tests: [],
};
