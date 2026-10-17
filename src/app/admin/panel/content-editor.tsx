"use client";

import type { Content } from "@/lib/content-types";
import { SectionCard, TextArea, TextField } from "./ui";

type Props = {
  draft: Content;
  onPatch: (patch: (prev: Content) => Content) => void;
};

export function ContentEditor({ draft, onPatch }: Props) {
  const setMeta = (field: keyof Content["meta"], value: string) =>
    onPatch((prev) => ({ ...prev, meta: { ...prev.meta, [field]: value } }));

  const setLanding = (field: keyof Content["landing"], value: string) =>
    onPatch((prev) => ({ ...prev, landing: { ...prev.landing, [field]: value } }));

  const setGate = (field: keyof Content["gate"], value: string) =>
    onPatch((prev) => ({ ...prev, gate: { ...prev.gate, [field]: value } }));

  const setIntro = (field: keyof Content["intro"], value: string) =>
    onPatch((prev) => ({ ...prev, intro: { ...prev.intro, [field]: value } }));

  const setSlideshow = (field: keyof Content["slideshow"], value: string) =>
    onPatch((prev) => ({ ...prev, slideshow: { ...prev.slideshow, [field]: value } }));

  const setFinal = (field: keyof Content["final"], value: string) =>
    onPatch((prev) => ({ ...prev, final: { ...prev.final, [field]: value } }));

  return (
    <div className="stack" style={{ gap: "18px" }}>
      <SectionCard
        title="Identité du site"
        description="Le nom affiché, le titre de l'onglet et la signature du pied de page."
      >
        <TextField
          label="Titre du document (onglet navigateur)"
          value={draft.meta.documentTitle}
          onChange={(value) => setMeta("documentTitle", value)}
        />
        <TextField
          label="Nom affiché"
          value={draft.meta.brandName}
          onChange={(value) => setMeta("brandName", value)}
          hint="C'est aussi le nom que la birthday girl doit saisir pour déverrouiller la surprise."
        />
        <TextField
          label="Petit nom"
          value={draft.meta.shortName}
          onChange={(value) => setMeta("shortName", value)}
        />
        <TextField
          label="Badge / accroche"
          value={draft.meta.badge}
          onChange={(value) => setMeta("badge", value)}
        />
        <TextField
          label="Signature du footer"
          value={draft.meta.footerSignature}
          onChange={(value) => setMeta("footerSignature", value)}
          hint="Signature obligatoire : made by lemzo_biker ❤️"
        />
      </SectionCard>

      <SectionCard title="Page d'accueil" description="Ce que l'on voit avant la surprise.">
        <TextField
          label="Badge"
          value={draft.landing.badge}
          onChange={(value) => setLanding("badge", value)}
        />
        <TextField
          label="Grand titre"
          value={draft.landing.heading}
          onChange={(value) => setLanding("heading", value)}
        />
        <TextArea
          label="Sous-titre"
          value={draft.landing.subheading}
          onChange={(value) => setLanding("subheading", value)}
          rows={3}
        />
        <div className="btn-row">
          <div style={{ flex: "1 1 240px" }}>
            <TextField
              label="Bouton principal"
              value={draft.landing.ctaPrimary}
              onChange={(value) => setLanding("ctaPrimary", value)}
            />
          </div>
          <div style={{ flex: "1 1 240px" }}>
            <TextField
              label="Bouton secondaire"
              value={draft.landing.ctaSecondary}
              onChange={(value) => setLanding("ctaSecondary", value)}
            />
          </div>
        </div>
        <TextArea
          label="Note"
          value={draft.landing.note}
          onChange={(value) => setLanding("note", value)}
          rows={3}
        />
      </SectionCard>

      <SectionCard
        title="Porte d'entrée (vérification du nom)"
        description="Le champ où elle tape son nom complet pour déverrouiller la surprise."
      >
        <TextField label="Badge" value={draft.gate.badge} onChange={(v) => setGate("badge", v)} />
        <TextField label="Titre" value={draft.gate.heading} onChange={(v) => setGate("heading", v)} />
        <TextArea
          label="Message d'introduction"
          value={draft.gate.message}
          onChange={(v) => setGate("message", v)}
          rows={4}
        />
        <TextField label="Libellé du champ" value={draft.gate.label} onChange={(v) => setGate("label", v)} />
        <TextField
          label="Placeholder du champ"
          value={draft.gate.placeholder}
          onChange={(v) => setGate("placeholder", v)}
        />
        <TextField label="Texte du bouton" value={draft.gate.button} onChange={(v) => setGate("button", v)} />
        <TextField
          label="Message d'erreur"
          value={draft.gate.errorMessage}
          onChange={(v) => setGate("errorMessage", v)}
          hint="Affiché si le nom ne correspond pas."
        />
        <TextField label="Indice" value={draft.gate.hint} onChange={(v) => setGate("hint", v)} />
      </SectionCard>

      <SectionCard title="Introduction de la surprise" description="Le premier écran après le déverrouillage.">
        <TextField label="Badge" value={draft.intro.badge} onChange={(v) => setIntro("badge", v)} />
        <TextField label="Titre" value={draft.intro.heading} onChange={(v) => setIntro("heading", v)} />
        <TextArea
          label="Message d'accueil"
          value={draft.intro.message}
          onChange={(v) => setIntro("message", v)}
          rows={8}
          hint="Laisse une ligne vide entre deux paragraphes."
        />
        <TextField
          label="Bouton de démarrage"
          value={draft.intro.startButton}
          onChange={(v) => setIntro("startButton", v)}
        />
      </SectionCard>

      <SectionCard title="Diaporama" description="Textes des contrôles et messages du diaporama.">
        <TextField label="Accroche" value={draft.slideshow.kicker} onChange={(v) => setSlideshow("kicker", v)} />
        <TextField label="Titre" value={draft.slideshow.heading} onChange={(v) => setSlideshow("heading", v)} />
        <TextArea
          label="Introduction"
          value={draft.slideshow.intro}
          onChange={(v) => setSlideshow("intro", v)}
          rows={3}
        />
        <TextArea
          label="Message si aucun souvenir publié"
          value={draft.slideshow.emptyMessage}
          onChange={(v) => setSlideshow("emptyMessage", v)}
          rows={3}
        />
        <TextField label="Bouton Précédent" value={draft.slideshow.prevLabel} onChange={(v) => setSlideshow("prevLabel", v)} />
        <TextField label="Bouton Suivant" value={draft.slideshow.nextLabel} onChange={(v) => setSlideshow("nextLabel", v)} />
        <TextField
          label="Bouton continuer (vers le final)"
          value={draft.slideshow.continueLabel}
          onChange={(v) => setSlideshow("continueLabel", v)}
        />
        <TextField label="Libellé lecture auto (pause)" value={draft.slideshow.autoplayOn} onChange={(v) => setSlideshow("autoplayOn", v)} />
        <TextField label="Libellé lecture auto (play)" value={draft.slideshow.autoplayOff} onChange={(v) => setSlideshow("autoplayOff", v)} />
        <TextField
          label="Compteur"
          value={draft.slideshow.counterTemplate}
          onChange={(v) => setSlideshow("counterTemplate", v)}
          hint="Utilise {current} et {total}."
        />
        <TextField label="Chargement" value={draft.slideshow.loadingLabel} onChange={(v) => setSlideshow("loadingLabel", v)} />
        <TextField label="Média introuvable" value={draft.slideshow.errorLabel} onChange={(v) => setSlideshow("errorLabel", v)} />
      </SectionCard>

      <SectionCard title="Écran final" description="La révélation et le bouton de pluie de cœurs.">
        <TextField label="Badge" value={draft.final.kicker} onChange={(v) => setFinal("kicker", v)} />
        <TextField label="Titre" value={draft.final.heading} onChange={(v) => setFinal("heading", v)} />
        <TextArea
          label="Message final"
          value={draft.final.message}
          onChange={(v) => setFinal("message", v)}
          rows={10}
        />
        <TextField label="Signature" value={draft.final.signature} onChange={(v) => setFinal("signature", v)} />
        <TextField
          label="Bouton pluie de cœurs"
          value={draft.final.heartButton}
          onChange={(v) => setFinal("heartButton", v)}
        />
        <TextField
          label="Phrase finale (après les cœurs)"
          value={draft.final.finaleMessage}
          onChange={(v) => setFinal("finaleMessage", v)}
        />
        <TextField label="Bouton rejouer" value={draft.final.replayLabel} onChange={(v) => setFinal("replayLabel", v)} />
      </SectionCard>

      <SectionCard title="Décorations" description="Les emojis utilisés dans la pluie de cœurs.">
        <TextField
          label="Emojis (séparés par des virgules)"
          value={draft.decorations.emojis.join(", ")}
          onChange={(value) =>
            onPatch((prev) => ({
              ...prev,
              decorations: {
                emojis: value
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean)
                  .slice(0, 40),
              },
            }))
          }
        />
      </SectionCard>
    </div>
  );
}
