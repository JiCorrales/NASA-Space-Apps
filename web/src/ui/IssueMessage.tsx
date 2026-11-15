import type { Issue } from "../bridge/types";

const TAG = { info: "i INFO", warning: "! WARNING", critical: "X CRITICAL" } as const;

export function IssueMessage({ issue }: { issue: Issue }) {
  return (
    <div className="issue" data-severity={issue.severity} role={issue.severity === "critical" ? "alert" : "status"}>
      <span className="issue__tag">{TAG[issue.severity]}</span>
      <span>{issue.message}</span>
    </div>
  );
}
