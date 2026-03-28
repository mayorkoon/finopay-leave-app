export default function SectionHeader({ title }) {
  return (
    <div
      style={{
        background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
        color: "#fff",
        padding: "10px 20px",
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        fontFamily: "'DM Sans', sans-serif",
        marginBottom: 20,
      }}
    >
      {title}
    </div>
  );
}
