import { LEAVE_STATUS } from "../../constants/leaveTypes";

export default function StatusBadge({ status }) {
  const config = LEAVE_STATUS[status] || {
    label: status,
    color: "#64748b",
    bg: "#f1f5f9",
  };

  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        fontFamily: "'DM Sans', sans-serif",
        color: config.color,
        background: config.bg,
        border: `1px solid ${config.color}33`,
        whiteSpace: "nowrap",
      }}
    >
      {config.label}
    </span>
  );
}
