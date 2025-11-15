import React, { useState } from "react";
import { useApi } from "../context/ApiContext";
import { Input, Textarea } from "../components/Input";
import { Toggle } from "../components/Toggle";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { useToast } from "../context/ToastContext";
import { formatDateTime } from "../utils/formatters";

export const Settings: React.FC = () => {
  const { settings, updateSettings, templates, updateTemplate } = useApi();
  const { push } = useToast();
  const [localSettings, setLocalSettings] = useState(settings);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState<string | null>(null);

  const handleSettingsSave = async () => {
    setSavingSettings(true);
    try {
      await updateSettings(localSettings);
      push({ status: "success", title: "Settings saved", description: "Provider configuration updated." });
    } catch (error) {
      push({ status: "error", title: "Save failed", description: (error as Error).message });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleTemplateSave = async (key: string, content: string) => {
    setSavingTemplate(key);
    try {
      await updateTemplate(key, content);
      push({ status: "success", title: "Template updated", description: `${key} saved.` });
    } catch (error) {
      push({ status: "error", title: "Template failed", description: (error as Error).message });
    } finally {
      setSavingTemplate(null);
    }
  };

  return (
    <div className="space-y-6">
      <section className="surface-card p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">Provider Configuration</h2>
            <p className="text-sm text-[rgb(var(--text-muted))]">Keys loaded from secure storage, editable here for demo.</p>
          </div>
          <Button variant="primary" onClick={handleSettingsSave} disabled={savingSettings}>
            Save Configuration
          </Button>
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-white/5 bg-white/5 p-4">
            <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))]">WhatsApp BSP</h3>
            <div className="mt-3 space-y-3">
              <Input
                placeholder="Provider name"
                value={localSettings.whatsappProvider}
                onChange={(event) => setLocalSettings((prev) => ({ ...prev, whatsappProvider: event.target.value }))}
              />
              <Input
                placeholder="API Key"
                value={localSettings.whatsappApiKey}
                onChange={(event) => setLocalSettings((prev) => ({ ...prev, whatsappApiKey: event.target.value }))}
              />
              <p className="text-xs text-[rgb(var(--text-muted))]">
                Stored using dotenv in production. Provide BSP key for message sends.
              </p>
            </div>
          </div>
          <div className="rounded-3xl border border-white/5 bg-white/5 p-4">
            <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))]">SMS Provider</h3>
            <div className="mt-3 space-y-3">
              <Input
                placeholder="Provider name"
                value={localSettings.smsProvider}
                onChange={(event) => setLocalSettings((prev) => ({ ...prev, smsProvider: event.target.value }))}
              />
              <Input
                placeholder="API Key"
                value={localSettings.smsApiKey}
                onChange={(event) => setLocalSettings((prev) => ({ ...prev, smsApiKey: event.target.value }))}
              />
              <Toggle
                checked={localSettings.enableSmsFallback}
                onChange={(checked) => setLocalSettings((prev) => ({ ...prev, enableSmsFallback: checked }))}
                label="Enable SMS fallback"
                description="Automatically switch to SMS when WhatsApp delivery fails."
              />
            </div>
          </div>
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-white/5 bg-white/5 p-4">
            <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))]">Rate Limit</h3>
            <div className="mt-3 space-y-3">
              <Input
                type="number"
                min={10}
                value={localSettings.rateLimitPerMinute}
                onChange={(event) =>
                  setLocalSettings((prev) => ({ ...prev, rateLimitPerMinute: Number(event.target.value) }))
                }
              />
              <p className="text-xs text-[rgb(var(--text-muted))]">Messages per minute allowed for outbound channels.</p>
            </div>
          </div>
          <div className="rounded-3xl border border-white/5 bg-white/5 p-4">
            <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))]">Opt-out Policy</h3>
            <Toggle
              checked={localSettings.optOutPolicyEnabled}
              onChange={(checked) => setLocalSettings((prev) => ({ ...prev, optOutPolicyEnabled: checked }))}
              label="Enable parent opt-out"
              description="Adds footer copy to messages with opt-out instructions."
            />
            <p className="mt-3 rounded-2xl border border-white/5 bg-white/10 p-3 text-xs text-[rgb(var(--text-muted))]">
              Compliance ready. Students can contact admin to opt back in manually.
            </p>
          </div>
        </div>
      </section>

      <section className="surface-card p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">Template Manager</h2>
            <p className="text-sm text-[rgb(var(--text-muted))]">
              Uses WhatsApp placeholder style ({"{{1}}"}) with student/parent substitution.
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {templates.map((template) => (
            <div key={template.key} className="rounded-3xl border border-white/5 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">{template.name}</p>
                <Badge tone="info">{template.variables.map((variable) => `{{${variable}}}`).join(", ")}</Badge>
              </div>
              <p className="mt-1 text-xs text-[rgb(var(--text-muted))]">{template.description}</p>
              <Textarea
                className="mt-3 h-32"
                defaultValue={template.content}
                onBlur={(event) => handleTemplateSave(template.key, event.target.value)}
                disabled={savingTemplate === template.key}
              />
              <p className="mt-2 text-[10px] uppercase tracking-wide text-[rgb(var(--text-muted))]">
                Last updated {formatDateTime(template.lastUpdated)}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

