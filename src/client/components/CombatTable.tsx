import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from "react";
import type { Encounter } from "../../shared/types";
import type { Action } from "../state/encounterReducer";
import { CombatRow } from "./CombatRow";

/* Drag feel: the grabbed row lifts off the table and follows the pointer, but a "magnet" holds it to its slot.
   The further you pull, the harder it resists (and the neighbour leans away), until it snaps past and they swap. */
const SPRING = "cubic-bezier(.34, 1.56, .64, 1)"; // overshoots a little, then settles
const SNAP_AT = 0.72; // swap once the pointer has travelled this share of a row
const MAX_PULL = 0.42; // the row itself never drifts further than this share of a row from its slot
const NEIGHBOUR_PUSH = 7; // px the neighbour leans away just before the swap
const RISE = -3; // px the row rises off the table when picked up (with a drop shadow)

const reducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

const settleTimers = new WeakMap<HTMLElement, number>();

/** Sets an inline transform. Rows never keep one once they are at rest: a transform would make the row the
    containing block for the fixed-position popovers inside it. */
function setTransform(el: HTMLElement, transform: string, transition = "none") {
  window.clearTimeout(settleTimers.get(el));
  el.style.transition = transition;
  el.style.transform = transform;
  if (el.dataset.lift !== undefined || !/^translateY\(0px\)$/.test(transform)) return;
  const ms = Number(/(\d+)ms/.exec(transition)?.[1] ?? 0);
  settleTimers.set(el, window.setTimeout(() => {
    el.style.transition = "";
    el.style.transform = "";
  }, ms + 40));
}

/** One damped wobble (CSS `row-settle`), e.g. when a row lands in a new slot. */
function settle(el: HTMLElement) {
  if (reducedMotion()) return;
  delete el.dataset.settle;
  void el.offsetWidth; // restart the animation if it is already running
  el.dataset.settle = "";
  el.addEventListener("animationend", () => delete el.dataset.settle, { once: true });
}

/* Wobble of the dragged row, driven by how fast the pointer moves: a side-to-side rock whose size follows the
   pointer speed (up to a cap). When the pointer stops, the rocking dies away and the row comes to rest in its
   held position. Uses the `rotate`/`translate` properties so it adds to the inline drag transform. */
const WOBBLE_HZ = 6.5; // rocks per second
const WOBBLE_MAX = 1.3; // deg, the cap
const WOBBLE_SPEED = 0.6; // px/ms of pointer speed that gives ~63% of the cap (faster flattens out at the cap)
const WOBBLE_SHIFT = 1.6; // px of sideways shift per deg of tilt
const WOBBLE_ATTACK = 70; // ms to grow towards a bigger target
const WOBBLE_RELEASE = 260; // ms decay constant once the pointer slows or stops
const SPEED_FADE = 70; // ms decay constant of the measured pointer speed between events

interface Wobble {
  /** Report pointer movement (px) since the previous event. */
  push(distance: number): void;
  /** The drag ended: let the wobble die away, then remove it. */
  release(): void;
  /** Stop at once (a new drag on the same row takes over). */
  stop(): void;
}

const wobbles = new WeakMap<HTMLElement, Wobble>();

function startWobble(el: HTMLElement): Wobble {
  wobbles.get(el)?.stop();
  let amp = 0;
  let phase = 0;
  let speed = 0; // px/ms, smoothed
  let lastEvent = performance.now();
  let lastFrame = lastEvent;
  let released = false;
  let raf = 0;

  const clear = () => {
    el.style.rotate = "";
    el.style.translate = "";
    if (wobbles.get(el) === api) wobbles.delete(el);
  };

  const frame = (now: number) => {
    const dt = Math.min(50, now - lastFrame);
    lastFrame = now;
    speed *= Math.exp(-dt / SPEED_FADE);
    const target = released ? 0 : WOBBLE_MAX * (1 - Math.exp(-speed / WOBBLE_SPEED));
    if (target > amp) amp += (target - amp) * Math.min(1, dt / WOBBLE_ATTACK);
    else amp = Math.max(target, amp * Math.exp(-dt / WOBBLE_RELEASE));
    if (amp < 0.01 && target < 0.01) {
      // Fully still: rest on the zero-crossing so there is no visible jump.
      amp = 0;
      el.style.rotate = "";
      el.style.translate = "";
      if (released) return clear();
    } else {
      phase += 2 * Math.PI * WOBBLE_HZ * (dt / 1000);
      const tilt = amp * Math.sin(phase);
      el.style.rotate = `${tilt.toFixed(3)}deg`;
      el.style.translate = `${(tilt * WOBBLE_SHIFT).toFixed(2)}px 0`;
    }
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);

  const api: Wobble = {
    push(distance) {
      const now = performance.now();
      const dt = Math.max(8, now - lastEvent);
      lastEvent = now;
      speed = Math.max(speed, 0.5 * speed + 0.5 * (distance / dt));
    },
    release() {
      released = true; // the frame loop stops itself once the rocking has died away
    },
    stop() {
      cancelAnimationFrame(raf);
      clear();
    },
  };
  wobbles.set(el, api);
  return api;
}

/** Rubber-band: follows the pointer at first, then flattens out at MAX_PULL of a row. */
function resist(d: number, slot: number) {
  const max = slot * MAX_PULL;
  return Math.sign(d) * max * Math.tanh(Math.abs(d) / (max * 1.6));
}

const rowEl = (body: HTMLElement, id: string) => body.querySelector<HTMLTableRowElement>(`tr[data-row="${id}"]`);

const focusHandle = (rowId: string) =>
  requestAnimationFrame(() => document.querySelector<HTMLElement>(`tr[data-row="${rowId}"] .drag-handle`)?.focus());

export function CombatTable({ encounter, dispatch }: { encounter: Encounter; dispatch: (a: Action) => void }) {
  const bodyRef = useRef<HTMLTableSectionElement>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const grabY = useRef(0);
  const rowsRef = useRef(encounter.rows);
  rowsRef.current = encounter.rows;

  useEffect(() => {
    const body = bodyRef.current;
    const dragged = dragId && body ? rowEl(body, dragId) : null;
    if (!dragId || !body || !dragged) return;

    const still = reducedMotion();
    const rise = still ? 0 : RISE;
    let anchor = grabY.current; // pointer Y at which the row would sit exactly in its current slot
    let snapUntil = 0; // while a snap animation runs, pointer moves ease into it instead of cutting it
    let leaning: HTMLTableRowElement | null = null;

    dragged.dataset.lift = "";
    const wobble = still ? null : startWobble(dragged);
    let last: { x: number; y: number } | null = null;
    setTransform(dragged, `translateY(${rise}px)`, still ? "none" : `transform 180ms ${SPRING}`);
    snapUntil = performance.now() + 180;

    // How hard the magnet is being pulled against (0..1). Drives the jiggle strength in CSS.
    const strain = (el: HTMLElement, t: number) => el.style.setProperty("--tension", t.toFixed(3));

    const unlean = () => {
      if (leaning) {
        setTransform(leaning, "translateY(0px)", still ? "none" : `transform 220ms ${SPRING}`);
        delete leaning.dataset.tremble;
        leaning.style.removeProperty("--tension");
      }
      leaning = null;
    };

    const onMove = (e: PointerEvent) => {
      if (last) wobble?.push(Math.hypot(e.clientX - last.x, e.clientY - last.y));
      last = { x: e.clientX, y: e.clientY };
      let d = e.clientY - anchor;

      // Pulled past the magnet's hold: swap with the neighbour (repeat if the pointer jumped several rows).
      for (;;) {
        const dir = d > 0 ? 1 : -1;
        const n = (dir > 0 ? dragged.nextElementSibling : dragged.previousElementSibling) as HTMLTableRowElement | null;
        if (!n) break;
        const slot = Math.abs(n.offsetTop - dragged.offsetTop);
        if (Math.abs(d) < slot * SNAP_AT) break;

        const visualBefore = resist(d, slot);
        const draggedTop = dragged.offsetTop;
        const nTop = n.offsetTop;
        const nLean = leaning === n ? dir * NEIGHBOUR_PUSH : 0;
        const index = rowsRef.current.findIndex((r) => r.id === dragId);
        flushSync(() => dispatch({ type: "moveRow", rowId: dragId, toIndex: index + dir }));
        const moved = dragged.offsetTop - draggedTop;
        anchor += moved;
        d = e.clientY - anchor;
        leaning = null;
        delete n.dataset.tremble;
        n.style.removeProperty("--tension");

        if (!still) {
          // Dragged row: keep it visually where it was, then let it snap into its new slot.
          setTransform(dragged, `translateY(${visualBefore - moved + rise}px)`);
          // Neighbour: starts where it was and springs into the gap the dragged row left.
          setTransform(n, `translateY(${nTop - n.offsetTop + nLean}px)`);
          void n.offsetWidth; // commit the start positions before animating
          setTransform(n, "translateY(0px)", `transform 300ms ${SPRING}`);
          settle(n);
          snapUntil = performance.now() + 240;
        }
      }

      const dir = d > 0 ? 1 : -1;
      const n = (dir > 0 ? dragged.nextElementSibling : dragged.previousElementSibling) as HTMLTableRowElement | null;
      const slot = n ? Math.abs(n.offsetTop - dragged.offsetTop) : dragged.offsetHeight + 4;

      const left = snapUntil - performance.now();
      setTransform(dragged, `translateY(${resist(d, slot) + rise}px)`, left > 0 ? `transform ${Math.round(left)}ms ${SPRING}` : "none");

      // The neighbour being approached leans away, more the closer the row gets to snapping.
      if (still) return;
      const p = Math.min(1, Math.abs(d) / (slot * SNAP_AT)) ** 2;
      if (leaning && leaning !== n) unlean();
      if (n) {
        leaning = n;
        setTransform(n, `translateY(${dir * NEIGHBOUR_PUSH * p}px)`);
        // ...and trembles, more the closer the dragged row gets to forcing its way past.
        n.dataset.tremble = "";
        strain(n, p);
      }
    };

    const onEnd = () => {
      unlean();
      delete dragged.dataset.lift;
      wobble?.release(); // any rocking left over dies away as it lands
      // Set the row back down into its slot.
      setTransform(dragged, "translateY(0px)", still ? "none" : `transform 280ms ${SPRING}`);
      setDragId(null);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onEnd);
    window.addEventListener("pointercancel", onEnd);
    document.body.classList.add("row-dragging");
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onEnd);
      window.removeEventListener("pointercancel", onEnd);
      document.body.classList.remove("row-dragging");
    };
  }, [dragId, dispatch]);

  const onHandlePointerDown = useCallback((rowId: string, e: ReactPointerEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    grabY.current = e.clientY;
    setDragId(rowId);
  }, []);

  const onHandleKeyDown = useCallback(
    (rowId: string, e: ReactKeyboardEvent) => {
      if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
      e.preventDefault();
      const body = bodyRef.current;
      const i = rowsRef.current.findIndex((r) => r.id === rowId);
      const j = e.key === "ArrowUp" ? i - 1 : i + 1;
      const other = rowsRef.current[j];
      if (!body || !other) return;
      // Same swap animation as dragging, without the lift.
      const els = [rowEl(body, rowId), rowEl(body, other.id)].filter((x): x is HTMLTableRowElement => !!x);
      const before = els.map((el) => el.offsetTop);
      flushSync(() => dispatch({ type: "moveRow", rowId, toIndex: j }));
      if (!reducedMotion()) {
        els.forEach((el, k) => setTransform(el, `translateY(${before[k] - el.offsetTop}px)`));
        void body.offsetWidth;
        els.forEach((el) => {
          setTransform(el, "translateY(0px)", `transform 260ms ${SPRING}`);
          settle(el);
        });
      }
      focusHandle(rowId);
    },
    [dispatch],
  );

  return (
    <div className="table-wrap">
      <table aria-label="Initiative order">
        <thead>
          <tr>
            <th className="col-drag"><span className="sr-only">Reorder</span></th>
            <th className="col-init">Init</th>
            <th>Name</th>
            <th>Conditions</th>
            <th className="col-num">AC</th>
            <th className="col-num">HP</th>
            <th className="col-x"><span className="sr-only">Remove</span></th>
          </tr>
        </thead>
        <tbody ref={bodyRef}>
          {encounter.rows.map((r) => (
            <CombatRow
              key={r.id}
              row={r}
              active={r.id === encounter.activeId}
              dragging={r.id === dragId}
              dispatch={dispatch}
              onHandlePointerDown={onHandlePointerDown}
              onHandleKeyDown={onHandleKeyDown}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
