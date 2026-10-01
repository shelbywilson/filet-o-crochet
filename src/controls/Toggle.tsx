interface IToggle {
  value: boolean;
  onChange: (val: boolean) => void;
  labelOff: string;
  labelOn: string;
}

export function Toggle({ value, onChange, labelOff, labelOn }: IToggle) {
  return (
    <div
      onClick={() => onChange(!value)}
      style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer", padding: '0.5rem' }}
    >
      <span style={{ opacity: value ? 0.4 : 1, transition: "opacity 0.2s" }}>{labelOff}</span>
      <span style={{
        display: "inline-block",
        width: "2.2rem",
        height: "1.1rem",
        borderRadius: "1rem",
        background: value ? "orangered" : "#555",
        position: "relative",
        transition: "background 0.2s",
        flexShrink: 0,
      }}>
        <span style={{
          position: "absolute",
          top: "0.1rem",
          left: value ? "1.1rem" : "0.1rem",
          width: "0.9rem",
          height: "0.9rem",
          borderRadius: "50%",
          background: "#fff",
          transition: "left 0.2s",
        }} />
      </span>
      <span style={{ opacity: value ? 1 : 0.4, transition: "opacity 0.2s" }}>{labelOn}</span>
    </div>
  );
}
