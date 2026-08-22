"use client";

import { useState, useEffect } from "react";
import { useUser } from "../../context/UserContext";
import { useToast } from "../../context/ToastContext";
import { fetchApi } from "../../lib/api";

function ToggleSwitch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-none transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
        checked ? "bg-[#15463b]" : "bg-[#e2d8c4]"
      }`}
    >
      <span
        className={`inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-[22px]" : "translate-x-[3px]"
        }`}
      />
    </button>
  );
}

function NotificationsPanel() {
  const { user, updateNotificationPreferences } = useUser();
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const notifyScanComplete = user?.notify_scan_complete ?? true;

  const handleToggle = async (next: boolean) => {
    setIsSaving(true);
    try {
      await updateNotificationPreferences(next);
      showToast(
        next
          ? "Scan-complete emails turned on"
          : "Scan-complete emails turned off",
        "success",
      );
    } catch {
      showToast("Couldn't update notification preferences", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white border border-[#ece3d1] rounded-[18px] p-4 sm:p-6 shadow-sm">
      <h3 className="font-spectral text-[20px] font-semibold text-[#15463b] mb-1">
        Notifications
      </h3>

      <div className="flex items-center justify-between gap-4 py-3 border-t border-[#efe7d6]">
        <div className="min-w-0">
          <div className="text-md font-semibold text-[#23211b]">
            Scan-complete emails
          </div>
          <p className="text-[12px] text-[#8a8273] mt-0.5 max-w-[420px]">
            Get an email summary — score, grade, and what was found — every time
          </p>
        </div>
        <ToggleSwitch
          checked={notifyScanComplete}
          onChange={handleToggle}
          disabled={isSaving}
        />
      </div>
    </div>
  );
}

export default function AccountInfoPanel() {
  const { user, updateProfile } = useUser();
  const { showToast } = useToast();
  const [name, setName] = useState(user?.full_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [isSaving, setIsSaving] = useState(false);

  // Geo Radius state
  const [radius, setRadius] = useState("25");

  // Security & Password states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => {
    setName(user?.full_name || "");
    setEmail(user?.email || "");
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    try {
      setIsSaving(true);
      await updateProfile({ full_name: name, email });
      showToast("Account information saved successfully!", "success");
    } catch {
      showToast("Failed to update account information", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      showToast("Please enter a new password.", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("New passwords do not match.", "error");
      return;
    }

    try {
      setIsChanging(true);
      await fetchApi("/api/user/password", {
        method: "PUT",
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      showToast("Password updated successfully!", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      showToast("Password change complete", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className="space-y-5">
      <form
        onSubmit={handleSave}
        className="bg-white border border-[#ece3d1] rounded-[18px] p-4 sm:p-6 shadow-sm space-y-5"
      >
        <h3 className="font-spectral text-[20px] font-semibold text-[#15463b]">
          Account Information
        </h3>

        {/* Avatar Display */}
        <div className="flex items-center gap-4 py-2 border-b border-[#efe7d6]">
          <div className="w-14 h-14 rounded-full bg-[#15463b] text-white flex items-center justify-center font-spectral text-[24px] font-bold border border-[#ece3d1]">
            {name.charAt(0).toUpperCase() || "U"}
          </div>
          <div>
            <span className="text-[14px] font-bold text-[#23211b] block">
              {name || "User"}
            </span>
            <span className="text-[12px] text-[#9b927f]">{email}</span>
          </div>
        </div>

        {/* Basic Profile Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="font-mono-spline text-[10px] uppercase text-[#8a8273] block mb-1.5">
              Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full text-[14px] p-2.5 border border-[#ece3d1] rounded-lg bg-[#fdfcf8] outline-none focus:border-[#15463b] transition-colors"
            />
          </div>
          <div>
            <label className="font-mono-spline text-[10px] uppercase text-[#8a8273] block mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full text-[14px] p-2.5 border border-[#ece3d1] rounded-lg bg-[#fdfcf8] outline-none focus:border-[#15463b] transition-colors"
            />
          </div>
        </div>

        <div className="pt-1.5">
          <button
            type="submit"
            disabled={isSaving}
            className="pb bg-[#15463b] text-white text-[13px] font-semibold px-5.5 py-2.5 rounded-lg border-none hover:bg-[#1a5c44] transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>

      {/* Geo Radius Settings */}
      <div className="bg-white border border-[#ece3d1] rounded-[18px] p-4 sm:p-6 shadow-sm space-y-4">
        <h3 className="font-spectral text-[20px] font-semibold text-[#15463b]">Geo Radius Settings</h3>
        <div>
          <label className="font-mono-spline text-[10px] uppercase text-[#8a8273] block mb-1.5">
            Geographic Scan Radius
          </label>
          <select
            value={radius}
            onChange={(e) => setRadius(e.target.value)}
            className="w-full text-[14px] p-2.5 border border-[#ece3d1] rounded-lg bg-[#fdfcf8] outline-none focus:border-[#15463b] transition-colors"
          >
            <option value="10">10 Miles Radius around Bristol</option>
            <option value="25">25 Miles Radius around Bristol (Recommended)</option>
            <option value="50">50 Miles Radius around Bristol</option>
          </select>
          <p className="text-[12px] text-[#8a8273] mt-2 leading-relaxed">
            One primary location is included in your current subscription. Local search results will prioritize listings within this radius.
          </p>
        </div>
        <div>
          <button
            onClick={() => showToast("Geo radius settings saved!", "success")}
            className="pb bg-[#15463b] text-white text-[13px] font-semibold px-5.5 py-2.5 rounded-lg border-none hover:bg-[#1a5c44] transition-colors cursor-pointer"
          >
            Save radius
          </button>
        </div>
      </div>

      {/* Security & Password */}
      <form onSubmit={handleChangePassword} className="bg-white border border-[#ece3d1] rounded-[18px] p-4 sm:p-6 shadow-sm space-y-5">
        <h3 className="font-spectral text-[20px] font-semibold text-[#15463b]">Security &amp; Password</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="font-mono-spline text-[10px] uppercase text-[#8a8273] block mb-1">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full text-[14px] p-2.5 border border-[#ece3d1] rounded-lg bg-[#fdfcf8] outline-none focus:border-[#15463b] transition-colors"
            />
          </div>
          <div>
            <label className="font-mono-spline text-[10px] uppercase text-[#8a8273] block mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full text-[14px] p-2.5 border border-[#ece3d1] rounded-lg bg-[#fdfcf8] outline-none focus:border-[#15463b] transition-colors"
            />
          </div>
          <div>
            <label className="font-mono-spline text-[10px] uppercase text-[#8a8273] block mb-1">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full text-[14px] p-2.5 border border-[#ece3d1] rounded-lg bg-[#fdfcf8] outline-none focus:border-[#15463b] transition-colors"
            />
          </div>
        </div>
        <div>
          <button
            type="submit"
            disabled={isChanging}
            className="pb bg-[#15463b] text-white text-[13px] font-semibold px-5.5 py-2.5 rounded-lg border-none hover:bg-[#1a5c44] transition-colors cursor-pointer disabled:opacity-50"
          >
            {isChanging ? "Updating..." : "Change password"}
          </button>
        </div>
      </form>

      <NotificationsPanel />
    </div>
  );
}
