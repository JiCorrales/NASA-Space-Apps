import type { ReactNode } from "react";
import type { Step } from "../bridge/types";

const ORDER: { step: Step; label: string }[] = [
  { step: "goals", label: "1 Goals" }, { step: "concept", label: "2 Concept" },
  { step: "requirements", label: "3 Requirements" }, { step: "design", label: "4 Design" },
  { step: "build", label: "5 Build" }, { step: "fly", label: "6 Fly" },
];

/** Full-size frame for a step: title, step indicator, body, and a footer slot for buttons. */
export function ScreenFrame({ step, title, children, footer }: {
  step: Step; title: string; children: ReactNode; footer?: ReactNode;
}) {
  return (
    <section className="frame" aria-labelledby="frame-title">
      <header className="frame__head">
        <h1 id="frame-title" className="frame__title">{title}</h1>
        <ol className="frame__steps" aria-label="Steps">
          {ORDER.map((s) => (
            <li key={s.step} aria-current={s.step === step ? "step" : undefined}>{s.label}</li>
          ))}
        </ol>
      </header>
      <div className="frame__body">{children}</div>
      {footer && <footer>{footer}</footer>}
    </section>
  );
}
