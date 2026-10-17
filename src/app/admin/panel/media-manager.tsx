"use client";

import { useRef, useState } from "react";
import type { MediaRecord } from "@/lib/media";
import { ConfirmDialog, SectionCard } from "./ui";

type Notify = (message: string, kind?: "ok" | "err") => void;

export function MediaManager({
  media,
  onChanged,
  notify,
}: {
  media: MediaRecord[];
  onChanged: (media: MediaRecord[]) => void;
  notify: Notify;
}) {
  const fileInput = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [urlType, setUrlType] = useState<"IMAGE" | "VIDEO">("IMAGE");
  const [url, setUrl] = useState("");
  const [urlTitle, setUrlTitle] = useState("");
  const [urlCaption, setUrlCaption] = useState("");
  const [pendingDelete, setPendingDelete] = useState<MediaRecord | null>(null);
  const dragIndex = useRef<number | null>(null);

  async function refresh() {
    const response = await fetch("/api/admin/media", { cache: "no-store" });
    if (response.ok) {
      const data = (await response.json()) as { media: MediaRecord[] };
      onChanged(data.media);
    }
  }

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      const form = new FormData();
      Array.from(files).forEach((file) => form.append("files", file));
      const response = await fetch("/api/admin/media/upload", {
        method: "POST",
        body: form,
      });
      const data = (await response.json()) as {
        error?: string;
        rejected?: { name: string; reason: string }[];
        all?: MediaRecord[];
      };
      if (!response.ok) {
        notify(data.error ?? "Envoi impossible.", "err");
      } else {
        notify(`${data.rejected?.length ? "Certains fichiers refusés. " : ""}Média ajouté ✅`, "ok");
        if (data.rejected?.length) {
          data.rejected.forEach((item) => notify(`${item.name} : ${item.reason}`, "err"));
        }
        if (data.all) onChanged(data.all);
      }
    } catch {
      notify("Envoi impossible.", "err");
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function addUrl() {
    if (!url.trim()) return;
    setBusy(true);
    try {
      const response = await fetch("/api/admin/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: urlType,
          url: url.trim(),
          title: urlTitle,
          caption: urlCaption,
          alt: urlTitle,
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        notify(data.error ?? "URL invalide.", "err");
      } else {
        notify("Média ajouté depuis l'URL ✅", "ok");
        setUrl("");
        setUrlTitle("");
        setUrlCaption("");
        await refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  async function patch(id: string, body: Record<string, unknown>) {
    const response = await fetch(`/api/admin/media/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      notify("Modification impossible.", "err");
      return;
    }
    const data = (await response.json()) as { media: MediaRecord };
    onChanged(media.map((item) => (item.id === id ? data.media : item)));
  }

  async function remove(item: MediaRecord) {
    const response = await fetch(`/api/admin/media/${item.id}`, { method: "DELETE" });
    if (!response.ok) {
      notify("Suppression impossible.", "err");
      return;
    }
    notify("Média retiré du brouillon.", "ok");
    onChanged(media.filter((entry) => entry.id !== item.id));
  }

  async function persistOrder(list: MediaRecord[]) {
    onChanged(list);
    const order = list.map((item) => item.id);
    const response = await fetch("/api/admin/media/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order }),
    });
    if (!response.ok) notify("Ordre non enregistré.", "err");
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= media.length) return;
    const next = [...media];
    const [item] = next.splice(index, 1);
    if (!item) return;
    next.splice(target, 0, item);
    void persistOrder(next);
  }

  function onDrop(index: number) {
    const from = dragIndex.current;
    if (from === null || from === index) return;
    const next = [...media];
    const [item] = next.splice(from, 1);
    if (!item) return;
    next.splice(index, 0, item);
    dragIndex.current = null;
    void persistOrder(next);
  }

  return (
    <div className="stack" style={{ gap: "18px" }}>
      <SectionCard
        title="Importer des souvenirs"
        description="Photos (JPG, PNG, WebP, GIF, AVIF) et vidéos (MP4, WebM). Jusqu'à 30 fichiers à la fois."
      >
        <input
          ref={fileInput}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,video/webm"
          onChange={(event) => void upload(event.target.files)}
          disabled={busy}
          style={{ display: "none" }}
        />
        <div className="btn-row">
          <button className="btn" onClick={() => fileInput.current?.click()} disabled={busy}>
            {busy ? "Envoi en cours…" : "📤 Choisir des fichiers"}
          </button>
          <span className="muted" style={{ fontSize: "0.8rem", alignSelf: "center" }}>
            Les fichiers restent côté serveur, jamais dans le navigateur seul.
          </span>
        </div>

        <hr className="divider-glow" style={{ margin: "6px 0" }} />

        <div className="stack" style={{ gap: "10px" }}>
          <span className="label">Ajouter depuis une URL</span>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <select
              className="input"
              value={urlType}
              onChange={(event) => setUrlType(event.target.value as "IMAGE" | "VIDEO")}
              style={{ width: "140px" }}
            >
              <option value="IMAGE">Image</option>
              <option value="VIDEO">Vidéo</option>
            </select>
            <input
              className="input"
              style={{ flex: "1 1 260px" }}
              placeholder="https://…"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
            />
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <input
              className="input"
              style={{ flex: "1 1 200px" }}
              placeholder="Titre"
              value={urlTitle}
              onChange={(event) => setUrlTitle(event.target.value)}
            />
            <input
              className="input"
              style={{ flex: "2 1 240px" }}
              placeholder="Petite légende"
              value={urlCaption}
              onChange={(event) => setUrlCaption(event.target.value)}
            />
            <button className="btn btn-ghost" onClick={() => void addUrl()} disabled={busy}>
              Ajouter
            </button>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title={`Mes souvenirs (${media.length})`}
        description="Glisse-dépose ou utilise les flèches pour changer l'ordre. ⭐ = photo de couverture."
      >
        {media.length === 0 ? (
          <p className="muted">
            Aucun média pour l&apos;instant. Importe tes photos et vidéos ci-dessus.
          </p>
        ) : (
          <div className="media-grid">
            {media.map((item, index) => (
              <div
                key={item.id}
                className="media-tile"
                draggable
                onDragStart={() => {
                  dragIndex.current = index;
                }}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => onDrop(index)}
              >
                <div className="media-tile-preview">
                  {item.type === "VIDEO" ? (
                    <video src={item.url} muted preload="metadata" controls={false} />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.url} alt={item.alt || item.title} loading="lazy" />
                  )}
                  <span
                    className="pill"
                    style={{ position: "absolute", top: "8px", left: "8px" }}
                  >
                    {item.type === "VIDEO" ? "Vidéo" : "Photo"}
                  </span>
                  {item.isCover ? (
                    <span
                      className="pill"
                      style={{ position: "absolute", top: "8px", right: "8px" }}
                    >
                      ⭐
                    </span>
                  ) : null}
                </div>

                <div className="stack" style={{ padding: "10px", gap: "8px" }}>
                  <input
                    className="input"
                    style={{ fontSize: "0.85rem", padding: "8px 10px" }}
                    value={item.title}
                    placeholder="Titre"
                    onChange={(event) =>
                      onChanged(
                        media.map((entry) =>
                          entry.id === item.id ? { ...entry, title: event.target.value } : entry,
                        ),
                      )
                    }
                    onBlur={(event) => void patch(item.id, { title: event.target.value })}
                  />
                  <input
                    className="input"
                    style={{ fontSize: "0.85rem", padding: "8px 10px" }}
                    value={item.caption}
                    placeholder="Légende"
                    onChange={(event) =>
                      onChanged(
                        media.map((entry) =>
                          entry.id === item.id ? { ...entry, caption: event.target.value } : entry,
                        ),
                      )
                    }
                    onBlur={(event) => void patch(item.id, { caption: event.target.value })}
                  />

                  <div className="btn-row" style={{ gap: "6px" }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => void patch(item.id, { inSlideshow: !item.inSlideshow })}
                    >
                      {item.inSlideshow ? "Dans le diaporama" : "Masqué"}
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => void patch(item.id, { isCover: !item.isCover })}
                    >
                      {item.isCover ? "⭐ Couverture" : "☆ Couverture"}
                    </button>
                  </div>

                  <div className="btn-row" style={{ gap: "6px" }}>
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
                      disabled={index === media.length - 1}
                      aria-label="Descendre"
                    >
                      ↓
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => setPendingDelete(item)}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Supprimer ce souvenir ?"
        message="Le média sera retiré du brouillon. Le fichier est conservé jusqu'à la prochaine publication, pour ne jamais casser le diaporama en ligne."
        confirmLabel="Supprimer"
        danger
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) void remove(pendingDelete);
          setPendingDelete(null);
        }}
      />
    </div>
  );
}
