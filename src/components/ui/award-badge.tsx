import { type MouseEvent, useEffect, useRef, useState } from "react";

const identityMatrix = "1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1";
const maxRotate = 0.25;
const minRotate = -0.25;
const maxScale = 1;
const minScale = 0.97;

const overlayFills = [
  "hsl(358, 100%, 62%)",
  "hsl(30, 100%, 50%)",
  "hsl(60, 100%, 50%)",
  "hsl(96, 100%, 50%)",
  "hsl(233, 85%, 47%)",
  "hsl(271, 85%, 47%)",
  "hsl(300, 20%, 35%)",
  "transparent",
  "transparent",
  "white",
];

const overlayKeyframes = overlayFills
  .map(
    (_, e) => `@keyframes overlayAnimation${e + 1}{0%{transform:rotate(${e * 10}deg)}50%{transform:rotate(${(e + 1) * 10}deg)}100%{transform:rotate(${e * 10}deg)}}`,
  )
  .join(" ");

interface AwardBadgeProps {
  eyebrow: string;
  title: string;
}

/** Interactive holographic badge (adapted from the supplied reference, logo area left empty). */
export function AwardBadge({ eyebrow, title }: AwardBadgeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [firstOverlayPosition, setFirstOverlayPosition] = useState(0);
  const [matrix, setMatrix] = useState(identityMatrix);
  const [currentMatrix, setCurrentMatrix] = useState(identityMatrix);
  const [disableInOut, setDisableInOut] = useState(true);
  const [disableOverlay, setDisableOverlay] = useState(false);
  const [timeoutDone, setTimeoutDone] = useState(false);
  const enterT = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveT = useRef<(ReturnType<typeof setTimeout> | null)[]>([null, null, null]);

  const dims = () => {
    const r = ref.current?.getBoundingClientRect();
    return { left: r?.left ?? 0, right: r?.right ?? 0, top: r?.top ?? 0, bottom: r?.bottom ?? 0 };
  };

  const getMatrix = (cx: number, cy: number) => {
    const { left, right, top, bottom } = dims();
    const xc = (left + right) / 2;
    const yc = (top + bottom) / 2;
    const s = [
      maxScale - ((maxScale - minScale) * Math.abs(xc - cx)) / (xc - left),
      maxScale - ((maxScale - minScale) * Math.abs(yc - cy)) / (yc - top),
      maxScale - ((maxScale - minScale) * (Math.abs(xc - cx) + Math.abs(yc - cy))) / (xc - left + yc - top),
    ];
    const x1 = 0.25 * ((yc - cy) / yc - (xc - cx) / xc);
    const x2 = maxRotate - ((maxRotate - minRotate) * Math.abs(right - cx)) / (right - left);
    const y2 = maxRotate - ((maxRotate - minRotate) * (top - cy)) / (top - bottom);
    const z0 = -(maxRotate - ((maxRotate - minRotate) * Math.abs(right - cx)) / (right - left));
    const z1 = 0.2 - ((0.2 + 0.6) * (top - cy)) / (top - bottom);
    return `${s[0]}, 0, ${z0}, 0, ${x1}, ${s[1]}, ${z1}, 0, ${x2}, ${y2}, ${s[2]}, 0, 0, 0, 0, 1`;
  };

  const getOpposite = (m: string, cy: number, enter?: boolean) => {
    const { top, bottom } = dims();
    const oy = bottom - cy + top;
    const w = enter ? 0.7 : 4;
    const mul = enter ? -1 : 1;
    return m
      .split(", ")
      .map((item, i) => {
        if (i === 2 || i === 4 || i === 8) return (-parseFloat(item) * mul) / w;
        if (i === 0 || i === 5 || i === 10) return "1";
        if (i === 6) return (mul * (maxRotate - ((maxRotate - minRotate) * (top - oy)) / (top - bottom))) / w;
        if (i === 9) return (maxRotate - ((maxRotate - minRotate) * (top - oy)) / (top - bottom)) / w;
        return item;
      })
      .join(", ");
  };

  const overlayPos = (e: MouseEvent) => {
    const { left, right, top, bottom } = dims();
    return (Math.abs((left + right) / 2 - e.clientX) + Math.abs((top + bottom) / 2 - e.clientY)) / 1.5;
  };

  const onEnter = (e: MouseEvent<HTMLDivElement>) => {
    leaveT.current.forEach((t) => t && clearTimeout(t));
    setDisableOverlay(true);
    setDisableInOut(false);
    enterT.current = setTimeout(() => setDisableInOut(true), 350);
    const pos = overlayPos(e);
    requestAnimationFrame(() => requestAnimationFrame(() => setFirstOverlayPosition(pos)));
    setMatrix(getOpposite(getMatrix(e.clientX, e.clientY), e.clientY, true));
    setTimeoutDone(false);
    setTimeout(() => setTimeoutDone(true), 200);
  };

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const pos = overlayPos(e);
    setTimeout(() => setFirstOverlayPosition(pos), 150);
    if (timeoutDone) setCurrentMatrix(getMatrix(e.clientX, e.clientY));
  };

  const onLeave = (e: MouseEvent<HTMLDivElement>) => {
    const opp = getOpposite(matrix, e.clientY);
    if (enterT.current) clearTimeout(enterT.current);
    setCurrentMatrix(opp);
    setTimeout(() => setCurrentMatrix(identityMatrix), 200);
    const last = firstOverlayPosition;
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        setDisableInOut(false);
        leaveT.current[0] = setTimeout(() => setFirstOverlayPosition(-last / 4), 150);
        leaveT.current[1] = setTimeout(() => setFirstOverlayPosition(0), 300);
        leaveT.current[2] = setTimeout(() => {
          setDisableOverlay(false);
          setDisableInOut(true);
        }, 500);
      }),
    );
  };

  useEffect(() => {
    if (timeoutDone) setMatrix(currentMatrix);
  }, [currentMatrix, timeoutDone]);

  return (
    <div
      ref={ref}
      role="img"
      aria-label={`${eyebrow} — ${title}`}
      className="award-badge block h-auto w-[200px] cursor-pointer sm:w-[230px]"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onMouseEnter={onEnter}
    >
      <style>{overlayKeyframes}{`@media (prefers-reduced-motion: reduce){.award-badge g{animation:none!important}}`}</style>
      <div
        style={{
          transform: `perspective(700px) matrix3d(${matrix})`,
          transformOrigin: "center center",
          transition: "transform 200ms ease-out",
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 54" className="h-auto w-full">
          <defs>
            <filter id="awardBlur">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
            </filter>
            <mask id="awardMask">
              <rect width="260" height="54" fill="white" rx="10" />
            </mask>
          </defs>
          <rect width="260" height="54" rx="10" fill="#ddd" />
          <rect x="4" y="4" width="252" height="46" rx="8" fill="transparent" stroke="#bbb" strokeWidth="1" />
          <text fontFamily="Helvetica-Bold, Helvetica, Arial" fontSize="9" fontWeight="bold" fill="#666" x="130" y="20" textAnchor="middle" letterSpacing="1.5">
            {eyebrow}
          </text>
          <text fontFamily="Helvetica-Bold, Helvetica, Arial" fontSize="16" fontWeight="bold" fill="#666" x="130" y="40" textAnchor="middle">
            {title}
          </text>
          <g style={{ mixBlendMode: "overlay" }} mask="url(#awardMask)">
            {overlayFills.map((fill, i) => (
              <g
                key={i}
                style={{
                  transform: `rotate(${firstOverlayPosition + i * 10}deg)`,
                  transformOrigin: "center center",
                  transition: !disableInOut ? "transform 200ms ease-out" : "none",
                  animation: disableOverlay ? "none" : `overlayAnimation${i + 1} 5s infinite`,
                  willChange: "transform",
                }}
              >
                <polygon points="0,0 260,54 260,0 0,54" fill={fill} filter="url(#awardBlur)" opacity="0.5" />
              </g>
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
}
