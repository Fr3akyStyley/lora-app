export function Input({ value, onChange, placeholder = "", className = "" }) {
  return (
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`bg-surface border border-rim text-white placeholder:text-muted px-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold text-base w-full ${className}`}
    />
  );
}
