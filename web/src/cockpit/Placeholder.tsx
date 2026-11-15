// Owned by the cockpit agent: replace with the fly step (status screens, 52-week grid, commands, report).
import { ScreenFrame } from "../ui";

export function CockpitPlaceholder() {
  return (
    <ScreenFrame step="fly" title="Step: fly">
      <div data-testid="screen">Screen: fly</div>
    </ScreenFrame>
  );
}
