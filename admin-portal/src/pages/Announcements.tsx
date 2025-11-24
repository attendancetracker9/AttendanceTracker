import React, { useMemo, useState } from "react";
import { useApi } from "../context/ApiContext";
import { Button } from "../components/Button";
import { Input, Select } from "../components/Input";
import { Toggle } from "../components/Toggle";
import { RichTextEditor } from "../components/RichTextEditor";
import { Badge } from "../components/Badge";
import { Modal } from "../components/Modal";
import type { Announcement, AnnouncementChannel, Attachment } from "../types";
import { useToast } from "../context/ToastContext";
import { formatDateTime } from "../utils/formatters";

const channels: AnnouncementChannel[] = ["WhatsApp", "SMS", "In-App"];

type EditorState = {
  title: string;
  html: string;
  plain: string;
  channels: AnnouncementChannel[];
  targetScope: "All" | "Class" | "Section" | "Custom";
  classes: string[];
  sections: string[];
  customRecipients: string[];
  priority: "Normal" | "Urgent";
  schedule: "Now" | "Later";
  scheduleAt?: string;
  attachments: Attachment[];
};

const defaultEditorState: EditorState = {
  title: "",
  html: "",
  plain: "",
  channels: ["WhatsApp"],
  targetScope: "All",
  classes: [],
  sections: [],
  customRecipients: [],
  priority: "Normal",
  schedule: "Now",
  attachments: []
};

const pickStatusTone = (status: Announcement["status"]) => {
  switch (status) {
    case "Pending":
      return "warning";
    case "Approved":
    case "Sent":
      return "success";
    case "Rejected":
      return "danger";
    default:
      return "default";
  }
};

export const Announcements: React.FC = () => {
  const {
    announcements,
    createAnnouncement,
    submitFacultyAnnouncement,
    approveAnnouncement,
    rejectAnnouncement,
    quickSendAnnouncement
  } = useApi();
  const { push } = useToast();
  const [editor, setEditor] = useState<EditorState>(defaultEditorState);
  const [facultyMessage, setFacultyMessage] = useState({ title: "", body: "" });
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [decisionMode, setDecisionMode] = useState<"Approve" | "Reject">("Approve");
  const [decisionReason, setDecisionReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [quickSending, setQuickSending] = useState(false);

  const pendingAnnouncements = useMemo(
    () => announcements.filter((item) => item.status === "Pending"),
    [announcements]
  );

  const grouped = useMemo(() => {
    const groups: Record<Announcement["status"], Announcement[]> = {
      Draft: [],
      Pending: [],
      Approved: [],
      Rejected: [],
      Sent: []
    };
    announcements.forEach((announcement) => {
      groups[announcement.status].push(announcement);
    });
    return groups;
  }, [announcements]);

  const handleAttachment = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    const attachments: Attachment[] = files.map((file) => {
      const type = file.type.includes("pdf") ? "pdf" : file.type.startsWith("image/") ? "image" : "other";
      return {
        id: `${file.name}-${Date.now()}`,
        name: file.name,
        type,
        previewUrl: type === "image" ? URL.createObjectURL(file) : ""
      };
    });
    setEditor((prev) => ({ ...prev, attachments: [...prev.attachments, ...attachments] }));
  };

  const toggleChannel = (channel: AnnouncementChannel) => {
    setEditor((prev) => {
      if (prev.channels.includes(channel)) {
        return { ...prev, channels: prev.channels.filter((item) => item !== channel) };
      }
      return { ...prev, channels: [...prev.channels, channel] };
    });
  };

  const submitAnnouncement = async () => {
    setLoading(true);
    try {
      const announcement = await createAnnouncement({
        title: editor.title || "Untitled Announcement",
        htmlContent: editor.html,
        plainText: editor.plain,
        channels: editor.channels.length ? editor.channels : ["WhatsApp"],
        priority: editor.priority,
        schedule: { type: editor.schedule, datetime: editor.schedule === "Later" ? editor.scheduleAt : undefined },
        target: {
          scope: editor.targetScope,
          classes: editor.classes,
          sections: editor.sections,
          customRecipients: editor.customRecipients
        },
        attachments: editor.attachments,
        status: "Draft"
      });
      push({ status: "success", title: "Announcement drafted", description: announcement.title });
      setEditor(defaultEditorState);
    } catch (error) {
      push({ status: "error", title: "Failed to create", description: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSend = async () => {
    if (!editor.title || !editor.plain) {
      push({ status: "error", title: "Missing information", description: "Please enter a title and message before sending." });
      return;
    }

    setQuickSending(true);
    try {
      const result = await quickSendAnnouncement({
        title: editor.title,
        message: editor.plain,
        targetScope: editor.targetScope,
        classes: editor.classes,
        sections: editor.sections,
        customRecipients: editor.customRecipients
      });
      
      push({
        status: "success",
        title: "Messages sent!",
        description: `Sent to ${result.sentCount} of ${result.totalCount} recipients via SMS.`
      });
      
      // Clear editor after successful send
      setEditor(defaultEditorState);
    } catch (error) {
      push({
        status: "error",
        title: "Failed to send",
        description: (error as Error).message
      });
    } finally {
      setQuickSending(false);
    }
  };

  const submitFaculty = async () => {
    if (!facultyMessage.title || !facultyMessage.body) {
      push({ status: "error", title: "Fill required fields", description: "Faculty title and body required." });
      return;
    }
    setLoading(true);
    try {
      await submitFacultyAnnouncement({
        title: facultyMessage.title,
        htmlContent: `<p>${facultyMessage.body}</p>`,
        plainText: facultyMessage.body,
        channels: ["WhatsApp"],
        target: { scope: "All" },
        schedule: { type: "Now" } // Explicitly set schedule to avoid undefined datetime
      });
      push({ status: "success", title: "Faculty submission queued", description: "Pending admin review." });
      setFacultyMessage({ title: "", body: "" });
    } catch (error) {
      push({ status: "error", title: "Submit failed", description: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const actOnPending = async () => {
    if (!selectedAnnouncement) return;
    setLoading(true);
    try {
      if (decisionMode === "Approve") {
        await approveAnnouncement(selectedAnnouncement.id);
        push({ status: "success", title: "Announcement approved", description: "Delivery triggered." });
      } else {
        await rejectAnnouncement(selectedAnnouncement.id, decisionReason);
        push({ status: "info", title: "Announcement rejected", description: decisionReason });
      }
      setSelectedAnnouncement(null);
      setDecisionReason("");
    } catch (error) {
      push({ status: "error", title: "Action failed", description: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="surface-card grid gap-6 p-6 lg:grid-cols-[2fr_1fr]">
        <div>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">Create Announcement</h2>
              <p className="text-sm text-[rgb(var(--text-muted))]">Rich text, attachments, targets, and channels.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={submitAnnouncement} disabled={loading || quickSending}>
                Save Draft
              </Button>
              <Button variant="primary" onClick={handleQuickSend} disabled={loading || quickSending}>
                {quickSending ? "Sending..." : "Quick Send"}
              </Button>
            </div>
          </div>
          <div className="mt-4 space-y-4">
            <Input
              placeholder="Announcement title"
              value={editor.title}
              onChange={(event) => setEditor((prev) => ({ ...prev, title: event.target.value }))}
            />
            <RichTextEditor
              value={editor.html}
              onChange={(html, plain) => setEditor((prev) => ({ ...prev, html, plain }))}
              placeholder="Compose announcement..."
            />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-[rgb(var(--text-muted))]">Target</p>
                <Select
                  value={editor.targetScope}
                  onChange={(event) =>
                    setEditor((prev) => ({ ...prev, targetScope: event.target.value as EditorState["targetScope"] }))
                  }
                >
                  <option value="All">All students</option>
                  <option value="Class">Class</option>
                  <option value="Section">Section</option>
                  <option value="Custom">Custom</option>
                </Select>
                {editor.targetScope === "Class" && (
                  <Input
                    placeholder="Comma separated classes (e.g. I, II)"
                    onChange={(event) =>
                      setEditor((prev) => ({ ...prev, classes: event.target.value.split(",").map((s) => s.trim()) }))
                    }
                  />
                )}
                {editor.targetScope === "Section" && (
                  <Input
                    placeholder="Section entries (e.g. I-A, II-B)"
                    onChange={(event) =>
                      setEditor((prev) => ({ ...prev, sections: event.target.value.split(",").map((s) => s.trim()) }))
                    }
                  />
                )}
                {editor.targetScope === "Custom" && (
                  <Input
                    placeholder="Custom phone recipients"
                    onChange={(event) =>
                      setEditor((prev) => ({
                        ...prev,
                        customRecipients: event.target.value.split(",").map((s) => s.trim())
                      }))
                    }
                  />
                )}
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-[rgb(var(--text-muted))]">Channels</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {channels.map((channel) => (
                    <button
                      key={channel}
                      type="button"
                      onClick={() => toggleChannel(channel)}
                      className={`focus-ring rounded-2xl border px-3 py-2 text-xs font-semibold transition ${
                        editor.channels.includes(channel)
                          ? "border-primary bg-primary/20 text-primary"
                          : "border-white/5 bg-white/5 text-[rgb(var(--text-muted))]"
                      }`}
                    >
                      {channel}
                    </button>
                  ))}
                </div>
                <div className="mt-4 grid gap-2">
                  <Toggle
                    checked={editor.priority === "Urgent"}
                    onChange={(checked) => setEditor((prev) => ({ ...prev, priority: checked ? "Urgent" : "Normal" }))}
                    label="Urgent priority"
                    description="Marks notifications as high priority."
                  />
                  <div className="space-y-2 rounded-2xl border border-white/5 bg-white/5 p-3">
                    <p className="text-xs font-semibold uppercase text-[rgb(var(--text-muted))]">Schedule</p>
                    <div className="flex items-center gap-3 text-xs">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="schedule"
                          value="Now"
                          checked={editor.schedule === "Now"}
                          onChange={() => setEditor((prev) => ({ ...prev, schedule: "Now" }))}
                        />
                        Send now
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="schedule"
                          value="Later"
                          checked={editor.schedule === "Later"}
                          onChange={() => setEditor((prev) => ({ ...prev, schedule: "Later" }))}
                        />
                        Schedule
                      </label>
                    </div>
                    {editor.schedule === "Later" && (
                      <Input
                        type="datetime-local"
                        onChange={(event) => setEditor((prev) => ({ ...prev, scheduleAt: event.target.value }))}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">Attachments</p>
                  <p className="text-xs text-[rgb(var(--text-muted))]">PDF or images allowed</p>
                </div>
                <label className="focus-ring rounded-2xl border border-white/5 bg-white/10 px-3 py-2 text-xs font-semibold text-[rgb(var(--text-muted))] transition hover:bg-white/20">
                  Add files
                  <input type="file" accept=".pdf,image/*" className="sr-only" multiple onChange={handleAttachment} />
                </label>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                {editor.attachments.map((attachment) => (
                  <div key={attachment.id} className="rounded-2xl border border-white/5 bg-white/10 p-3 text-xs">
                    {attachment.type === "image" ? (
                      <img src={attachment.previewUrl} alt={attachment.name} className="h-24 w-full rounded-xl object-cover" />
                    ) : (
                      <div className="flex h-24 items-center justify-center rounded-xl bg-white/10">PDF</div>
                    )}
                    <p className="mt-2 truncate text-[rgb(var(--text-muted))]">{attachment.name}</p>
                  </div>
                ))}
                {editor.attachments.length === 0 && (
                  <p className="text-xs text-[rgb(var(--text-muted))]">No attachments added.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/5 bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-[rgb(var(--text-primary))]">Faculty Submit (Simulated)</h3>
              <p className="text-xs text-[rgb(var(--text-muted))]">Creates a pending announcement for admin approval.</p>
            </div>
            <Badge tone="info">{pendingAnnouncements.length} pending</Badge>
          </div>
          <div className="mt-4 space-y-3">
            <Input
              placeholder="Faculty title"
              value={facultyMessage.title}
              onChange={(event) => setFacultyMessage((prev) => ({ ...prev, title: event.target.value }))}
            />
            <textarea
              className="focus-ring h-24 w-full rounded-2xl border border-white/5 bg-surface/80 px-4 py-2 text-sm"
              placeholder="Announcement body"
              value={facultyMessage.body}
              onChange={(event) => setFacultyMessage((prev) => ({ ...prev, body: event.target.value }))}
            />
            <Button variant="secondary" onClick={submitFaculty} disabled={loading}>
              Submit for Approval
            </Button>
          </div>
          <div className="mt-6 space-y-3">
            {pendingAnnouncements.map((item) => (
              <button
                type="button"
                key={item.id}
                className="focus-ring w-full rounded-2xl border border-white/5 bg-white/10 p-3 text-left transition hover:border-primary hover:bg-primary/10"
                onClick={() => {
                  setSelectedAnnouncement(item);
                  setDecisionMode("Approve");
                }}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">{item.title}</p>
                  <Badge tone="warning">Pending</Badge>
                </div>
                <p className="mt-1 text-xs text-[rgb(var(--text-muted))] line-clamp-2">{item.plainText}</p>
                <p className="mt-2 text-[10px] uppercase tracking-wide text-[rgb(var(--text-muted))]">
                  {formatDateTime(item.createdAt)} · {item.channels.join(", ")}
                </p>
              </button>
            ))}
            {pendingAnnouncements.length === 0 && (
              <p className="rounded-2xl border border-white/5 bg-white/5 p-4 text-xs text-[rgb(var(--text-muted))]">
                No items pending approval.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="surface-card p-6">
        <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">Announcement History</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {Object.entries(grouped).map(([status, items]) => (
            <div key={status} className="rounded-3xl border border-white/5 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">{status}</p>
                <Badge tone={pickStatusTone(status as Announcement["status"])}>{items.length}</Badge>
              </div>
              <div className="mt-3 space-y-3">
                {items.slice(0, 4).map((item) => (
                  <div key={item.id} className="rounded-2xl border border-white/5 bg-white/10 p-3 text-xs">
                    <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">{item.title}</p>
                    <p className="mt-1 line-clamp-2 text-[rgb(var(--text-muted))]">{item.plainText}</p>
                    <p className="mt-2 text-[10px] uppercase tracking-widest text-[rgb(var(--text-muted))]">
                      {item.channels.join(", ")} · {formatDateTime(item.updatedAt)}
                    </p>
                  </div>
                ))}
                {items.length === 0 && <p className="text-xs text-[rgb(var(--text-muted))]">Nothing yet.</p>}
              </div>
            </div>
          ))}
        </div>
      </section>

      <Modal
        open={Boolean(selectedAnnouncement)}
        onClose={() => setSelectedAnnouncement(null)}
        title={selectedAnnouncement?.title}
        description={`Submitted by ${selectedAnnouncement?.authorName}`}
        actions={
          <>
            <Button variant="secondary" onClick={() => setSelectedAnnouncement(null)}>
              Cancel
            </Button>
            <Button variant={decisionMode === "Approve" ? "primary" : "danger"} onClick={actOnPending} disabled={loading}>
              {decisionMode}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/5 bg-white/5 p-4 text-sm">
            <div dangerouslySetInnerHTML={{ __html: selectedAnnouncement?.htmlContent ?? "" }} />
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[rgb(var(--text-muted))]">
            {selectedAnnouncement?.channels.map((channel) => (
              <Badge key={channel} tone="info">
                {channel}
              </Badge>
            ))}
          </div>
          <div className="rounded-2xl border border-white/5 bg-white/5 p-4 text-xs">
            <p className="font-semibold">Decision</p>
            <div className="mt-2 flex gap-2">
              <Button
                variant={decisionMode === "Approve" ? "primary" : "secondary"}
                onClick={() => setDecisionMode("Approve")}
              >
                Approve
              </Button>
              <Button
                variant={decisionMode === "Reject" ? "danger" : "secondary"}
                onClick={() => setDecisionMode("Reject")}
              >
                Reject
              </Button>
            </div>
            {decisionMode === "Reject" && (
              <textarea
                className="focus-ring mt-3 h-24 w-full rounded-2xl border border-rose-400/40 bg-rose-500/10 p-3 text-sm text-rose-100"
                placeholder="Provide reason"
                value={decisionReason}
                onChange={(event) => setDecisionReason(event.target.value)}
              />
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

