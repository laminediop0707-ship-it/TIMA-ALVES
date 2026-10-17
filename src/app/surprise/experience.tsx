"use client";

import { useCallback, useEffect, useState } from "react";
import type { Content, Slide } from "@/lib/content-types";
import { Starfield, releaseHearts, usePetals } from "@/components/effects";
import { Slideshow } from "./Slideshow";

type FullContent = Content & { slides: Slide[] };

type Phase = "gate" | "intro" | "poem" | "slideshow" | "final";

type Props = {
  initialContent: FullContent | null;
  gateTexts: Content["gate"];
  initialUnlocked: boolean;
  preview?: boolean;
};

export function SurpriseExperience({
  initialContent,
  gateTexts,
  initialUnlocked,
  preview = false,
}: Props) {
  const [content, setContent] = useState<FullContent | null>(initialContent);
  const [phase, setPhase] = useState<Phase>(
    initialUnlocked || preview ? "intro" : "gate",
  );
  const [poemIndex, setPoemIndex] = useState(0);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [busy, setBusy] = useState(false);
  const [heartCount, setHeartCount] = useState(0);

  usePetals(Boolean(content));

  // Scroll to the top whenever the scene changes.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [phase, poemIndex]);

  const unlock = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (busy) return;
      setBusy(true);
      setError(null);
      try {
        const response = await fetch("/api/surprise/unlock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });
        const data = (await response.json()) as { error?: string };

        if (!response.ok) {
          setError(data.error ?? "Wrong name ! Try again, birthday queen.");
          setShake(true);
          window.setTimeout(() => setShake(false), 500);
          return;
        }

        const contentResponse = await fetch("/api/content");
        const contentData = (await contentResponse.json()) as { content?: FullContent };
        if (contentData.content) setContent(contentData.content);
        setPhase("intro");
      } catch {
        setError("Connexion impossible. Réessaie dans un instant. 💗");
      } finally {
        setBusy(false);
      }
    },
    [busy, name],
  );

  /* ---------------- No content yet (still loading) ---------------- */
  if (!content && phase !== "gate") {
    return (
      <main className="scene">
        <Starfield />
        <p className="muted">Chargement… 💗</p>
      </main>
    );
  }

  /* ---------------- Gate ---------------- */
  if (phase === "gate") {
    const gate = content?.gate ?? gateTexts;
    return (
      <main className="scene">
        <Starfield />
        <div className="shell narrow">
          <div
            className="glass pop-in center stack"
            style={{ padding: "clamp(24px, 6vw, 48px)", gap: "20px" }}
          >
            <span className="badge">{gate?.badge ?? "🔒 Accès privé"}</span>
            <h1 className="display gradient-text" style={{ fontSize: "clamp(2rem, 6vw, 3.4rem)" }}>
              {gate?.heading ?? "Hey you, birthday girl ! 💗✨"}
            </h1>
            <p className="muted" style={{ maxWidth: "520px", margin: "0 auto" }}>
              {gate?.message ?? "Prouve que c'est bien toi. 👀"}
            </p>

            <form
              onSubmit={unlock}
              className={shake ? "stack shake" : "stack"}
              style={{ gap: "14px", marginTop: "6px" }}
            >
              <label className="field">
                <span className="label center">{gate?.label ?? "Ton nom complet"}</span>
                <input
                  className="input"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder={gate?.placeholder ?? "Écris ton nom complet…"}
                  autoComplete="off"
                  spellCheck={false}
                  required
                  style={{ textAlign: "center" }}
                />
              </label>

              {error ? <p className="error-text center">{error}</p> : null}

              <button className="btn btn-lg pulse-glow" type="submit" disabled={busy}>
                {busy ? "…" : (gate?.button ?? "Unlock my surprise 💖")}
              </button>
            </form>

            {gate?.hint ? (
              <p className="muted" style={{ fontSize: "0.82rem" }}>
                {gate.hint}
              </p>
            ) : null}
          </div>
        </div>
      </main>
    );
  }

  const { intro, poems, slideshow, final, meta } = content!;
  const clampedIndex = Math.min(poemIndex, Math.max(0, poems.length - 1));

  const footer = (
    <footer className="site-footer">
      <div className="shell">
        <p className="footer-signature">{meta.footerSignature}</p>
      </div>
    </footer>
  );

  /* ---------------- Intro ---------------- */
  if (phase === "intro") {
    return (
      <main>
        <Starfield />
        {preview ? <PreviewBanner /> : null}
        <section className="scene" key="intro">
          <div className="shell narrow stack center fade-scene">
            <span className="badge">{intro.badge}</span>
            <h1 className="display gradient-rose-text" style={{ fontSize: "clamp(2.2rem, 7vw, 4rem)" }}>
              {intro.heading}
            </h1>
            <div className="glass prose-soft" style={{ padding: "clamp(20px, 5vw, 38px)", textAlign: "left" }}>
              {intro.message.split("\n\n").map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
            <button
              className="btn btn-lg pulse-glow"
              onClick={() => {
                setPoemIndex(0);
                setPhase("poem");
              }}
            >
              {intro.startButton}
            </button>
          </div>
        </section>
        {footer}
      </main>
    );
  }

  /* ---------------- Poem ---------------- */
  if (phase === "poem") {
    const poem = poems[clampedIndex];
    const isLast = clampedIndex >= poems.length - 1;

    if (!poem) {
      return <GoToSlideshow />;
    }

    return (
      <main>
        <Starfield />
        {preview ? <PreviewBanner /> : null}
        <section className="scene">
          <div className="shell narrow stack" key={poem.id}>
            <div className="center">
              <span className="kicker">{poem.kicker}</span>
              <h2 className="display gradient-text" style={{ fontSize: "clamp(1.9rem, 6vw, 3.2rem)" }}>
                {poem.title}
              </h2>
            </div>

            <article className="card fade-scene" style={{ padding: "clamp(20px, 5vw, 40px)" }}>
              <div
                className="display prose-soft"
                style={{ fontSize: "clamp(1.18rem, 2.8vw, 1.5rem)", whiteSpace: "pre-line" }}
              >
                {poem.text}
              </div>
            </article>

            <div className="center">
              <button
                className="btn btn-lg pulse-glow"
                onClick={() =>
                  isLast ? setPhase("slideshow") : setPoemIndex(clampedIndex + 1)
                }
              >
                {isLast ? slideshow.continueLabel : poem.continueLabel}
              </button>
            </div>
          </div>
        </section>
        {footer}
      </main>
    );
  }

  /* ---------------- Slideshow ---------------- */
  if (phase === "slideshow") {
    return (
      <main>
        <Starfield />
        {preview ? <PreviewBanner /> : null}
        <section className="scene">
          <div className="shell stack" style={{ width: "100%" }}>
            <div className="center">
              <span className="kicker">{slideshow.kicker}</span>
              <h2 className="display gradient-text" style={{ fontSize: "clamp(1.9rem, 6vw, 3rem)" }}>
                {slideshow.heading}
              </h2>
              <p className="muted" style={{ maxWidth: "560px", margin: "8px auto 0" }}>
                {slideshow.intro}
              </p>
            </div>

            <Slideshow
              slides={content!.slides}
              labels={slideshow}
              onFinish={() => setPhase("final")}
            />
          </div>
        </section>
        {footer}
      </main>
    );
  }

  /* ---------------- Final ---------------- */
  return (
    <main>
      <Starfield />
      {preview ? <PreviewBanner /> : null}
      <section className="scene">
        <div className="shell narrow stack center fade-scene">
          <span className="badge">{final.kicker}</span>
          <h2 className="display gradient-rose-text" style={{ fontSize: "clamp(2rem, 6.5vw, 3.6rem)" }}>
            {final.heading}
          </h2>

          <div className="glass prose-soft" style={{ padding: "clamp(20px, 5vw, 38px)", textAlign: "left" }}>
            {final.message.split("\n\n").map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          <p className="display" style={{ fontSize: "clamp(1.4rem, 4vw, 2.1rem)" }}>
            <span className="gradient-rose-text">{final.signature}</span>
          </p>

          <button
            className="btn btn-lg pulse-glow"
            onClick={() => {
              releaseHearts(80, content!.decorations.emojis);
              setHeartCount((value) => value + 1);
            }}
          >
            {final.heartButton} {heartCount > 0 ? `(${heartCount})` : ""}
          </button>

          {heartCount > 0 ? (
            <p className="display pop-in" style={{ fontSize: "clamp(1.1rem, 3vw, 1.5rem)", color: "#ffd6e6" }}>
              {final.finaleMessage}
            </p>
          ) : null}

          <button
            className="btn btn-ghost"
            onClick={() => {
              setPoemIndex(0);
              setPhase("intro");
            }}
          >
            {final.replayLabel}
          </button>
        </div>
      </section>
      {footer}
    </main>
  );
}

function GoToSlideshow() {
  return (
    <main className="scene">
      <Starfield />
      <p className="muted">Chargement… 💗</p>
    </main>
  );
}

function PreviewBanner() {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 90,
        padding: "8px 14px",
        textAlign: "center",
        fontSize: "0.78rem",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        background: "linear-gradient(90deg,#ff3d84,#9a6bff)",
        color: "#fff",
      }}
    >
      Aperçu du brouillon — non publié
    </div>
  );
}
