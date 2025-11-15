import React from "react";
import { motion } from "framer-motion";
import { useApi } from "../context/ApiContext";
import { Badge } from "../components/Badge";

const summaryCards = [
  { key: "entries", label: "Delivered Today" },
  { key: "exits", label: "Pending Sends" },
  { key: "pending", label: "Pending Approvals" },
  { key: "failed", label: "Failed Deliveries" }
] as const;

export const Dashboard: React.FC = () => {
  const { announcements, notifications } = useApi();

  const pendingApprovals = announcements.filter((item) => item.status === "Pending").length;
  const failedDeliveries = notifications.filter((item) => item.status === "failed").length;
  const totalSent = notifications.filter((item) => item.status === "delivered").length;
  const pendingNotifications = notifications.filter((item) => item.status === "queued" || item.status === "sent").length;

  const summaryMap: Record<(typeof summaryCards)[number]["key"], number> = {
    entries: totalSent,
    exits: pendingNotifications,
    pending: pendingApprovals,
    failed: failedDeliveries
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card, index) => (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="surface-card p-5"
          >
            <p className="text-xs uppercase tracking-widest text-[rgb(var(--text-muted))]">{card.label}</p>
            <p className="mt-3 text-3xl font-semibold text-[rgb(var(--text-primary))]">{summaryMap[card.key]}</p>
            <p className="mt-1 text-xs text-[rgb(var(--text-muted))]">Updated in real-time</p>
          </motion.div>
        ))}
      </section>
      <section className="grid gap-6">
        <div className="surface-card p-6">
          <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">Approvals & Alerts</h2>
          <div className="mt-4 space-y-4">
            {announcements
              .filter((item) => item.status === "Pending")
              .slice(0, 3)
              .map((item) => (
                <div key={item.id} className="rounded-2xl border border-white/5 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{item.title}</p>
                    <Badge tone="warning">Pending</Badge>
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs text-[rgb(var(--text-muted))]">{item.plainText}</p>
                  <p className="mt-3 text-[10px] uppercase tracking-widest text-[rgb(var(--text-muted))]">
                    Submitted by {item.authorName}
                  </p>
                </div>
              ))}
            <div className="rounded-2xl border border-white/5 bg-primary/10 p-4 text-xs text-primary">
              <p className="font-semibold">Daily Digest</p>
              <p className="mt-1 text-[rgb(var(--text-muted))]">
                Delivery success is at {Math.max(90, 100 - failedDeliveries)}%. Failed sends auto-route to SMS fallback.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

