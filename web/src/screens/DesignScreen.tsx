import type { MissionState } from "../bridge/types";
import { ScreenFrame } from "../ui";
import { GroupPicker } from "./parts/GroupPicker";
import { IssueList } from "./parts/IssueList";
import { PixelCubeSat, type SatAntenna, type SatInstrument, type SatPanels, type SatSize } from "./parts/PixelCubeSat";
import { ResourceList } from "./parts/ResourceList";
import { StepFooter } from "./parts/StepFooter";
import { defaultSend, type Send } from "./send";

const LEFT = [
  { title: "Spacecraft", groups: ["format", "power", "attitude", "storage"] },
];
const RIGHT = [
  { title: "Instrument", groups: ["instrument"] },
  { title: "Communications", groups: ["radio", "groundStation", "backupStation"] },
  { title: "Launch", groups: ["launch"] },
];

const pick = (state: MissionState, group: keyof MissionState["design"]) => {
  const v = state.design[group];
  return typeof v === "string" ? v.toLowerCase() : "";
};

/** How the drawing reads the chosen option ids. Only the look; the numbers are Unity's. */
export function satLook(state: MissionState): { size: SatSize; panels: SatPanels; antenna: SatAntenna; instrument: SatInstrument } {
  const format = pick(state, "format");
  const power = pick(state, "power");
  const radio = pick(state, "radio");
  const instrument = pick(state, "instrument");
  return {
    size: format.includes("6u") ? 6 : format.includes("1u") ? 1 : format.includes("3u") ? 3 : null,
    panels: !power ? null : /fixed|body/.test(power) ? "body" : /large|6u/.test(power) ? "large" : "deployable",
    antenna: !radio ? null : radio.includes("uhf") ? "whip" : "patch",
    instrument: !instrument ? null : /multi/.test(instrument) ? "multispectral" : /rgb|camera/.test(instrument) ? "camera" : "sensor",
  };
}

/** Step 4, design: the blueprint. The CubeSat in the centre, the four groups beside it, the six resources. */
export function DesignScreen({ state, send = defaultSend }: { state: MissionState; send?: Send }) {
  const column = (blocks: typeof LEFT) => blocks.map((b) => (
    <section key={b.title} className="bp__block" aria-labelledby={`bp-${b.title}`}>
      <h2 id={`bp-${b.title}`} className="section-title">{b.title}</h2>
      {b.groups.map((g) => <GroupPicker key={g} state={state} group={g} send={send} compact />)}
    </section>
  ));
  return (
    <ScreenFrame step="design" title="4 Design" footer={<StepFooter step="design" send={send} />}>
      <div className="bp">
        <div className="bp__col">{column(LEFT)}</div>
        <div className="bp__centre">
          <IssueList issues={state.issues} step="design" />
          <div className="bp__sat">
            <PixelCubeSat {...satLook(state)} />
          </div>
          <section aria-labelledby="bp-resources">
            <h2 id="bp-resources" className="section-title">Resources</h2>
            <ResourceList resources={state.resources} />
          </section>
        </div>
        <div className="bp__col">{column(RIGHT)}</div>
      </div>
    </ScreenFrame>
  );
}
