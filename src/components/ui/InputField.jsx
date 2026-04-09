export default function InputField({
  label,
  value,
  onChange,
  placeholder = "",
  type = "text",
  required = false,
  readOnly = false,
  disabled = false,
  error = "",
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "#475569",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {label}
        {required && <span style={{ color: "#e11d48", marginLeft: 2 }}>*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly}
        disabled={disabled}
        style={{
          padding: "10px 14px",
          borderRadius: 8,
          border: `1.5px solid ${error ? "#fca5a5" : "#e2e8f0"}`,
          fontSize: 14,
          fontFamily: "'DM Sans', sans-serif",
          color: "#1e293b",
          background: readOnly || disabled ? "#f8fafc" : "#fff",
          outline: "none",
          transition: "border-color 0.2s",
          cursor: readOnly || disabled ? "not-allowed" : "text",
          width: "100%",
          opacity: disabled ? 0.45 : 1,
        }}
        onFocus={(e) => {
          if (!readOnly && !disabled) e.target.style.borderColor = "#c0392b";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error ? "#fca5a5" : "#e2e8f0";
        }}
      />
      {error && (
        <span
          style={{
            fontSize: 11,
            color: "#e11d48",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {error}
        </span>
      )}
    </div>
  );
}
