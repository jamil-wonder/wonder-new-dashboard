"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { fetchApi } from "../../lib/api";
import { useUser } from "../../context/UserContext";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string;
  created_at: string | null;
  read: boolean;
}

const POLL_MS = 60_000;

function ago(iso: string | null): string {
  if (!iso) return "";
  const seconds = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 1000));
  if (Number.isNaN(seconds)) return "";
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? "yesterday" : `${days} days ago`;
}

// J10: the bell. The badge is the real number of unread notifications (nothing shown at 0),
// the list is the last 10, and opening one marks it read and goes to what it is about.
export default function NotificationBell() {
  const router = useRouter();
  const { isAuthenticated } = useUser();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetchApi<{ items: NotificationItem[]; unread: number }>("/api/notifications");
      setItems(Array.isArray(res.items) ? res.items : []);
      setUnread(typeof res.unread === "number" ? res.unread : 0);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    load();
    const timer = setInterval(load, POLL_MS);
    return () => clearInterval(timer);
  }, [isAuthenticated, load]);

  useEffect(() => {
    if (!open) return;
    load();
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, load]);

  const markRead = async (body: { ids?: string[]; all?: boolean }) => {
    try {
      const res = await fetchApi<{ unread: number }>("/api/notifications/read", { method: "POST", body: JSON.stringify(body) });
      setUnread(typeof res.unread === "number" ? res.unread : 0);
    } catch {
      /* the list is re-read next time it opens */
    }
  };

  const openItem = (item: NotificationItem) => {
    if (!item.read) {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, read: true } : i)));
      setUnread((n) => Math.max(0, n - 1));
      markRead({ ids: [item.id] });
    }
    setOpen(false);
    if (item.link) router.push(item.link);
  };

  const markAll = () => {
    setItems((prev) => prev.map((i) => ({ ...i, read: true })));
    setUnread(0);
    markRead({ all: true });
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        className="relative cursor-pointer text-[#9b927f] hover:text-[#15463b] transition-colors bg-transparent border-none p-0 flex"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="num absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-[#15463b] text-white text-[9.5px] font-medium flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="region"
          aria-label="Notifications"
          className="absolute right-0 top-full mt-3 w-[320px] max-w-[calc(100vw-32px)] bg-white border border-[#ece3d1] rounded-xl shadow-[0_12px_32px_rgba(21,70,59,0.16)] z-[60] overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#efe7d6] bg-[#fdfcf8]">
            <span className="font-spectral text-[15px] font-semibold text-[#15463b]">Notifications</span>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAll}
                className="text-[11.5px] font-semibold text-[#15463b] hover:underline cursor-pointer bg-transparent border-none p-0"
              >
                Mark all as read
              </button>
            )}
          </div>

          {failed && items.length === 0 ? (
            <p role="alert" className="px-4 py-6 text-center text-[12.5px] text-[#b1442a]">
              We couldn&apos;t load your notifications.{" "}
              <button type="button" onClick={load} className="underline cursor-pointer bg-transparent border-none p-0 font-semibold">
                Try again
              </button>
            </p>
          ) : items.length === 0 ? (
            <p className="px-4 py-6 text-center text-[12.5px] text-[#8a8273]">
              Nothing yet. You&apos;ll see finished scans, score changes, competitor moves and new articles here.
            </p>
          ) : (
            <ul className="max-h-[360px] overflow-y-auto divide-y divide-[#f1eadf]">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => openItem(item)}
                    className={`w-full text-left px-4 py-3 flex gap-2.5 cursor-pointer border-none transition-colors hover:bg-[#f6f3ec] ${item.read ? "bg-white" : "bg-[#f4f9f6]"}`}
                  >
                    <span
                      aria-hidden="true"
                      className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${item.read ? "bg-transparent" : "bg-[#1e7d4f]"}`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className={`block text-[13px] leading-snug text-[#23211b] ${item.read ? "font-medium" : "font-bold"}`}>
                        {item.title}
                        {!item.read && <span className="sr-only"> (unread)</span>}
                      </span>
                      <span className="block text-[12px] text-[#6f6757] leading-snug mt-0.5">{item.body}</span>
                      <span className="block text-[10.5px] text-[#9b927f] mt-1">{ago(item.created_at)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
