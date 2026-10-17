"use client";

import { useState } from "react";
import type { Poem } from "@/lib/content-types";
import { ConfirmDialog, SectionCard, TextArea, TextField } from "./ui";

function newPoem(index: number): Poem {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? `poem-${crypto.randomUUID()}`
      : `poem-${Date.now()}-${index}`;
  return {
    id,
    kicker: `0${index + 1} — Nouveau`,
    title: "Titre du poème",
    text: "Écris ton texte ici.\n\nChaque ligne vide crée un nouveau paragraphe.",
    continueLabel: "Continue 💗",
  };
}

export function PoemsEditor({
  poems,
  onChange,
}: {
  poems: Poem[];
  onChange: (poems: Poem[]) => void;
}) {
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);

  const update = (index: number, field: keyof Poem, value: string) => {
    onChange(poems.map((poem, i) => (i === index ? { ...poem, [field]: value } : poem)));
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= poems.length) return;
    const next = [...poems];
    const [item] = next.splice(index, 1);
    if (!item) return;
    next.splice(target, 0, item);
    onChange(next);
  };

  const duplicate = (index: number) => {
    const source = poems[index];
    if (!source) return;
    const copy: Poem = {
      ...source,
      id: `poem-${crypto.randomUUID?.() ?? Date.now()}`,
      title: `${source.title} (copie)`,
    };
    const next = [...poems];
    next.splice(index + 1, 0, copy);
    onChange(next);
  };

  return (
    <SectionCard
      title={`Poèmes et textes successifs (${poems.length})`}
      description="Chaque bloc s'affiche l'un après l'autre ; le bouton fait passer au suivant."
      actions={
        <button
          className="btn btn-sm"
          onClick={() => onChange([...poems, newPoem(poems.length)])}
        >
          + Ajouter un texte
        </button>
      }
    >
      {poems.length === 0 ? (
        <p className="muted">Aucun texte. Ajoute-en un pour commencer.</p>
      ) : null}

      <div className="stack" style={{ gap: "14px" }}>
        {poems.map((poem, index) => (
          <div
            key={poem.id}
            className="panel stack"
            style={{ gap: "12px", background: "rgba(255,255,255,0.03)" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              <span className="pill">Bloc {index + 1}</span>
              <div className="btn-row">
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label="Monter"
                >
                  ↑
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => move(index, 1)}
                  disabled={index === poems.length - 1}
                  aria-label="Descendre"
                >
                  ↓
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => duplicate(index)}>
                  Dupliquer
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => setPendingDelete(index)}
                >
                  Supprimer
                </button>
              </div>
            </div>

            <TextField
              label="Numéro / accroche"
              value={poem.kicker}
              onChange={(value) => update(index, "kicker", value)}
            />
            <TextField
              label="Titre"
              value={poem.title}
              onChange={(value) => update(index, "title", value)}
            />
            <TextArea
              label="Texte du poème"
              value={poem.text}
              onChange={(value) => update(index, "text", value)}
              rows={7}
              hint="Ligne vide = nouveau paragraphe."
            />
            <TextField
              label="Bouton pour continuer"
              value={poem.continueLabel}
              onChange={(value) => update(index, "continueLabel", value)}
            />
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Supprimer ce texte ?"
        message="Cette action retire le bloc du brouillon. Elle sera définitive après publication."
        confirmLabel="Supprimer"
        danger
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete !== null) {
            onChange(poems.filter((_, i) => i !== pendingDelete));
          }
          setPendingDelete(null);
        }}
      />
    </SectionCard>
  );
}
