import React, { useMemo, useState } from "react";
import { useApi } from "../context/ApiContext";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { Input, Select } from "../components/Input";
import { useToast } from "../context/ToastContext";
import { formatDateTime } from "../utils/formatters";
import type { NotificationLog } from "../types";

const statusTone: Record<NotificationLog["status"], "info" | "success" | "warning" | "danger"> = {
  queued: "info",
  sent: "info",
  delivered: "success",
  failed: "danger"
};

export const Notifications: React.FC = () => {
  const { notifications, bulkResend, resendNotification } = useApi();
  const { push } = useToast();
  const [statusFilter, setStatusFilter] = useState<NotificationLog["status"] | "All">("All");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  const filtered = useMemo(() => {
    return notifications.filter((notification) => {
      const matchesStatus = statusFilter === "All" || notification.status === statusFilter;
      const matchesSearch =
        search.length === 0 ||
        notification.studentName.toLowerCase().includes(search.toLowerCase()) ||
        notification.parentPhone.includes(search);
      return matchesStatus && matchesSearch;
    });
  }, [notifications, statusFilter, search]);

  const toggleSelected = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const handleBulkResend = async () => {
    if (!selected.length) {
      push({ status: "info", title: "Select rows", description: "Choose failed notifications to resend." });
      return;
    }
    setBulkLoading(true);
    try {
      await bulkResend(selected);
      push({ status: "success", title: "Bulk resend triggered", description: `${selected.length} notifications retried.` });
      setSelected([]);
    } catch (error) {
      push({ status: "error", title: "Bulk resend failed", description: (error as Error).message });
    } finally {
      setBulkLoading(false);
    }
  };

  const handleResend = async (id: string) => {
    setProcessingId(id);
    try {
      await resendNotification(id);
      push({ status: "success", title: "Notification resent", description: "Delivery workflow restarted." });
    } catch (error) {
      push({ status: "error", title: "Resend failed", description: (error as Error).message });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <section className="surface-card p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">Notification Delivery Log</h2>
            <p className="text-sm text-[rgb(var(--text-muted))]">Track WhatsApp, SMS, and in-app sends.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as NotificationLog["status"] | "All")}>
              <option value="All">All statuses</option>
              <option value="queued">Queued</option>
              <option value="sent">Sent</option>
              <option value="delivered">Delivered</option>
              <option value="failed">Failed</option>
            </Select>
            <Input placeholder="Search student or phone" value={search} onChange={(event) => setSearch(event.target.value)} />
            <Button variant="secondary" onClick={handleBulkResend} disabled={bulkLoading}>
              Bulk Resend Failed
            </Button>
          </div>
        </div>
        <div className="mt-6 overflow-x-auto rounded-2xl border border-white/5">
          <table className="min-w-full divide-y divide-white/5 text-sm">
            <thead className="bg-white/5">
              <tr>
                <th className="px-4 py-2">
                  <input
                    type="checkbox"
                    aria-label="Select all"
                    checked={selected.length > 0 && selected.length === filtered.length}
                    onChange={(event) => setSelected(event.target.checked ? filtered.map((item) => item.id) : [])}
                  />
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-[rgb(var(--text-muted))]">Timestamp</th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-[rgb(var(--text-muted))]">Student</th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-[rgb(var(--text-muted))]">Phone</th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-[rgb(var(--text-muted))]">Channel</th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-[rgb(var(--text-muted))]">Provider</th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-[rgb(var(--text-muted))]">Status</th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-[rgb(var(--text-muted))]">Attempts</th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-[rgb(var(--text-muted))]">Error</th>
                <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-[rgb(var(--text-muted))]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((notification) => (
                <tr key={notification.id} className="transition hover:bg-white/5">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(notification.id)}
                      onChange={() => toggleSelected(notification.id)}
                      aria-label={`Select ${notification.studentName}`}
                    />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-[rgb(var(--text-muted))]">{formatDateTime(notification.timestamp)}</td>
                  <td className="px-4 py-3">{notification.studentName}</td>
                  <td className="px-4 py-3 text-xs text-[rgb(var(--text-muted))]">{notification.parentPhone}</td>
                  <td className="px-4 py-3">{notification.channel}</td>
                  <td className="px-4 py-3 text-xs text-[rgb(var(--text-muted))]">{notification.provider}</td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone[notification.status]}>{notification.status.toUpperCase()}</Badge>
                  </td>
                  <td className="px-4 py-3 text-center">{notification.attempts}</td>
                  <td className="px-4 py-3 text-xs text-rose-200">{notification.errorText ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      onClick={() => handleResend(notification.id)}
                      disabled={processingId === notification.id}
                    >
                      Resend
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

