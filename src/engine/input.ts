import type { GameInputState } from "../lib/types";

export function createInputState(): GameInputState {
  return {
    moveX: 0,
    moveY: 0,
    lookDx: 0,
    lookDy: 0,
    pressInteract: false,
    pressRelease: false,
  };
}

/**
 * Wires the right half of the screen as a drag-to-look surface. Joystick &
 * action buttons set GameInputState directly via React refs.
 */
export function attachLookSurface(
  el: HTMLElement,
  state: GameInputState,
  excludeSelector: string,
): () => void {
  let activeId: number | null = null;
  let lastX = 0;
  let lastY = 0;

  const isExcluded = (target: EventTarget | null): boolean => {
    if (!(target instanceof Element)) return false;
    return Boolean(target.closest(excludeSelector));
  };

  const onPointerDown = (e: PointerEvent) => {
    if (activeId !== null) return;
    if (isExcluded(e.target)) return;
    // Right half of screen only; joystick will be on the left
    if (e.clientX < window.innerWidth * 0.4) return;
    activeId = e.pointerId;
    lastX = e.clientX;
    lastY = e.clientY;
    el.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent) => {
    if (e.pointerId !== activeId) return;
    state.lookDx += e.clientX - lastX;
    state.lookDy += e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
  };

  const release = (e: PointerEvent) => {
    if (e.pointerId !== activeId) return;
    activeId = null;
    try {
      el.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  el.addEventListener("pointerdown", onPointerDown);
  el.addEventListener("pointermove", onPointerMove);
  el.addEventListener("pointerup", release);
  el.addEventListener("pointercancel", release);

  return () => {
    el.removeEventListener("pointerdown", onPointerDown);
    el.removeEventListener("pointermove", onPointerMove);
    el.removeEventListener("pointerup", release);
    el.removeEventListener("pointercancel", release);
  };
}
