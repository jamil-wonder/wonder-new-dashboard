"use client";

import { useState, useEffect } from "react";
import { Search, ShieldCheck, ShieldOff, Trash2, MoreVertical, CheckCircle2, XCircle, Mail } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import { fetchApi } from "../../lib/api";
import type { AdminUser } from "../../lib/adminTypes";
import AdminPagination from "./AdminPagination";
import { AdminSectionLoader } from "./AdminPageLoader";

const PAGE_SIZE = 10;

function RoleBadge({ role }: { role: string }) {
  return role === "admin" ? (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#15463b] bg-[#eef3f0] border border-[#d0e4d6] px-2 py-0.5 rounded-full">
      Admin
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#6f6757] bg-[#f6f3ec] border border-[#ece3d1] px-2 py-0.5 rounded-full">
      User
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  return status === "banned" ? (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#b1442a] bg-[#fdf2f0] border border-[#f6dcd5] px-2 py-0.5 rounded-full">
      Banned
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1e7d4f] bg-[#edf8f1] border border-[#ccebd8] px-2 py-0.5 rounded-full">
      Active
    </span>
  );
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}

export default function AdminUsersPanel() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const res = await fetchApi<{ users: AdminUser[]; pagination: { total: number; total_pages: number } }>(
          `/api/admin/users?page=${page}&page_size=${PAGE_SIZE}&q=${encodeURIComponent(search)}&role=${roleFilter}&status=${statusFilter}`
        );
        if (res?.users) {
          setUsers(res.users);
          setTotalCount(res.pagination?.total || 0);
        }
      } catch (err) {
        console.error("Failed to load users:", err);
        showToast("Failed to load users", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [page, search, roleFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const resetToPage1 = () => setPage(1);

  const handleRoleToggle = async (user: AdminUser) => {
    const nextRole = user.role === "admin" ? "user" : "admin";
    try {
      await fetchApi(`/api/admin/users/${user.id}/role`, {
        method: "PUT",
        body: JSON.stringify({ role: nextRole }),
      });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role: nextRole } : u)));
      showToast(`${user.name} is now ${nextRole === "admin" ? "an admin" : "a regular user"}.`, "success");
    } catch (err) {
      showToast("Failed to update role", "error");
    }
    setOpenMenuId(null);
  };

  const handleStatusToggle = async (user: AdminUser) => {
    const nextStatus = user.status === "banned" ? "active" : "banned";
    try {
      await fetchApi(`/api/admin/users/${user.id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: nextStatus }),
      });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, status: nextStatus } : u)));
      showToast(nextStatus === "banned" ? `${user.name} has been banned.` : `${user.name} has been reactivated.`, nextStatus === "banned" ? "info" : "success");
    } catch (err) {
      showToast("Failed to update status", "error");
    }
    setOpenMenuId(null);
  };

  const handleDelete = async (user: AdminUser) => {
    if (!window.confirm(`Delete ${user.name}'s account permanently? This also removes their saved businesses.`)) return;
    try {
      await fetchApi(`/api/admin/users/${user.id}`, { method: "DELETE" });
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      showToast(`${user.name}'s account was deleted.`, "info");
    } catch (err) {
      showToast("Failed to delete user", "error");
    }
    setOpenMenuId(null);
  };

  if (loading) {
    return <AdminSectionLoader label="Loading users..." />;
  }

  return (
    <div className="bg-white border border-[#ece3d1] rounded-[22px] p-6 shadow-xs">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9b927f]" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              resetToPage1();
            }}
            placeholder="Search by name or email..."
            className="w-full text-[13.5px] pl-10 pr-4 py-2.5 border border-[#ece3d1] rounded-xl bg-[#fdfcf8] outline-none focus:border-[#15463b] transition-colors"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            resetToPage1();
          }}
          className="text-[13px] font-medium px-3.5 py-2.5 border border-[#ece3d1] rounded-xl bg-[#fdfcf8] outline-none cursor-pointer"
        >
          <option value="">All roles</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            resetToPage1();
          }}
          className="text-[13px] font-medium px-3.5 py-2.5 border border-[#ece3d1] rounded-xl bg-[#fdfcf8] outline-none cursor-pointer"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="banned">Banned</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto -mx-2">
        <table className="w-full text-[13px] min-w-[860px]">
          <thead>
            <tr className="text-left border-b border-[#efe7d6]">
              <th className="px-2 py-2.5 font-mono-spline text-[10px] uppercase tracking-wider text-[#9b927f] font-semibold">User</th>
              <th className="px-2 py-2.5 font-mono-spline text-[10px] uppercase tracking-wider text-[#9b927f] font-semibold">Email</th>
              <th className="px-2 py-2.5 font-mono-spline text-[10px] uppercase tracking-wider text-[#9b927f] font-semibold">Role</th>
              <th className="px-2 py-2.5 font-mono-spline text-[10px] uppercase tracking-wider text-[#9b927f] font-semibold">Status</th>
              <th className="px-2 py-2.5 font-mono-spline text-[10px] uppercase tracking-wider text-[#9b927f] font-semibold">Verified</th>
              <th className="px-2 py-2.5 font-mono-spline text-[10px] uppercase tracking-wider text-[#9b927f] font-semibold">Businesses</th>
              <th className="px-2 py-2.5 font-mono-spline text-[10px] uppercase tracking-wider text-[#9b927f] font-semibold">Joined</th>
              <th className="px-2 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-[#f4efe4] hover:bg-[#fdfcf8] transition-colors">
                <td className="px-2 py-3">
                  <div className="font-semibold text-[#23211b]">{u.name}</div>
                </td>
                <td className="px-2 py-3">
                  <div className="flex items-center gap-1.5 text-[12.5px] text-[#6f6757]">
                    <Mail className="w-3.5 h-3.5 shrink-0 text-[#9b927f]" />
                    <span className="truncate max-w-[190px]">{u.email}</span>
                  </div>
                </td>
                <td className="px-2 py-3">
                  <RoleBadge role={u.role} />
                </td>
                <td className="px-2 py-3">
                  <StatusBadge status={u.status} />
                </td>
                <td className="px-2 py-3">
                  {u.email_verified ? (
                    <CheckCircle2 className="w-4 h-4 text-[#1e7d4f]" />
                  ) : (
                    <XCircle className="w-4 h-4 text-[#c2b69c]" />
                  )}
                </td>
                <td className="px-2 py-3 num text-[#3a352b] font-medium">{u.businesses_count}</td>
                <td className="px-2 py-3 text-[#6f6757]">{formatDate(u.created_at)}</td>
                <td className="px-2 py-3 relative">
                  <button
                    onClick={() => setOpenMenuId(openMenuId === u.id ? null : u.id)}
                    className="p-1.5 text-[#8a8273] hover:text-[#15463b] hover:bg-[#f5f0e6] rounded-lg transition-colors cursor-pointer border-none"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {openMenuId === u.id && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                      <div className="absolute right-2 top-9 z-20 w-52 bg-white border border-[#ece3d1] rounded-xl shadow-lg py-1.5">
                        <button
                          onClick={() => handleRoleToggle(u)}
                          className="w-full flex items-center gap-2 px-3.5 py-2 text-[12.5px] font-medium text-[#3a352b] hover:bg-[#f6f3ec] cursor-pointer border-none bg-transparent text-left"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          {u.role === "admin" ? "Remove admin access" : "Make admin"}
                        </button>
                        <button
                          onClick={() => handleStatusToggle(u)}
                          className="w-full flex items-center gap-2 px-3.5 py-2 text-[12.5px] font-medium text-[#3a352b] hover:bg-[#f6f3ec] cursor-pointer border-none bg-transparent text-left"
                        >
                          <ShieldOff className="w-3.5 h-3.5" />
                          {u.status === "banned" ? "Reactivate account" : "Ban account"}
                        </button>
                        <div className="h-px bg-[#efe7d6] my-1" />
                        <button
                          onClick={() => handleDelete(u)}
                          className="w-full flex items-center gap-2 px-3.5 py-2 text-[12.5px] font-medium text-[#b1442a] hover:bg-[#fdf2f0] cursor-pointer border-none bg-transparent text-left"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete account
                        </button>
                      </div>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={8} className="px-2 py-10 text-center text-[13px] text-[#8a8273]">
                  No users match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AdminPagination page={safePage} totalPages={totalPages} total={totalCount} pageSize={PAGE_SIZE} onPageChange={setPage} />
    </div>
  );
}
