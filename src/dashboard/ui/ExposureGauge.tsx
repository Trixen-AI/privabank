/**
 * Half-ring gauge for the exposure score. A higher score means more of the
 * account is readable by strangers, so the ring runs jade (low) to red (severe).
 */
const TONE: Record<string, string> = {
  Low: "var(--jade-500)",
  Moderate: "#c9a20a",
  High: "var(--warning)",
  Severe: "var(--danger)",
};

export function ExposureGauge({ score, level, size = 180 }: { score: number; level: string; size?: number }) {
  const r = 42;
  const len = Math.PI * r; // half circumference
  const filled = (Math.max(0, Math.min(100, score)) / 100) * len;
  return (
    <div className="gauge" style={{ width: size }}>
      <svg viewBox="0 0 100 58" role="img" aria-label={`Exposure score ${score} of 100, ${level}`}>
        <path d="M8 50a42 42 0 0 1 84 0" fill="none" stroke="var(--border)" strokeWidth="8" strokeLinecap="round" />
        <path
          d="M8 50a42 42 0 0 1 84 0"
          fill="none"
          stroke={TONE[level] ?? "var(--accent)"}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${len}`}
        />
      </svg>
      <div className="gauge-read">
        <strong>{score}</strong>
        <span style={{ color: TONE[level] }}>{level}</span>
      </div>
    </div>
  );
}
