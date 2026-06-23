import Fireworks from "react-canvas-confetti/dist/presets/fireworks";

export const Confetti: React.FC<{ fire: boolean }> = ({ fire }) => {
  if (!fire) return null;

  return (
    <Fireworks
      autorun={{ speed: 2, duration: 1 }}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 100,
      }}
    />
  );
};
