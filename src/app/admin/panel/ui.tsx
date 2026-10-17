"use client";

import { useEffect, useRef } from "react";

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  hint?: string;
}) {
  return (
    <label className="field">
      <span className="label">{label}</span>
      <input
        className="input"
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
      {hint ? (
        <span className="muted" style={{ fontSize: "0.76rem" }}>
          {hint}
        </span>
      ) : null}
    </label>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  rows = 6,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  hint?: string;
}) {
  const ref = useRef<HTMLTextAreaElement | null>(null);

  // Keep the textarea tall enough for its content.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, rows * 24)}px`;
  }, [value, rows]);

  return (
    <label className="field">
      <span className="label">{label}</span>
      <textarea
        ref={ref}
        className="textarea"
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
      {hint ? (
        <span className="muted" style={{ fontSize: "0.76rem" }}>
          {hint}
        </span>
      ) : null}
    </label>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirmer",
  danger = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal stack">
        <h3 className="display" style={{ fontSize: "1.5rem" }}>
          {title}
        </h3>
        <p className="muted" style={{ fontSize: "0.92rem" }}>
          {message}
        </p>
        <div className="btn-row" style={{ justifyContent: "flex-end" }}>
          <button className="btn btn-ghost" onClick={onCancel}>
            Annuler
          </button>
          <button className={danger ? "btn btn-danger" : "btn"} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Toast({ message, kind }: { message: string; kind: "ok" | "err" }) {
  return (
    <div className={`toast ${kind === "ok" ? "toast-ok" : "toast-err"}`} role="status">
      {message}
    </div>
  );
}

export function SectionCard({
  title,
  description,
  children,
  actions,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <section className="panel stack" style={{ gap: "14px" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "12px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div>
          <h3 className="display" style={{ fontSize: "1.35rem" }}>
            {title}
          </h3>
          {description ? (
            <p className="muted" style={{ fontSize: "0.84rem" }}>
              {description}
            </p>
          ) : null}
        </div>
        {actions}
      </header>
      {children}
    </section>
  );
}
