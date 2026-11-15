// Crew setup: four seats; each picks a look and, separately, a role. Every role is taken once.
import { useState } from "react";
import { PixelButton } from "../../../ui";
import { ART_LOOKS, ROLE_NAME, ROLE_SKILLS, LOOK_NAME, assignLook, assignRole, crewComplete, emptySeats, fillTheRest, rename, toCrewSetup } from "../crew";
import { ROLES, type CrewSetup } from "../types";
import { Badge, CHARS, Crewman, SpriteCanvas } from "./sprites";

export function CrewScreen({ onDone }: { onDone: (crew: CrewSetup[]) => void }) {
  const [seats, setSeats] = useState(emptySeats);
  const complete = crewComplete(seats);
  return (
    <section className="a1 a1-crew" aria-labelledby="crew-title">
      <header className="a1-head">
        <div>
          <p className="a1-kicker">Tradeoff, Act 1</p>
          <h1 id="crew-title">Pick your crew</h1>
        </div>
        <p className="a1-lede">
          Four players. Each picks how their character looks and, separately, a role. Every role is taken once.
          Playing alone? Pick what you like and fill the rest.
        </p>
      </header>

      <div className="a1-seats">
        {seats.map((s, i) => (
          <fieldset key={i} className="a1-seat" aria-label={`Player ${i + 1}`}>
            <legend className="a1-seat__legend">Seat {i + 1}</legend>
            <div className="a1-seat__top">
              <div className="a1-seat__art" aria-hidden={!(s.look && s.role)}>
                {s.look && s.role
                  ? <Crewman look={s.look} role={s.role} scale={6} label={`${s.name}: ${LOOK_NAME[s.look]} look, ${ROLE_NAME[s.role]}`} />
                  : <span className="a1-seat__blank">{s.look ? "Pick a role" : "Pick a look"}</span>}
              </div>
              <label className="a1-field">
                <span>Name</span>
                <input value={s.name} maxLength={24} onChange={(e) => setSeats(rename(seats, i, e.target.value))} />
              </label>
            </div>

            <div className="a1-group" role="group" aria-label={`Look for seat ${i + 1}`}>
              <span className="a1-group__title">Look</span>
              <div className="a1-looks">
                {ART_LOOKS.map((l) => (
                  <button key={l} type="button" className="a1-look" aria-pressed={s.look === l}
                    onClick={() => setSeats(assignLook(seats, i, l))}>
                    <SpriteCanvas layers={[CHARS[l].portrait]} scale={2} />
                    <span>{LOOK_NAME[l]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="a1-group" role="group" aria-label={`Role for seat ${i + 1}`}>
              <span className="a1-group__title">Role</span>
              <div className="a1-roles">
                {ROLES.map((r) => {
                  const holder = seats.findIndex((x) => x.role === r);
                  const taken = holder >= 0 && holder !== i;
                  return (
                    <button key={r} type="button" className="a1-role" aria-pressed={s.role === r}
                      data-taken={taken || undefined} onClick={() => setSeats(assignRole(seats, i, r))}>
                      <Badge role={r} />
                      <span className="a1-role__name">{ROLE_NAME[r]}</span>
                      <span className="a1-role__note">{taken ? `Taken by seat ${holder + 1}: take it` : ROLE_SKILLS[r]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </fieldset>
        ))}
      </div>

      <footer className="a1-foot">
        <p role="status" className="a1-foot__note">
          {complete ? "The crew is complete." : `${seats.filter((s) => s.look && s.role).length} of 4 seats are ready.`}
        </p>
        <PixelButton onClick={() => setSeats(fillTheRest(seats))} disabled={complete}>Fill the rest</PixelButton>
        <PixelButton primary disabled={!complete} onClick={() => onDone(toCrewSetup(seats))}>To the mission board</PixelButton>
      </footer>
    </section>
  );
}
