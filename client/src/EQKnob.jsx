import {
  CircularInput,
  CircularTrack,
  CircularProgress,
} from "react-circular-input";

const clamp01 = (n) => Math.min(1, Math.max(0, n));

/**
 * value: 0〜1（CircularInput用）
 * 表示値: min〜max（例: -15〜+15）
 * 0（中心値）が12時（真上）になるように、針だけ回転で表現する
 */
export default function EQKnob({
  value,          // 0..1
  onChange,       // (0..1) => void
  size = 84,
  label = "",     // "LOW" / "HIGH"
  unitLeft = "-15",
  unitRight = "+15",
  centerText = "0",
}) {
  const t = clamp01(value);

  // 角度: -150°〜+150°（お好みで調整OK）
  const start = -150;
  const end = 150;
  const angle = start + (end - start) * t;

  return (
    <div style={{ width: size, height: size, position: "relative" }}>
      {/* 左上ラベル（LOW/HIGH） */}
      {label && (
        <div
          style={{
            position: "absolute",
            left: -6,
            top: -10,
            fontSize: 10,
            letterSpacing: 1,
            color: "rgba(255,255,255,0.75)",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            textTransform: "uppercase",
            pointerEvents: "none",
          }}
        >
          {label}
        </div>
      )}

      {/* 周囲の目盛り（ざっくりそれっぽく） */}
      <svg
        viewBox="0 0 100 100"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          filter: "drop-shadow(0 0 3px rgba(0,0,0,0.6))",
        }}
      >
        {/* ticks: 0(12時)を中心に左右 */}
        {Array.from({ length: 20 }).map((_, i) => {
          const a = (-150 + (300 * i) / 20) * (Math.PI / 180);
          const r1 = 46;
          const r2 = i % 3 === 0 ? 36 : 40;
          const x1 = 50 + r1 * Math.cos(a);
          const y1 = 50 + r1 * Math.sin(a);
          const x2 = 50 + r2 * Math.cos(a);
          const y2 = 50 + r2 * Math.sin(a);

          // 真上（0）を強調
          const isTop = i === 6;

          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={isTop ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.28)"}
              strokeWidth={isTop ? 2.2 : i % 3 === 0 ? 1.6 : 1}
              strokeLinecap="round"
            />
          );
        })}
      </svg>

      {/* 本体 */}
      <CircularInput value={t} onChange={onChange}>
        {/* 外周リング */}
        <CircularTrack stroke="#2b2f33" strokeWidth={10} />
        {/* “ヤマハ風の緑”リング（必要なら消してOK） */}
        <circle cx="50" cy="50" r="38" fill="none" stroke="#1f2937" strokeWidth="10" />
        {/* 中央の緑キャップ */}
        <circle cx="50" cy="50" r="18" fill="#22c55e" opacity="0.95" />
        <circle cx="50" cy="50" r="13" fill="#0b0f12" opacity="0.85" />

        {/* 針（白い線） */}
        <g
          style={{
            transform: `rotate(${angle}deg)`,
            transformOrigin: "50px 50px",
          }}
        >
          <line
            x1="50"
            y1="50"
            x2="50"
            y2="26"
            stroke="#ffffff"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>
      </CircularInput>

      {/* 下の数値（-15 / 0 / +15） */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: -18,
          display: "flex",
          justifyContent: "space-between",
          fontSize: 10,
          color: "rgba(255,255,255,0.6)",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          pointerEvents: "none",
        }}
      >
        <span>{unitLeft}</span>
        <span>{centerText}</span>
        <span>{unitRight}</span>
      </div>
    </div>
  );
}