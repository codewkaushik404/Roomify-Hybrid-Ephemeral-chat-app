
export default function Avatar({ name, size = 8 }) {
  const colors = ["#E63946", "#F4A261", "#2A9D8F", "#457B9D", "#9B5DE5", "#F72585"];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div
      className={`w-${size} h-${size} rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0`}
      style={{ background: color, width: `${size * 4}px`, height: `${size * 4}px`, fontSize: "11px" }}
    >
      {name[0].toUpperCase()}
    </div>
  );
}
