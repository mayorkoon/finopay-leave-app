export default function CheckboxField({ label, checked, onChange }) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        cursor: "pointer",
        padding: "10px 14px",
        borderRadius: 8,
        border: `1.5px solid ${checked ? "#c0392b" : "#e2e8f0"}`,
        background: checked ? "#fff1f2" : "#fff",
        transition: "all 0.2s",
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 14,
        color: "#1e293b",
        fontWeight: checked ? 600 : 400,
        userSelect: "none",
      }}
    >
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: 4,
          border: `2px solid ${checked ? "#c0392b" : "#cbd5e1"}`,
          background: checked ? "#c0392b" : "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "all 0.2s",
        }}
      >
        {checked && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path
              d="M1 4L3.5 6.5L9 1"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      {label}
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        style={{ display: "none" }}
      />
    </label>
  );
}
