import type { Issue, Step } from "../../bridge/types";
import { IssueMessage } from "../../ui";

/** The issues Unity reported for this step. They are shown and never disable anything. */
export function IssueList({ issues, step }: { issues: Issue[]; step: Step }) {
  const mine = issues.filter((i) => i.step === step);
  if (mine.length === 0) return null;
  return (
    <div className="issues" aria-label="Issues">
      {mine.map((i) => <IssueMessage key={i.code} issue={i} />)}
    </div>
  );
}
