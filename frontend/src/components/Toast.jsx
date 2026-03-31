import { useState, useEffect } from "react";

let addToastFn;

export function ToastContainer() {
  const [toast, setToast] = useState(null);

  useEffect(() => {
    addToastFn = ({ message, type = "error" }) => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 4000);
    };

    return () => { addToastFn = undefined };
  }, []);

  const colors = {
    error:   { border: "border-red-700",    label: "ERROR", text: "text-red-500", bg: "bg-red-900/20"},
    warn:    { border: "border-yellow-500", label: "WARN",  text: "text-yellow-400", bg: "bg-yellow-900/20" },
    success: { border: "border-green-600",  label: "OK",    text: "text-green-500", bg:"bg-green-800/20"},
    info:    { border: "border-blue-500",   label: "INFO",  text: "text-blue-400", bg: "bg-blue-800/20" },
  };

  if (!toast) return null;

  const { message, type} = toast;
  const { border, label, text, bg } = colors[type] || colors.error;

  return (
    <div className="fixed top-5 left-1/2 z-50 flex flex-col gap-2 transform -translate-x-1/2">
      <div
        className={`${bg} ${border} rounded-3xl px-3 py-2 flex items-center gap-2 min-w-[260px] max-w-[360px]`}
      >
        <span className={`text-sm font-medium tracking-widest ${text}`}>
          {label}
        </span>
        <span className="text-gray-300 text-sm">{message || "Not working" }</span>
      </div>
    </div>
  );
}

export default function Toast(message, type) {
  addToastFn?.({ message, type });
}