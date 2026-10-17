"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Slide } from "@/lib/content-types";

type SlideshowLabels = {
  prevLabel: string;
  nextLabel: string;
  continueLabel: string;
  autoplayOn: string;
  autoplayOff: string;
  counterTemplate: string;
  loadingLabel: string;
  errorLabel: string;
  emptyMessage: string;
};

type Props = {
  slides: Slide[];
  labels: SlideshowLabels;
  onFinish: () => void;
};

export function Slideshow({ slides, labels, onFinish }: Props) {
  const [index, setIndex] = useState(0);
  const [autoplay, setAutoplay] = useState(false);
  const [errored, setErrored] = useState<Record<string, boolean>>({});
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const touchStart = useRef<number | null>(null);

  const total = slides.length;
  const current = slides[index] ?? null;
  const atEnd = index >= total - 1;

  const goTo = useCallback(
    (next: number) => {
      if (total === 0) return;
      const clamped = Math.max(0, Math.min(total - 1, next));
      // Stop any playing video before switching slides.
      videoRef.current?.pause();
      setIndex(clamped);
    },
    [total],
  );

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  // Keyboard navigation.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") next();
      if (event.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  // Autoplay: only advances still images.
  useEffect(() => {
    if (!autoplay || total === 0) return;
    if (current?.type === "VIDEO") return;
    const timer = window.setTimeout(() => {
      if (atEnd) {
        setAutoplay(false);
      } else {
        next();
      }
    }, 6000);
    return () => window.clearTimeout(timer);
  }, [autoplay, index, current, atEnd, next, total]);

  // Pause the video whenever the slide changes.
  useEffect(() => {
    const video = videoRef.current;
    return () => {
      video?.pause();
    };
  }, [index]);

  if (total === 0) {
    return (
      <div className="panel center stack" style={{ padding: "clamp(26px, 6vw, 54px)" }}>
        <h2 className="display" style={{ fontSize: "clamp(1.6rem, 4.5vw, 2.4rem)" }}>
          💗
        </h2>
        <p className="muted">{labels.emptyMessage}</p>
        <div className="btn-row" style={{ justifyContent: "center" }}>
          <button className="btn" onClick={onFinish}>
            {labels.continueLabel}
          </button>
        </div>
      </div>
    );
  }

  const counter = labels.counterTemplate
    .replace("{current}", String(index + 1))
    .replace("{total}", String(total));

  return (
    <div className="stack" style={{ width: "100%" }}>
      <div
        className="stage"
        onTouchStart={(event) => {
          touchStart.current = event.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(event) => {
          const start = touchStart.current;
          const end = event.changedTouches[0]?.clientX ?? null;
          if (start == null || end == null) return;
          const delta = end - start;
          if (Math.abs(delta) > 45) {
            if (delta < 0) next();
            else prev();
          }
          touchStart.current = null;
        }}
      >
        {current && !errored[current.id] ? (
          current.type === "VIDEO" ? (
            <video
              key={current.id}
              ref={videoRef}
              className="stage-media stage-media-contain"
              src={current.url}
              controls
              playsInline
              preload="metadata"
              onEnded={() => {
                if (autoplay && !atEnd) next();
              }}
              onError={() =>
                setErrored((prev) => ({ ...prev, [current.id]: true }))
              }
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={current.id}
              className="stage-media"
              src={current.url}
              alt={current.alt || current.title || "Souvenir"}
              loading="lazy"
              onError={() =>
                setErrored((prev) => ({ ...prev, [current.id]: true }))
              }
            />
          )
        ) : (
          <div
            className="stage-media"
            style={{
              display: "grid",
              placeItems: "center",
              background: "linear-gradient(150deg,#1a0d24,#0a0511)",
              textAlign: "center",
              padding: "24px",
            }}
          >
            <p className="muted">{labels.errorLabel}</p>
          </div>
        )}

        <div className="stage-caption">
          <span className="kicker">{counter}</span>
          {current?.title ? (
            <h3
              className="display"
              style={{ fontSize: "clamp(1.3rem, 3.6vw, 2rem)", marginTop: "4px" }}
            >
              {current.title}
            </h3>
          ) : null}
          {current?.caption ? (
            <p style={{ color: "#e6d7ee", fontSize: "0.95rem" }}>{current.caption}</p>
          ) : null}
        </div>
      </div>

      <div className="progress-track" aria-hidden="true">
        <div
          className="progress-fill"
          style={{ width: `${((index + 1) / total) * 100}%` }}
        />
      </div>

      <div
        className="btn-row"
        style={{ justifyContent: "space-between", alignItems: "center" }}
      >
        <button className="btn btn-ghost btn-sm" onClick={prev} disabled={index === 0}>
          {labels.prevLabel}
        </button>

        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setAutoplay((value) => !value)}
          aria-pressed={autoplay}
        >
          {autoplay ? labels.autoplayOn : labels.autoplayOff}
        </button>

        <button className="btn btn-sm" onClick={next} disabled={atEnd}>
          {labels.nextLabel}
        </button>
      </div>

      {total > 1 ? (
        <div className="thumb-row" role="tablist" aria-label="Souvenirs">
          {slides.map((slide, slideIndex) => (
            <button
              key={slide.id}
              type="button"
              role="tab"
              aria-selected={slideIndex === index}
              aria-label={slide.title || `Souvenir ${slideIndex + 1}`}
              className="thumb"
              data-active={slideIndex === index}
              onClick={() => goTo(slideIndex)}
            >
              {slide.type === "VIDEO" ? (
                <>
                  <video src={slide.url} muted preload="metadata" />
                  <span
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "grid",
                      placeItems: "center",
                      background: "rgba(4,1,8,0.35)",
                      fontSize: "18px",
                    }}
                  >
                    ▶
                  </span>
                </>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={slide.url} alt="" loading="lazy" />
              )}
            </button>
          ))}
        </div>
      ) : null}

      <div className="center">
        <button className="btn btn-lg" onClick={onFinish}>
          {labels.continueLabel}
        </button>
      </div>
    </div>
  );
}
