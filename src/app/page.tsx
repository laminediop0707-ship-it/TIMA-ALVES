import Link from "next/link";
import { Starfield } from "@/components/effects";
import { getPublished } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const content = await getPublished();
  const { landing, meta } = content;

  return (
    <main>
      <Starfield />

      <section className="scene">
        <div className="shell narrow stack center fade-scene">
          <span className="badge float-slow">{landing.badge}</span>

          <h1
            className="display gradient-text"
            style={{ fontSize: "clamp(2.9rem, 9vw, 5.6rem)", marginTop: "8px" }}
          >
            {landing.heading}
          </h1>

          <p
            className="display"
            style={{
              fontSize: "clamp(1.25rem, 3.4vw, 1.9rem)",
              color: "#e3d4ea",
              whiteSpace: "pre-line",
              maxWidth: "640px",
            }}
          >
            {landing.subheading}
          </p>

          <hr className="divider-glow" style={{ width: "min(320px, 70%)", margin: "10px auto" }} />

          <div className="btn-row" style={{ justifyContent: "center" }}>
            <Link href="/surprise" className="btn btn-lg pulse-glow">
              {landing.ctaPrimary}
            </Link>
            <a href="#about" className="btn btn-ghost btn-lg">
              {landing.ctaSecondary}
            </a>
          </div>

          <p className="muted" style={{ fontSize: "0.85rem", maxWidth: "460px" }}>
            {landing.note}
          </p>
        </div>
      </section>

      <section id="about" className="shell narrow center" style={{ paddingBottom: "80px" }}>
        <div className="glass" style={{ padding: "clamp(22px, 5vw, 42px)" }}>
          <span className="kicker">Surprise privée</span>
          <p className="display" style={{ fontSize: "clamp(1.4rem, 4vw, 2.2rem)", margin: "12px 0" }}>
            « Certaines personnes entrent dans une pièce.
            <br />
            D&apos;autres changent l&apos;ambiance de la pièce. »
          </p>
          <p className="muted">
            Ce site a été assemblé ligne par ligne, avec un peu de code, beaucoup
            d&apos;ambiance et quelques mots choisis. Il n&apos;y a qu&apos;une seule
            personne à qui il est destiné. 💗
          </p>
        </div>
      </section>

      <footer className="site-footer">
        <div className="shell">
          <p>{meta.badge}</p>
          <p className="footer-signature">{meta.footerSignature}</p>
        </div>
      </footer>
    </main>
  );
}
