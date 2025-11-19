import React, { useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { BellIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from "@heroicons/react/24/outline";
import { useApi } from "../context/ApiContext";
import { formatRelative } from "../utils/formatters";
import type { NotificationLog } from "../types";

type NotificationDropdownProps = {
  open: boolean;
  onClose: () => void;
};

const statusIcons: Record<NotificationLog["status"], React.ReactNode> = {
  queued: <ClockIcon className="h-4 w-4 text-blue-400" />,
  sent: <ClockIcon className="h-4 w-4 text-yellow-400" />,
  delivered: <CheckCircleIcon className="h-4 w-4 text-emerald-400" />,
  failed: <XCircleIcon className="h-4 w-4 text-rose-400" />
};

const statusColors: Record<NotificationLog["status"], string> = {
  queued: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  sent: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  delivered: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  failed: "bg-rose-500/10 text-rose-400 border-rose-500/20"
};

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ open, onClose }) => {
  const { notifications } = useApi();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get latest 10 notifications
  const recentNotifications = useMemo(() => {
    return notifications.slice(0, 10);
  }, [notifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="absolute right-0 top-full mt-2 w-96 rounded-2xl border border-white/10 bg-[rgb(var(--bg-elevated))] shadow-lg backdrop-blur-sm z-50"
        >
          <div className="p-4 border-b border-white/5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))]">Notifications</h3>
              <span className="text-xs text-[rgb(var(--text-muted))]">
                {notifications.length} total
              </span>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {recentNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <BellIcon className="h-12 w-12 mx-auto text-[rgb(var(--text-muted))]/50 mb-3" />
                <p className="text-sm text-[rgb(var(--text-muted))]">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {recentNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="p-4 hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 p-2 rounded-lg border ${statusColors[notification.status]}`}>
                        {statusIcons[notification.status]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-sm font-medium text-[rgb(var(--text-primary))] truncate">
                            {notification.studentName}
                          </p>
                          <span className="text-xs text-[rgb(var(--text-muted))] whitespace-nowrap">
                            {formatRelative(notification.timestamp)}
                          </span>
                        </div>
                        <p className="text-xs text-[rgb(var(--text-muted))] mb-2">
                          {notification.channel} • {notification.provider}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[notification.status]}`}>
                            {notification.status.toUpperCase()}
                          </span>
                          {notification.errorText && (
                            <span className="text-xs text-rose-400 truncate" title={notification.errorText}>
                              {notification.errorText}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {recentNotifications.length > 0 && (
            <div className="p-3 border-t border-white/5">
              <button
                onClick={() => {
                  navigate("/notifications");
                  onClose();
                }}
                className="w-full text-xs text-center text-[rgb(var(--text-primary))] hover:text-[rgb(var(--text-primary))]/80 transition-colors py-2"
              >
                View all notifications →
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

