
export default function GlowOrb({ top, left, color, size }) {
  return (
    <div
      className="absolute rounded-full pointer-events-none"
      style={{
        top,
        left,
        width: size,
        height: size,
        background: color,
        filter: "blur(80px)",
        opacity: 0.18,
        zIndex: 0,
      }}
    />
  );
}