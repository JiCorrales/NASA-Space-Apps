// Recorded flight for the stand-in: the frames Unity would send during step "fly", for one mission year
// with a normal week, a solar storm, a ground station failure, an attitude fault and the final report.
//
// This is fixture data, not a simulation. It is written as a short script because 140 frames of JSON would
// be unreadable; the script only sets the values each frame shows. Every number is illustrative.

import type { CommandName, LogLine, SimCommand, SimFrame, WeekState } from "../types";

export interface FlightStep {
  frame: SimFrame;
  /** The recording waits here for the player to answer the alert (or for a timeout). */
  awaits?: CommandName[];
}

/** Indexes of named moments, for tests and screenshots. */
export interface FlightRecording {
  steps: FlightStep[];
  scenes: { launch: number; normalWeek: number; capture: number; contact: number; storm: number;
    groundFailure: number; attitudeFault: number; report: number };
}

const LABELS: Record<CommandName, [string, string]> = {
  pauseCamera: ["PAUSE CAMERA", "CAMERA PAUSED"],
  safeMode: ["SAFE MODE", "SAFE MODE ON"],
  prioritizeDownlink: ["PRIORITIZE DOWNLINK", "DOWNLINK PRIORITIZED"],
  useBackupStation: ["USE BACKUP STATION", "ON BACKUP STATION"],
  recalibrate: ["RECALIBRATE", "RECALIBRATING"],
};
const ORDER: CommandName[] = ["pauseCamera", "safeMode", "prioritizeDownlink", "useBackupStation", "recalibrate"];

type Live = Omit<SimFrame, "weeks" | "commands" | "log" | "report">;

export function recordFlight(): FlightRecording {
  const steps: FlightStep[] = [];
  const weeks: WeekState[] = Array.from({ length: 52 }, () => "");
  const log: LogLine[] = [];
  const active = new Set<CommandName>();
  // The recorded design has no backup station, so that command stays disabled all year.
  const enabled: Record<CommandName, boolean> = {
    pauseCamera: true, safeMode: true, prioritizeDownlink: true, useBackupStation: false, recalibrate: false,
  };
  const f: Live = {
    week: 1, day: 1, speed: "detail", battery: 70, pointingError: 0.2, cameraTemp: 21, storageQueue: 0,
    linkQuality: 0, imagesDelivered: 0, imagesLost: 0, projectedSuccess: 92, contact: false, capturing: false,
    alert: null,
  };

  const pad = (n: number) => String(n).padStart(2, "0");
  const note = (text: string, kind: LogLine["kind"] = "info") => {
    log.push({ week: f.week, text, kind });
    if (log.length > 6) log.shift();
  };
  const commands = (): SimCommand[] => ORDER.map((name) => ({
    name, label: LABELS[name][active.has(name) ? 1 : 0], enabled: enabled[name], active: active.has(name),
  }));
  const snap = (patch: Partial<Live>, awaits?: CommandName[]) => {
    Object.assign(f, patch);
    f.battery = Math.round(f.battery);
    f.pointingError = Math.round(f.pointingError * 10) / 10;
    f.cameraTemp = Math.round(f.cameraTemp);
    steps.push({ frame: { ...f, alert: f.alert && { ...f.alert }, weeks: [...weeks], commands: commands(),
      log: log.map((l) => ({ ...l })), report: null }, ...(awaits ? { awaits } : {}) });
    return steps.length - 1;
  };
  const dayOf = (w: number, d: number) => (w - 1) * 7 + d;
  const wobble = (w: number) => Math.sin(w * 1.7) * 3;

  /** One week in fast forward: a capture frame, then a downlink frame. */
  const fastWeek = (w: number, lostBecause?: string) => {
    f.week = w;
    weeks[w - 1] = "next";
    if (lostBecause) {
      weeks[w - 1] = "lost";
      note(`Image ${pad(w)} lost · ${lostBecause}`, "alert");
      snap({ day: dayOf(w, 3), battery: 31 + wobble(w), capturing: false, contact: false,
        imagesLost: f.imagesLost + 1, projectedSuccess: f.projectedSuccess - 1 });
      snap({ day: dayOf(w, 6), battery: 44 + wobble(w), contact: true, linkQuality: 90 });
      return;
    }
    weeks[w - 1] = "held";
    snap({ day: dayOf(w, 3), battery: 64 + wobble(w), capturing: true, contact: false, linkQuality: 0,
      storageQueue: 1, cameraTemp: 21 + wobble(w) / 3 });
    weeks[w - 1] = "sent";
    note(`Image ${pad(w)} delivered`, "good");
    snap({ day: dayOf(w, 6), battery: 66 + wobble(w), capturing: false, contact: true, linkQuality: 96,
      storageQueue: 0, imagesDelivered: f.imagesDelivered + 1 });
  };

  // ---- Launch: deployment into orbit
  note("Deployed from the launcher · solar wings open");
  const launch = snap({ week: 1, day: 1 });
  note("Telemetry nominal · all systems green");
  snap({ day: 2, battery: 72 });
  f.speed = "fast";
  for (let w = 1; w <= 6; w++) fastWeek(w);

  // ---- Week 7 in detail: a normal week
  f.speed = "detail";
  f.week = 7;
  weeks[6] = "next";
  note("Telemetry nominal · all systems green");
  const normalWeek = snap({ day: dayOf(7, 1), contact: false, capturing: false, linkQuality: 0, battery: 64 });
  note("Target region in view · camera armed");
  snap({ day: dayOf(7, 2), battery: 65 });
  weeks[6] = "held";
  note("Image 07 captured · waiting for ground pass");
  const capture = snap({ day: dayOf(7, 3), capturing: true, battery: 60, storageQueue: 1 });
  snap({ day: dayOf(7, 4), capturing: false, battery: 62 });
  note("Ground pass open · downlink started");
  snap({ day: dayOf(7, 5), contact: true, linkQuality: 97, battery: 61 });
  weeks[6] = "sent";
  note("Image 07 delivered to the science team", "good");
  const contact = snap({ day: dayOf(7, 6), storageQueue: 0, imagesDelivered: 7, battery: 60 });
  snap({ day: dayOf(7, 7), contact: false, linkQuality: 0, battery: 63 });

  // ---- Week 8: solar storm, answered with PAUSE CAMERA
  f.week = 8;
  weeks[7] = "next";
  f.alert = { code: "solarStorm", title: "SOLAR STORM · PROTON FLUX HIGH" };
  note("ALERT: solar storm · battery falling", "alert");
  snap({ day: dayOf(8, 1), battery: 52, pointingError: 0.9, cameraTemp: 26, projectedSuccess: 84 });
  snap({ day: dayOf(8, 1), battery: 38, pointingError: 1.7, cameraTemp: 30, projectedSuccess: 77 });
  const storm = snap({ day: dayOf(8, 2), battery: 24, pointingError: 2.6, cameraTemp: 34, projectedSuccess: 71 },
    ["pauseCamera", "safeMode"]);
  active.add("pauseCamera");
  weeks[7] = "lost";
  note("Admin command: camera paused · image 08 lost", "alert");
  snap({ day: dayOf(8, 3), battery: 30, pointingError: 1.9, cameraTemp: 31, imagesLost: 1, projectedSuccess: 76 });
  snap({ day: dayOf(8, 4), battery: 41, pointingError: 1.1, cameraTemp: 27, projectedSuccess: 79 });
  f.alert = null;
  active.delete("pauseCamera");
  note("Storm passed · camera resumed");
  snap({ day: dayOf(8, 6), battery: 48, pointingError: 0.3, cameraTemp: 23, projectedSuccess: 80 });

  f.speed = "fast";
  for (let w = 9; w <= 20; w++) fastWeek(w);
  f.projectedSuccess = 84;

  // ---- Weeks 21 to 23: ground station failure, answered with PRIORITIZE DOWNLINK
  f.speed = "detail";
  f.week = 21;
  weeks[20] = "held";
  note("Image 21 captured · waiting for ground pass");
  snap({ day: dayOf(21, 3), capturing: true, contact: false, linkQuality: 0, storageQueue: 1, battery: 63 });
  f.alert = { code: "groundStationOffline", title: "GROUND STATION OFFLINE · PASS MISSED" };
  note("ALERT: ground station offline · pass missed", "alert");
  const groundFailure = snap({ day: dayOf(21, 6), capturing: false, contact: false, linkQuality: 0, battery: 64,
    projectedSuccess: 80 }, ["prioritizeDownlink", "pauseCamera"]);
  active.add("prioritizeDownlink");
  note("Admin command: downlink prioritized for the next pass");
  snap({ day: dayOf(21, 7), battery: 65 });
  f.week = 22;
  weeks[21] = "held";
  note("Image 22 captured · queue: 2 images", "alert");
  snap({ day: dayOf(22, 3), capturing: true, storageQueue: 2, battery: 64, projectedSuccess: 78 });
  note("Pass missed · station still offline", "alert");
  snap({ day: dayOf(22, 6), capturing: false, battery: 66 });
  f.week = 23;
  weeks[22] = "held";
  snap({ day: dayOf(23, 3), capturing: true, storageQueue: 3, battery: 65 });
  f.alert = null;
  note("Station back online · sending the whole queue");
  snap({ day: dayOf(23, 6), capturing: false, contact: true, linkQuality: 92, battery: 49 });
  weeks[20] = weeks[21] = weeks[22] = "sent";
  active.delete("prioritizeDownlink");
  note("Images 21 to 23 delivered · battery drawn down", "good");
  snap({ day: dayOf(23, 7), storageQueue: 0, imagesDelivered: f.imagesDelivered + 3, battery: 44, projectedSuccess: 84 });

  f.speed = "fast";
  for (let w = 24; w <= 33; w++) fastWeek(w);

  // ---- Weeks 34 and 35: attitude fault, answered with RECALIBRATE
  f.speed = "detail";
  f.week = 34;
  weeks[33] = "next";
  enabled.recalibrate = true;
  f.alert = { code: "attitudeFault", title: "ATTITUDE FAULT · POINTING DRIFT" };
  note("ALERT: attitude fault · pointing drifting", "alert");
  snap({ day: dayOf(34, 1), contact: false, capturing: false, linkQuality: 0, pointingError: 1.2, battery: 60,
    projectedSuccess: 81 });
  weeks[33] = "lost";
  note("Image 34 off target · counted as lost", "alert");
  const attitudeFault = snap({ day: dayOf(34, 3), capturing: true, pointingError: 2.4, battery: 54, imagesLost: f.imagesLost + 1,
    projectedSuccess: 74 }, ["recalibrate", "safeMode"]);
  active.add("recalibrate");
  note("Admin command: recalibrating · no imaging this week");
  snap({ day: dayOf(34, 5), capturing: false, pointingError: 1.4, battery: 47 });
  f.week = 35;
  weeks[34] = "lost";
  note("Image 35 skipped for recalibration", "alert");
  snap({ day: dayOf(35, 3), pointingError: 0.6, battery: 45, imagesLost: f.imagesLost + 1, projectedSuccess: 79 });
  f.alert = null;
  active.delete("recalibrate");
  enabled.recalibrate = false;
  note("Pointing locked · error back to 0.2°");
  snap({ day: dayOf(35, 6), pointingError: 0.2, battery: 52, projectedSuccess: 82 });

  f.speed = "fast";
  for (let w = 36; w <= 52; w++) fastWeek(w, w === 45 ? "battery low, capture skipped" : undefined);

  // ---- Report
  note(`Mission complete · ${f.imagesDelivered} of 52 images delivered`, "good");
  snap({ day: 364, contact: false, capturing: false, linkQuality: 0, speed: "paused", projectedSuccess: 86 });
  const last = steps[steps.length - 1]!.frame;
  last.report = {
    successRate: 86,
    imagesDelivered: last.imagesDelivered,
    factors: [
      { label: "Science return", value: Math.round((last.imagesDelivered / 52) * 100) },
      { label: "Ground link use", value: 88 },
      { label: "Power margin", value: 63 },
      { label: "Pointing", value: 90 },
    ],
    lostBecause: "Lost images: 1 storm pause, 2 for the attitude fault, 1 skipped for low power.",
    decisions: [
      "Your battery was too small to ride out the solar storm, so the camera had to pause.",
      "Without a backup ground station, three images waited a week in storage.",
      "Magnetorquers alone could not hold pointing when the fault came.",
    ],
    suggestion: "Add a backup ground station and a larger battery; both cost less than the images they save.",
    images: [...last.weeks],
  };
  const report = steps.length - 1;

  return { steps, scenes: { launch, normalWeek, capture, contact, storm, groundFailure, attitudeFault, report } };
}
