// ============================================================
// src/context/NotificationContext.jsx
// Manages real-time in-app notifications from WebSocket.
// Wrap around <AppProvider> in main.jsx or App.jsx.
// ============================================================

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useWebSocket } from "../hooks/useWebSocket";

const NotificationContext = createContext();

const EVENT_LABELS = {
  job_raised:       { title: "New Job Raised",           color: "blue"    },
  job_status:       { title: "Job Status Updated",       color: "amber"   },
  report_submitted: { title: "Report Submitted",         color: "gray"    },
  report_reviewed:  { title: "Report Reviewed",          color: "emerald" },
  amc_expiring:     { title: "AMC Renewal Reminder",     color: "orange"  },
  notification:     { title: "Notification",             color: "blue"    },
};

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);

  const addNotification = useCallback((msg) => {
    const meta = EVENT_LABELS[msg.event] || EVENT_LABELS.notification;
    const item = {
      id:        Date.now() + Math.random(),
      event:     msg.event,
      title:     meta.title,
      color:     meta.color,
      message:   msg.data?.message || formatEventMessage(msg),
      data:      msg.data,
      ts:        msg.ts || new Date().toISOString(),
      read:      false,
    };
    setNotifications(p => [item, ...p].slice(0, 50)); // keep last 50
    setUnreadCount(p => p + 1);
  }, []);

  const handleWsEvent = useCallback((msg) => {
    // Only create notifications for meaningful events
    if (EVENT_LABELS[msg.event]) {
      addNotification(msg);
    }
  }, [addNotification]);

  const { connected } = useWebSocket({ onEvent: handleWsEvent });

  const markAllRead = useCallback(() => {
    setNotifications(p => p.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const markRead = useCallback((id) => {
    setNotifications(p => p.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(p => Math.max(0, p - 1));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      connected,
      markAllRead,
      markRead,
      clearAll,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);

// ── Format a human-readable message from WS event data ───────
function formatEventMessage(msg) {
  const d = msg.data || {};
  switch (msg.event) {
    case "job_raised":
      return `${d.id || "A new job"} — ${d.title || "was raised"}`;
    case "job_status":
      return `${d.id || "Job"} moved to ${d.status || "new status"}`;
    case "report_submitted":
      return `${d.id || "A report"} submitted for review`;
    case "report_reviewed":
      return `${d.id || "Report"} was ${d.status?.toLowerCase() || "reviewed"}`;
    case "amc_expiring":
      return `${d.title || "An AMC"} is expiring in ${d.days_left || "?"} days`;
    default:
      return d.message || "New notification";
  }
}
