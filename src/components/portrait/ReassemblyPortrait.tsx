"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PORTRAIT_PIECE_COUNT, PORTRAIT_SOURCE, PORTRAIT_VIEWBOX } from "./portrait.generated";

const EASING = "cubic-bezier(.2,.8,.25,1)";
const ASSEMBLY_DURATION = 1_480;
const REVEAL_DURATION = 260;
const IDENTITY_TRANSFORM = "translate(0, 0) rotate(0deg) scale(1)";
const PIECE_SESSION_KEY = "hadiran-portrait-reassembly-v4";
const PIECE_INDEXES = Array.from({ length: PORTRAIT_PIECE_COUNT }, (_, index) => index);

function portraitPieceId(index: number) {
  return `portrait-piece-${String(index).padStart(4, "0")}`;
}

function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4_294_967_296;
  };
}

interface Scatter {
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

function createScatter(index: number, compact: boolean): Scatter {
  const random = seededRandom(0x9e3779b9 + index * 0x45d9f3b);
  const distance = compact ? 0.62 : 1;
  return {
    x: (random() - 0.5) * 190 * distance,
    y: (random() - 0.5) * 145 * distance,
    rotation: (random() - 0.5) * 360 * distance,
    scale: 0.52 + random() * (compact ? 0.48 : 0.68),
  };
}

const DESKTOP_SCATTERS = PIECE_INDEXES.map((_, index) => createScatter(index, false));

function transformFor(scatter: Scatter) {
  return `translate(${scatter.x}vw, ${scatter.y}vh) rotate(${scatter.rotation}deg) scale(${scatter.scale})`;
}

function readSessionFlag() {
  try {
    return window.sessionStorage.getItem(PIECE_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

function writeSessionFlag() {
  try {
    window.sessionStorage.setItem(PIECE_SESSION_KEY, "1");
  } catch {
    // اگر storage توسط مرورگر بسته باشد، افکت فقط در همین mount اجرا می‌شود.
  }
}

type Phase = "assembling" | "complete" | "static" | "scattered";
type PieceDirection = "assemble" | "scatter";

export function ReassemblyPortrait() {
  const [phase, setPhase] = useState<Phase>("assembling");
  const [viewMode, setViewMode] = useState<"assembled" | "scattered">("assembled");
  const vectorRef = useRef<HTMLImageElement>(null);
  const pieceLayerRef = useRef<HTMLDivElement>(null);
  const pieceRefs = useRef<Array<SVGGElement | null>>([]);
  const viewModeRef = useRef<"assembled" | "scattered">("assembled");
  const reducedMotionRef = useRef(false);
  const busyRef = useRef(false);
  const operationRef = useRef(0);
  const activeAnimationsRef = useRef<Animation[]>([]);
  const activeFramesRef = useRef<number[]>([]);
  const activeTimerRef = useRef<number | null>(null);

  const cancelActive = useCallback(() => {
    operationRef.current += 1;
    activeAnimationsRef.current.forEach((animation) => animation.cancel());
    activeAnimationsRef.current = [];
    activeFramesRef.current.forEach((frame) => window.cancelAnimationFrame(frame));
    activeFramesRef.current = [];
    if (activeTimerRef.current !== null) {
      window.clearTimeout(activeTimerRef.current);
      activeTimerRef.current = null;
    }
    return operationRef.current;
  }, []);

  const playPieces = useCallback(
    (direction: PieceDirection, onDone: () => void) => {
      const operation = cancelActive();
      busyRef.current = true;
      const frame = window.requestAnimationFrame(() => {
        if (operationRef.current !== operation) return;

        const compact = window.matchMedia("(max-width: 640px)").matches;
        const duration = compact ? 1_180 : ASSEMBLY_DURATION;
        const endTransforms: string[] = [];
        const maxDelay = PIECE_INDEXES.reduce((maximum, _path, index) => {
          const random = seededRandom(0x1234abcd + index * 97);
          const delay = Math.max(0, 25 + random() * 300);
          const piece = pieceRefs.current[index];
          if (!piece) return maximum;

          const scatter = transformFor(createScatter(index, compact));
          const startTransform = direction === "assemble" ? scatter : IDENTITY_TRANSFORM;
          const endTransform = direction === "assemble" ? IDENTITY_TRANSFORM : scatter;
          const startOpacity = 0;
          const endOpacity = 1;
          endTransforms[index] = endTransform;
          piece.style.transform = startTransform;
          piece.style.opacity = String(startOpacity);
          piece.style.willChange = "transform, opacity";

          const finishPiece = () => {
            piece.style.transform = endTransform;
            piece.style.opacity = String(endOpacity);
            piece.style.willChange = "auto";
          };

          if (typeof piece.animate === "function") {
            try {
              const animation = piece.animate(
                [
                  { transform: startTransform, opacity: startOpacity },
                  { transform: endTransform, opacity: endOpacity },
                ],
                { duration, delay, easing: EASING, fill: "forwards" },
              );
              animation.onfinish = finishPiece;
              activeAnimationsRef.current.push(animation);
            } catch {
              finishPiece();
            }
          } else {
            finishPiece();
          }

          return Math.max(maximum, delay);
        }, 0);

        activeTimerRef.current = window.setTimeout(() => {
          if (operationRef.current !== operation) return;
          PIECE_INDEXES.forEach((_path, index) => {
            const piece = pieceRefs.current[index];
            const endTransform = endTransforms[index];
            if (piece && endTransform) {
              piece.style.transform = endTransform;
              piece.style.opacity = "1";
            }
          });
          activeAnimationsRef.current = [];
          activeTimerRef.current = null;
          busyRef.current = false;
          onDone();
        }, maxDelay + duration + 45);
      });
      activeFramesRef.current.push(frame);
    },
    [cancelActive],
  );

  const crossfade = useCallback(
    (toPieces: boolean, onDone: () => void) => {
      const operation = cancelActive();
      busyRef.current = true;
      const vector = vectorRef.current;
      const pieceLayer = pieceLayerRef.current;
      if (!vector || !pieceLayer) {
        busyRef.current = false;
        onDone();
        return;
      }

      const vectorFrom = toPieces ? 1 : 0;
      const vectorTo = toPieces ? 0 : 1;
      const piecesFrom = toPieces ? 0 : 1;
      const piecesTo = toPieces ? 1 : 0;
      vector.style.opacity = String(vectorFrom);
      pieceLayer.style.opacity = String(piecesFrom);

      const finish = () => {
        if (operationRef.current !== operation) return;
        vector.style.opacity = String(vectorTo);
        pieceLayer.style.opacity = String(piecesTo);
        activeAnimationsRef.current = [];
        activeTimerRef.current = null;
        busyRef.current = false;
        onDone();
      };

      try {
        const vectorAnimation = vector.animate([{ opacity: vectorFrom }, { opacity: vectorTo }], {
          duration: REVEAL_DURATION,
          easing: "ease-out",
          fill: "forwards",
        });
        const piecesAnimation = pieceLayer.animate([{ opacity: piecesFrom }, { opacity: piecesTo }], {
          duration: REVEAL_DURATION,
          easing: "ease-out",
          fill: "forwards",
        });
        activeAnimationsRef.current = [vectorAnimation, piecesAnimation];
      } catch {
        vector.style.opacity = String(vectorTo);
        pieceLayer.style.opacity = String(piecesTo);
      }

      activeTimerRef.current = window.setTimeout(finish, REVEAL_DURATION + 30);
    },
    [cancelActive],
  );

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    reducedMotionRef.current = reduceMotion;

    if (reduceMotion || readSessionFlag()) {
      const staticFrame = window.requestAnimationFrame(() => setPhase("static"));
      return () => {
        window.cancelAnimationFrame(staticFrame);
        cancelActive();
      };
    }

    let cancelled = false;
    let vectorTimer = 0;

    const waitForVector = (attempt = 0) => {
      if (cancelled) return;
      const vector = vectorRef.current;
      const ready = vector?.complete && vector.naturalWidth > 0;
      if (ready || attempt >= 80) {
        crossfade(false, () => {
          if (!cancelled) {
            writeSessionFlag();
            setPhase("complete");
          }
        });
        return;
      }
      vectorTimer = window.setTimeout(() => waitForVector(attempt + 1), 50);
    };

    playPieces("assemble", () => waitForVector());

    return () => {
      cancelled = true;
      window.clearTimeout(vectorTimer);
      cancelActive();
      busyRef.current = false;
    };
  }, [cancelActive, crossfade, playPieces]);

  const handlePortraitClick = useCallback(() => {
    if (reducedMotionRef.current || phase === "assembling" || busyRef.current) return;

    if (viewModeRef.current === "assembled") {
      pieceRefs.current.forEach((piece) => {
        if (!piece) return;
        piece.style.transform = IDENTITY_TRANSFORM;
      });
      crossfade(true, () => {
        playPieces("scatter", () => {
          viewModeRef.current = "scattered";
          setViewMode("scattered");
          setPhase("scattered");
        });
      });
      return;
    }

    playPieces("assemble", () => {
      crossfade(false, () => {
        viewModeRef.current = "assembled";
        setViewMode("assembled");
        setPhase("complete");
      });
    });
  }, [crossfade, phase, playPieces]);

  const isAssembling = phase === "assembling";
  const isScattered = viewMode === "scattered";
  const label = isAssembling
    ? "پرتره در حال مونتاژ است"
    : isScattered
      ? "پرتره را دوباره سرهم کن"
      : "پرتره را متلاشی کن";

  return (
    <button
      type="button"
      className="portrait-reassembly group relative mx-auto block w-full max-w-[28rem] cursor-pointer border-0 bg-transparent p-0 text-inherit"
      data-phase={phase}
      data-view={viewMode}
      aria-busy={isAssembling}
      aria-label={label}
      aria-pressed={isScattered}
      onClick={handlePortraitClick}
    >
      <div className="portrait-halo pointer-events-none absolute inset-x-[14%] top-[16%] aspect-square rounded-full blur-3xl" />

      <div
        ref={pieceLayerRef}
        className="portrait-pieces pointer-events-none absolute inset-0 overflow-visible"
        aria-hidden="true"
        style={{ opacity: phase === "assembling" || phase === "scattered" ? 1 : 0 }}
      >
        <svg
          aria-hidden="true"
          className="portrait-piece-svg absolute inset-0 block h-full w-full"
          overflow="visible"
          preserveAspectRatio="xMidYMid meet"
          viewBox={`${PORTRAIT_VIEWBOX.x} ${PORTRAIT_VIEWBOX.y} ${PORTRAIT_VIEWBOX.w} ${PORTRAIT_VIEWBOX.h}`}
        >
          {PIECE_INDEXES.map((index) => {
            const pieceId = portraitPieceId(index);
            return (
              <g
                key={pieceId}
                ref={(element) => {
                  pieceRefs.current[index] = element;
                }}
                className="portrait-piece"
                style={{ transform: transformFor(DESKTOP_SCATTERS[index]) }}
              >
                <use href={`${PORTRAIT_SOURCE}#${pieceId}`} />
              </g>
            );
          })}
        </svg>
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={vectorRef}
        src={PORTRAIT_SOURCE}
        alt="تصویر هادی، بنیان‌گذار هادیران"
        className="portrait-vector relative block h-auto w-full"
        decoding="async"
        style={{ opacity: phase === "complete" || phase === "static" ? 1 : 0 }}
      />
    </button>
  );
}
