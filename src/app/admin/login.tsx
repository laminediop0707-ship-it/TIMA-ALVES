"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Starfield } from "@/components/effects";

export function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Connexion impossible.");
        return;
      }
      router.replace("/admin/panel");
      router.refresh();
    } catch {
      setError("Connexion impossible. Réessaie.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="scene">
      <Starfield />
      <div className="shell narrow">
        <form
          className="glass pop-in stack"
          onSubmit={onSubmit}
          style={{ padding: "clamp(24px, 6vw, 44px)" }}
        >
          <div className="center stack" style={{ gap: "8px" }}>
            <span className="badge">🔐 Espace administrateur</span>
            <h1 className="display gradient-text" style={{ fontSize: "clamp(1.8rem, 5vw, 2.8rem)" }}>
              Panneau privé
            </h1>
            <p className="muted" style={{ fontSize: "0.9rem" }}>
              Réservé à l&apos;administrateur du site. Les identifiants provisoires
              doivent être remplacés à la première connexion.
            </p>
          </div>

          <label className="field">
            <span className="label">Identifiant</span>
            <input
              className="input"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              required
            />
          </label>

          <label className="field">
            <span className="label">Mot de passe</span>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          {error ? <p className="error-text">{error}</p> : null}

          <button className="btn btn-lg" type="submit" disabled={busy}>
            {busy ? "Connexion…" : "Se connecter"}
          </button>
        </form>
      </div>
    </main>
  );
}
