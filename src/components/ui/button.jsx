export function Button({ children, onClick, disabled, variant = "default", className = "" }) {
  const base = "px-4 py-2.5 rounded-lg font-semibold text-sm transition-all select-none";
  const variants = {
    default: "bg-gold text-felt hover:bg-gold-light active:scale-95",
    outline: "border border-rim text-gold hover:border-gold active:scale-95",
    destructive: "bg-red-800 text-white hover:bg-red-700 active:scale-95",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant] ?? variants.default} ${disabled ? "opacity-40 cursor-not-allowed active:scale-100" : "cursor-pointer"} ${className}`}
    >
      {children}
    </button>
  );
}
