import React, { useEffect, useRef } from "react";
import { clsx } from "clsx";

type RichTextEditorProps = {
  value: string;
  onChange: (html: string, plain: string) => void;
  placeholder?: string;
};

const ToolbarButton: React.FC<{ label: string; command: string; glyph: string }> = ({ label, command, glyph }) => (
  <button
    type="button"
    onMouseDown={(event) => {
      event.preventDefault();
      document.execCommand(command);
    }}
    className="focus-ring rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-xs font-semibold text-[rgb(var(--text-muted))] transition hover:bg-white/10"
    aria-label={label}
  >
    {glyph}
  </button>
);

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder }) => {
  const ref = useRef<HTMLDivElement>(null);

  // Keep DOM in sync when parent supplies a new value (e.g., reset form),
  // without overwriting user selection on every keystroke.
  useEffect(() => {
    if (!ref.current) return;
    if (ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || "";
    }
  }, [value]);

  return (
    <div className="rounded-3xl border border-white/5 bg-surface/80 p-4">
      <div className="flex items-center gap-2">
        <ToolbarButton label="Bold" command="bold" glyph="B" />
        <ToolbarButton label="Italic" command="italic" glyph="I" />
        <ToolbarButton label="Bullets" command="insertUnorderedList" glyph="•" />
      </div>
      <div
        ref={ref}
        className={clsx(
          "focus-ring mt-3 min-h-[160px] rounded-2xl border border-white/5 bg-[rgb(var(--bg-elevated))] px-4 py-3 text-sm leading-relaxed text-[rgb(var(--text-primary))]",
          !value && "before:text-[rgb(var(--text-muted))] before:content-[attr(data-placeholder)]"
        )}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        data-placeholder={placeholder}
        onInput={() => {
          const html = ref.current?.innerHTML ?? "";
          const plain = ref.current?.innerText ?? "";
          onChange(html, plain);
        }}
      />
    </div>
  );
};

