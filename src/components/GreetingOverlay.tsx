import { useEffect, useState } from "react";

type Props = {
  title?: string;
  subtitle?: string;
  durationMs?: number;
  onDone?: () => void;
};

export function GreetingOverlay({
  title = "Merry Christmas to syy✨",
  subtitle = "Wishing you a dreamy night  from yzy",
  durationMs = 2200,
  onDone,
}: Props) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setShow(false);
      onDone?.();
    }, durationMs);
    return () => window.clearTimeout(t);
  }, [durationMs, onDone]);

  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "grid",
        placeItems: "center",
        pointerEvents: "none",
        zIndex: 1000,
        color: "white",
        fontFamily: "system-ui",
        background:
          "radial-gradient(ellipse at center, rgba(255,255,255,0.06), rgba(0,0,0,0.55))",
        backdropFilter: "blur(6px)",
      }}
    >
      <div style={{ textAlign: "center", padding: 24 }}>
        <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: 1 }}>
          {title}
        </div>
        <div style={{ marginTop: 10, fontSize: 16, opacity: 0.85 }}>
          {subtitle}
        </div>
      </div>
    </div>
  );
}
