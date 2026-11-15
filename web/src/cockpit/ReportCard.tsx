import type { Report } from "../bridge/types";
import { seasonColour } from "./scene/drawScene";
import { WEEK_WORDS, rateTone } from "./status";

const pct = (v: string | number) => (typeof v === "number" ? `${Math.round(v)}%` : v);
const num = (v: string | number) => {
  const n = typeof v === "number" ? v : parseFloat(v);
  return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 0;
};

/** The end-of-mission card: success rate, factors, what weighed most, a suggestion and the 52 images. */
export function ReportCard({ report, week, onRetry, onChangeDesign }: {
  report: Report; week: number; onRetry: () => void; onChangeDesign: () => void;
}) {
  const images = Array.from({ length: 52 }, (_, i) => report.images[i] ?? "");
  const delivered = images.filter((s) => s === "sent").length;
  return (
    <section className="ck-result" role="dialog" aria-labelledby="ck-result-title" data-testid="report">
      <div className="ck-eyebrow" id="ck-result-title">MISSION REPORT · WEEK {week}</div>
      <div className="ck-result-cols">
        <div className="ck-result-l">
          <div className="ck-top">
            <div className="ck-pct" data-s={rateTone(report.successRate)}>{Math.round(report.successRate)}%</div>
            <div className="ck-pct-l">mission success<small>{report.imagesDelivered} of 52 images delivered</small></div>
          </div>
          {report.factors.map((f) => (
            <div className="ck-fac" key={f.label}>
              <span>{f.label}</span>
              <div className="ck-bar"><i style={{ width: `${num(f.value)}%` }} /></div>
              <b>{pct(f.value)}</b>
            </div>
          ))}
          <div className="ck-foot">{report.lostBecause}</div>
        </div>
        <div className="ck-result-r">
          <h4>WHAT WEIGHED MOST</h4>
          <ul>{report.decisions.map((d) => <li key={d}>{d}</li>)}</ul>
          <h4>NEXT TIME</h4>
          <p>{report.suggestion}</p>
        </div>
      </div>
      <div className="ck-images">
        <h4>THE SCIENTISTS' YEAR · {delivered} OF 52 IMAGES</h4>
        <div className="ck-film" role="img" aria-label={`Image series: ${delivered} delivered, ${52 - delivered} missing`}>
          {images.map((s, i) => (
            <i key={i} data-state={s || "future"} title={`Week ${i + 1}: ${WEEK_WORDS[s]}`}
              style={s === "sent" ? { background: seasonColour(i + 1) } : undefined} />
          ))}
        </div>
        <div className="ck-legend"><span><i className="sent" /> delivered</span><span><i className="lost" /> lost</span>
          <span>colour shows the region changing through the year</span></div>
      </div>
      <div className="ck-result-btns">
        <button type="button" className="ck-cmd ck-primary" onClick={onRetry}>RETRY MISSION</button>
        <button type="button" className="ck-cmd" onClick={onChangeDesign}>CHANGE DESIGN</button>
      </div>
    </section>
  );
}
