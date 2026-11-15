import { useState } from "react";
import type { MissionState } from "../bridge/types";
import { PixelButton, ScreenFrame } from "../ui";
import { GroupPicker } from "./parts/GroupPicker";
import { IssueList } from "./parts/IssueList";
import { StepFooter } from "./parts/StepFooter";
import { defaultSend, type Send } from "./send";

const DECISIONS = [
  { group: "orbit", question: "Where will the satellite fly?" },
  { group: "revisit", question: "How often must it see the region?" },
] as const;

/** Step 2, concept: one decision at a time, in large type. Moving on never needs a choice. */
export function ConceptScreen({ state, send = defaultSend }: { state: MissionState; send?: Send }) {
  const [index, setIndex] = useState(0);
  const decision = DECISIONS[index] ?? DECISIONS[0];
  const last = index === DECISIONS.length - 1;

  return (
    <ScreenFrame step="concept" title="2 Concept" footer={
      <StepFooter step="concept" send={send}>
        {index > 0 && <PixelButton onClick={() => setIndex(index - 1)}>&lt; Previous decision</PixelButton>}
        {!last && <PixelButton onClick={() => setIndex(index + 1)}>Next decision &gt;</PixelButton>}
      </StepFooter>
    }>
      <div className="concept">
        <p className="concept__count" aria-live="polite">Decision {index + 1} of {DECISIONS.length}</p>
        <p className="concept__question">{decision.question}</p>
        <GroupPicker key={decision.group} state={state} group={decision.group} send={send} heading="h2" />
        <IssueList issues={state.issues} step="concept" />
      </div>
    </ScreenFrame>
  );
}
