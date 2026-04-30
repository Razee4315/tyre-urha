import { useEffect, useRef } from "react";
import type { GameInputState } from "../lib/types";

type JoystickProps = {
  input: GameInputState;
};

export function Joystick({ input }: JoystickProps) {
  const baseRef = useRef<HTMLDivElement | null>(null);
  const stickRef = useRef<HTMLDivElement | null>(null);
  const activeId = useRef<number | null>(null);
  const center = useRef({ x: 0, y: 0 });
  const maxRadius = useRef(48);

  useEffect(() => {
    const base = baseRef.current;
    const stick = stickRef.current;
    if (!base || !stick) return;

    const measure = () => {
      const rect = base.getBoundingClientRect();
      center.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      maxRadius.current = rect.width / 2 - 14;
    };
    measure();

    const reset = () => {
      stick.style.transform = "translate(0, 0)";
      input.moveX = 0;
      input.moveY = 0;
    };

    const apply = (clientX: number, clientY: number) => {
      const dx = clientX - center.current.x;
      const dy = clientY - center.current.y;
      const len = Math.hypot(dx, dy);
      const r = maxRadius.current;
      const k = len > r ? r / len : 1;
      const nx = dx * k;
      const ny = dy * k;
      stick.style.transform = `translate(${nx}px, ${ny}px)`;
      input.moveX = nx / r;
      input.moveY = ny / r;
    };

    const onPointerDown = (e: PointerEvent) => {
      if (activeId.current !== null) return;
      activeId.current = e.pointerId;
      base.setPointerCapture(e.pointerId);
      measure();
      apply(e.clientX, e.clientY);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerId !== activeId.current) return;
      apply(e.clientX, e.clientY);
    };
    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerId !== activeId.current) return;
      activeId.current = null;
      try {
        base.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      reset();
    };

    base.addEventListener("pointerdown", onPointerDown);
    base.addEventListener("pointermove", onPointerMove);
    base.addEventListener("pointerup", onPointerUp);
    base.addEventListener("pointercancel", onPointerUp);
    window.addEventListener("resize", measure);

    return () => {
      base.removeEventListener("pointerdown", onPointerDown);
      base.removeEventListener("pointermove", onPointerMove);
      base.removeEventListener("pointerup", onPointerUp);
      base.removeEventListener("pointercancel", onPointerUp);
      window.removeEventListener("resize", measure);
    };
  }, [input]);

  return (
    <div className="joystick" ref={baseRef} aria-label="Movement joystick">
      <div className="joystick-stick" ref={stickRef} />
    </div>
  );
}
