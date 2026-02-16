import React, { useMemo, useRef, useState } from "react";

type EQKnobProps = {
  /** dBなどの実値（例: -15〜+15） */
  value: number;
  /** 最小値（例: -15） */
  min: number;
  /** 最大値（例: +15） */
  max: number;
  /** サイズ(px) */
  size?: number;
  /** 値が変わったら呼ぶ（実値で返す） */
  onChange: (next: number) => void;
  /** 1ドラッグで動く感度（大きいほどゆっくり） */
  dragScale?: number; // default 180
};

const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function polarToCartesian(cx: number, cy: number, r: number, angleDegFromTop: number) {
  // angleDegFromTop: 0°=12時, +は時計回り
  const rad = ((angleDegFromTop - 90) * Math.PI) / 180; // SVGは0°=3時なので-90補正
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const start = polarToCartesian(cx, cy, r, startDeg);
  const end = polarToCartesian(cx, cy, r, endDeg);

  const sweep = endDeg - startDeg;
  const largeArcFlag = Math.abs(sweep) > 180 ? 1 : 0;
  const sweepFlag = sweep >= 0 ? 1 : 0; // 時計回り

  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} ${sweepFlag} ${end.x} ${end.y}`;
}

export default function EQKnob({
  value,
  min,
  max,
  size = 78,
  onChange,
  dragScale = 180,
}: EQKnobProps) {
  // 7時→5時、12時が0°
  const MIN_ANGLE = -150; // 7時
  const MAX_ANGLE = 150;  // 5時

  const t = (value - min) / (max - min);
  const tt = clamp(t, 0, 1);
  const angle = lerp(MIN_ANGLE, MAX_ANGLE, tt);

  // 枠外に出ないように「内側に収まる」半径を計算
  const stroke = Math.max(6, Math.floor(size * 0.12));  // 太めにしてヤマハ感
  const pad = 4;                                        // さらに内側へ
  const r = size / 2 - stroke / 2 - pad;                // これが超重要

  const svg = useMemo(() => {
    const cx = size / 2;
    const cy = size / 2;

    const trackPath = describeArc(cx, cy, r, MIN_ANGLE, MAX_ANGLE);
    const progPath = describeArc(cx, cy, r, MIN_ANGLE, angle);

    // ポインタ（つまみの白線）
    const p1 = polarToCartesian(cx, cy, r - stroke * 0.2, angle);
    const p2 = polarToCartesian(cx, cy, r - stroke * 0.8, angle);

    return { cx, cy, trackPath, progPath, p1, p2 };
  }, [size, r, stroke, angle]);

  // ドラッグで回す（上下ドラッグ）
  const ref = useRef<HTMLDivElement | null>(null);
  const [drag, setDrag] = useState<null | { y: number; v: number }>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    ref.current?.setPointerCapture(e.pointerId);
    setDrag({ y: e.clientY, v: value });
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag) return;
    const dy = drag.y - e.clientY; // 上にドラッグで増える
    const deltaT = dy / dragScale;
    const next = drag.v + deltaT * (max - min);
    onChange(clamp(next, min, max));
  };

  const onPointerUp = (e: React.PointerEvent) => {
    try {
      ref.current?.releasePointerCapture(e.pointerId);
    } catch {}
    setDrag(null);
  };

  return (
    <div
      ref={ref}
      className="relative select-none touch-none"
      style={{ width: size, height: size }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* ノブのベース */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.08), rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.75))",
          boxShadow: "inset 0 2px 10px rgba(0,0,0,0.55), 0 2px 10px rgba(0,0,0,0.35)",
        }}
      />

      {/* 目盛り & メーター（SVG） */}
      <svg className="absolute inset-0" viewBox={`0 0 ${size} ${size}`}>
        {/* トラック */}
        <path
          d={svg.trackPath}
          fill="none"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        {/* 進捗（緑） */}
        <path
          d={svg.progPath}
          fill="none"
          stroke="#22c55e" // green-500
          strokeWidth={stroke}
          strokeLinecap="round"
        />

        {/* つまみの白線（ポインタ） */}
        <line
          x1={svg.p2.x}
          y1={svg.p2.y}
          x2={svg.p1.x}
          y2={svg.p1.y}
          stroke="rgba(255,255,255,0.9)"
          strokeWidth={Math.max(2, Math.floor(stroke * 0.25))}
          strokeLinecap="round"
        />
      </svg>

      {/* 中心キャップ */}
      <div
        className="absolute rounded-full"
        style={{
          width: size * 0.22,
          height: size * 0.22,
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.18), rgba(0,0,0,0.75))",
          boxShadow: "inset 0 1px 6px rgba(0,0,0,0.6)",
        }}
      />
    </div>
  );
}