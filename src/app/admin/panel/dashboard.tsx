"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Content, Slide } from "@/lib/content-types";
import type { MediaRecord } from "@/lib/media";
import { Starfield } from "@/components/effects";
import { ConfirmDialog, SectionCard, Toast } from "./ui";
import { ContentEditor } from "./content-editor";
import { PoemsEditor } from "./poems-editor";
import { MediaManager } from "./media-manager";

type FullContent = Content & { slides: Slide[] };
type AdminUser = { id: string; username: string; mustChangePassword: boolean };
type Revision = { id: string; label: string | null; createdAt: string };
type Tab = "content" | "poems" | "media" | "publish" | "account";

const TABS: { id: Tab; label: string }[] = [
  { id: "content", label: "Textes" },
  { id: "poems", label: "Poèmes" },
  { id: "media", label: "Mes souvenirs" },
  { id: "publish", label: "Publication" },
  { id: "account", label: "Compte" },
];

export function AdminDashboard({ user }: { user: AdminUser }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("content");
  const [draft, setDraft] = useState<Content | null>(null);
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [media, setMedia] = useState<MediaRecord[]>([]);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ message: string; kind: "ok" | "err" } | null>(null);
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [restoreId, setRestoreId] = useState<string | null>(null);
  const [mustChange, setMustChange] = useState(user.mustChangePassword);

  const notify = useCallback((message: string, kind: "ok" | "err" = "ok") => {
    setToast({ message, kind });
    window.setTimeout(() => setToast(null), 2800);
  }, []);

  const loadAll = useCallback(async () => {
    const [contentResponse, mediaResponse, revisionsResponse] = await Promise.all([
      fetch("/api/admin/content", { cache: "no-store" }),
      fetch("/api/admin/media", { cache: "no-store" }),
      fetch("/api/admin/content/revisions", { cache: "no-store" }),
    ]);

    if (contentResponse.status === 401) {
      router.replace("/admin");
      return;
    }

    if (contentResponse.ok) {
      const data = (await contentResponse.json()) as {
        draft: Content;
        published: FullContent;
        publishedAt: string | null;
      };
      setDraft(data.draft);
      setPublishedAt(data.publishedAt);
    }
    if (mediaResponse.ok) {
      const data = (await mediaResponse.json()) as { media: MediaRecord[] };
      setMedia(data.media);
    }
    if (revisionsResponse.ok) {
      const data = (await revisionsResponse.json()) as { revisions: Revision[] };
      setRevisions(data.revisions);
    }
  }, [router]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const patchDraft = useCallback((patch: (prev: Content) => Content) => {
    setDraft((prev) => (prev ? patch(prev) : prev));
    setDirty(true);
  }, []);

  async function saveDraft() {
    if (!draft) return;
    setBusy(true);
    try {
      const response = await fetch("/api/admin/content/draft", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        notify(data.error ?? "Enregistrement impossible.", "err");
        return;
      }
      notify("Brouillon enregistré 💾");
      setDirty(false);
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    setBusy(true);
    try {
      // Publish always saves the current draft first.
      if (draft) {
        await fetch("/api/admin/content/draft", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draft),
        });
      }
      const response = await fetch("/api/admin/content/publish", { method: "POST" });
      const data = (await response.json()) as { error?: string; publishedAt?: string };
      if (!response.ok) {
        notify(data.error ?? "Publication impossible.", "err");
        return;
      }
      notify("Publié ! Le site est à jour 💗");
      setDirty(false);
      await loadAll();
    } finally {
      setBusy(false);
      setConfirmPublish(false);
    }
  }

  async function discard() {
    setBusy(true);
    try {
      const response = await fetch("/api/admin/content/discard", { method: "POST" });
      const data = (await response.json()) as { content?: Content; error?: string };
      if (!response.ok || !data.content) {
        notify(data.error ?? "Impossible d'annuler.", "err");
        return;
      }
      setDraft(data.content);
      setDirty(false);
      notify("Modifications annulées.");
    } finally {
      setBusy(false);
      setConfirmDiscard(false);
    }
  }

  async function restore(id: string) {
    setBusy(true);
    try {
      const response = await fetch("/api/admin/content/discard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revisionId: id }),
      });
      const data = (await response.json()) as { content?: Content; error?: string };
      if (!response.ok || !data.content) {
        notify(data.error ?? "Restauration impossible.", "err");
        return;
      }
      setDraft(data.content);
      setDirty(true);
      notify("Version restaurée dans le brouillon ✅");
    } finally {
      setBusy(false);
      setRestoreId(null);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin");
    router.refresh();
  }

  if (mustChange) {
    return (
      <PasswordGate
        onDone={() => {
          setMustChange(false);
          notify("Mot de passe mis à jour ✅");
        }}
      />
    );
  }

  return (
    <main style={{ paddingBottom: "90px" }}>
      <Starfield />

      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          backdropFilter: "blur(16px)",
          background: "rgba(10,5,17,0.75)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="shell" style={{ paddingBlock: "14px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <span className="kicker">Espace admin</span>
              <h1 className="display" style={{ fontSize: "1.5rem" }}>
                Tableau de bord
              </h1>
            </div>
            <div className="btn-row" style={{ alignItems: "center" }}>
              <span className={dirty ? "pill pill-draft" : "pill pill-live"}>
                {dirty ? "Brouillon non enregistré" : "À jour"}
              </span>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => window.open("/surprise?preview=1", "_blank")}
              >
                👁 Prévisualiser le site
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => void logout()}>
                Déconnexion
              </button>
            </div>
          </div>

          <nav className="admin-tabs" style={{ marginTop: "12px" }} role="tablist">
            {TABS.map((item) => (
              <button
                key={item.id}
                role="tab"
                aria-selected={tab === item.id}
                className="admin-tab"
                onClick={() => setTab(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <div className="shell stack" style={{ marginTop: "22px", gap: "20px" }}>
        {!draft ? (
          <p className="muted">Chargement du contenu…</p>
        ) : (
          <>
            {tab === "content" ? (
              <ContentEditor draft={draft} onPatch={patchDraft} />
            ) : null}

            {tab === "poems" ? (
              <PoemsEditor
                poems={draft.poems}
                onChange={(poems) => patchDraft((prev) => ({ ...prev, poems }))}
              />
            ) : null}

            {tab === "media" ? (
              <MediaManager media={media} onChanged={setMedia} notify={notify} />
            ) : null}

            {tab === "publish" ? (
              <div className="stack" style={{ gap: "18px" }}>
                <SectionCard
                  title="Publier les changements"
                  description="Tant que tu n'as pas publié, Tima voit toujours l'ancienne version."
                >
                  <div className="btn-row">
                    <button className="btn" onClick={() => void saveDraft()} disabled={busy}>
                      💾 Enregistrer le brouillon
                    </button>
                    <button
                      className="btn btn-ghost"
                      onClick={() => window.open("/surprise?preview=1", "_blank")}
                    >
                      👁 Prévisualiser le brouillon
                    </button>
                    <button
                      className="btn"
                      onClick={() => setConfirmPublish(true)}
                      disabled={busy}
                    >
                      ✅ Confirmer et publier
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => setConfirmDiscard(true)}
                      disabled={busy}
                    >
                      ↩ Annuler les modifications
                    </button>
                  </div>
                  <p className="muted" style={{ fontSize: "0.85rem" }}>
                    Dernière publication :{" "}
                    {publishedAt
                      ? new Date(publishedAt).toLocaleString("fr-FR")
                      : "jamais"}
                  </p>
                </SectionCard>

                <SectionCard
                  title="Aperçu du brouillon"
                  description="Un aperçu rapide des textes actuels du brouillon."
                >
                  <div className="glass" style={{ padding: "20px" }}>
                    <span className="kicker">{draft.landing.badge}</span>
                    <h2
                      className="display gradient-text"
                      style={{ fontSize: "1.6rem", margin: "6px 0" }}
                    >
                      {draft.landing.heading}
                    </h2>
                    <p className="muted" style={{ whiteSpace: "pre-line" }}>
                      {draft.landing.subheading}
                    </p>
                    <hr className="divider-glow" style={{ margin: "14px 0" }} />
                    <p className="muted" style={{ fontSize: "0.85rem" }}>
                      {draft.poems.length} texte(s) • {media.length} souvenir(s) dans la
                      bibliothèque
                    </p>
                  </div>
                </SectionCard>

                <SectionCard
                  title="Historique des publications"
                  description="Charge une ancienne version dans le brouillon, puis publie si elle te plaît."
                >
                  {revisions.length === 0 ? (
                    <p className="muted">Aucune version pour l&apos;instant.</p>
                  ) : (
                    <div className="stack" style={{ gap: "8px" }}>
                      {revisions.map((revision) => (
                        <div
                          key={revision.id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: "10px",
                            alignItems: "center",
                            flexWrap: "wrap",
                            padding: "10px 12px",
                            borderRadius: "12px",
                            background: "rgba(255,255,255,0.04)",
                          }}
                        >
                          <span style={{ fontSize: "0.86rem" }}>
                            {revision.label ?? "Version"} •{" "}
                            {new Date(revision.createdAt).toLocaleString("fr-FR")}
                          </span>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setRestoreId(revision.id)}
                          >
                            Restaurer
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </SectionCard>
              </div>
            ) : null}

            {tab === "account" ? (
              <AccountPanel username={user.username} onNotify={notify} onLogout={logout} />
            ) : null}
          </>
        )}
      </div>

      <ConfirmDialog
        open={confirmPublish}
        title="Confirmer et publier ?"
        message="Les textes et souvenirs du brouillon deviennent la version officielle visible par Tima."
        confirmLabel="Publier maintenant"
        onCancel={() => setConfirmPublish(false)}
        onConfirm={() => void publish()}
      />
      <ConfirmDialog
        open={confirmDiscard}
        title="Annuler les modifications ?"
        message="Le brouillon revient à la dernière version publiée. Tes changements non publiés seront perdus."
        confirmLabel="Oui, annuler"
        danger
        onCancel={() => setConfirmDiscard(false)}
        onConfirm={() => void discard()}
      />
      <ConfirmDialog
        open={restoreId !== null}
        title="Restaurer cette version ?"
        message="Cette version remplacera le brouillon actuel. Rien n'est publié tant que tu ne confirmes pas."
        confirmLabel="Restaurer"
        onCancel={() => setRestoreId(null)}
        onConfirm={() => restoreId && void restore(restoreId)}
      />

      {toast ? <Toast message={toast.message} kind={toast.kind} /> : null}
    </main>
  );
}

/* ------------------------------------------------------------------ */
/*  Forced password change (first login)                               */
/* ------------------------------------------------------------------ */

function PasswordGate({ onDone }: { onDone: () => void }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (newPassword !== confirm) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Impossible de changer le mot de passe.");
        return;
      }
      onDone();
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="scene">
      <Starfield />
      <div className="shell narrow">
        <form className="glass stack" onSubmit={submit} style={{ padding: "clamp(24px, 6vw, 44px)" }}>
          <span className="badge">🔐 Première connexion</span>
          <h1 className="display gradient-text" style={{ fontSize: "clamp(1.7rem, 5vw, 2.6rem)" }}>
            Change ton mot de passe
          </h1>
          <p className="muted" style={{ fontSize: "0.9rem" }}>
            Le mot de passe provisoire doit être remplacé avant de continuer. Minimum
            8 caractères, avec au moins une lettre et un chiffre.
          </p>

          <label className="field">
            <span className="label">Mot de passe actuel</span>
            <input
              className="input"
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          <label className="field">
            <span className="label">Nouveau mot de passe</span>
            <input
              className="input"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
              required
            />
          </label>
          <label className="field">
            <span className="label">Confirme le nouveau mot de passe</span>
            <input
              className="input"
              type="password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              autoComplete="new-password"
              required
            />
          </label>

          {error ? <p className="error-text">{error}</p> : null}

          <button className="btn btn-lg" type="submit" disabled={busy}>
            {busy ? "Enregistrement…" : "Valider le nouveau mot de passe"}
          </button>
        </form>
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/*  Account tab                                                        */
/* ------------------------------------------------------------------ */

function AccountPanel({
  username,
  onNotify,
  onLogout,
}: {
  username: string;
  onNotify: (message: string, kind?: "ok" | "err") => void;
  onLogout: () => void;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (newPassword !== confirm) {
      onNotify("Les deux mots de passe ne correspondent pas.", "err");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/admin/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        onNotify(data.error ?? "Impossible de changer le mot de passe.", "err");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
      onNotify("Mot de passe mis à jour ✅");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack" style={{ gap: "18px" }}>
      <SectionCard title="Compte administrateur" description={`Connecté en tant que ${username}.`}>
        <form className="stack" onSubmit={submit} style={{ gap: "12px", maxWidth: "460px" }}>
          <label className="field">
            <span className="label">Mot de passe actuel</span>
            <input
              className="input"
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
            />
          </label>
          <label className="field">
            <span className="label">Nouveau mot de passe</span>
            <input
              className="input"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
            />
          </label>
          <label className="field">
            <span className="label">Confirme</span>
            <input
              className="input"
              type="password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              required
            />
          </label>
          <div className="btn-row">
            <button className="btn" type="submit" disabled={busy}>
              {busy ? "…" : "Changer le mot de passe"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={onLogout}>
              Déconnexion
            </button>
          </div>
        </form>
      </SectionCard>

      <SectionCard title="Sécurité" description="Bonnes pratiques pour ce site privé.">
        <ul className="muted" style={{ paddingLeft: "20px", fontSize: "0.9rem", lineHeight: 1.8 }}>
          <li>Le mot de passe provisoire doit être changé avant toute mise en ligne publique.</li>
          <li>Les identifiants ne sont jamais dans le code : ils vivent dans le fichier .env non versionné.</li>
          <li>Les sessions sont stockées côté serveur et révocables à tout moment.</li>
          <li>Les médias importés sont servis par une route contrôlée (aucune exécution de fichier).</li>
        </ul>
      </SectionCard>
    </div>
  );
}
