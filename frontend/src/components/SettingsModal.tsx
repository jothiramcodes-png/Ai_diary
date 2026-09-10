import React, { useState } from "react";
import { X, Shield, Download, Trash2, Check, AlertTriangle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const { user, refreshUser, logout } = useAuth();
  const [preferences, setPreferences] = useState({
    routine_learning: user?.preferences?.routine_learning ?? true,
    location_analysis: user?.preferences?.location_analysis ?? true,
    photo_analysis: user?.preferences?.photo_analysis ?? true,
    ai_personalization: user?.preferences?.ai_personalization ?? true,
    morning_briefing: user?.preferences?.morning_briefing ?? true,
  });
  const [saved, setSaved] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const togglePref = async (key: keyof typeof preferences) => {
    const updated = { ...preferences, [key]: !preferences[key] };
    setPreferences(updated);
    try {
      await api.updateMe({ preferences: updated });
      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const data = await api.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lifebook_export_${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed", err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await api.deleteAccount();
      logout();
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-[#fbf7ee] border-2 border-[#cbb79a] rounded-2xl p-6 w-full max-w-lg shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#8a6e50] hover:text-[#3d2714] p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-[#ebdcc4] text-[#543820]">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#3d2817] font-serif-title">
              Privacy & Preferences
            </h3>
            <p className="text-xs text-[#7d654c]">
              You have complete ownership of your diary and AI processing controls.
            </p>
          </div>
        </div>

        {saved && (
          <div className="mb-4 p-2 rounded-lg bg-emerald-100 border border-emerald-300 text-xs text-emerald-800 flex items-center gap-1">
            <Check className="w-4 h-4" /> Preferences updated successfully!
          </div>
        )}

        {/* Privacy Toggles */}
        <div className="space-y-3 mb-6 bg-[#f5ecda] p-4 rounded-xl border border-[#d8c5aa]">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#705439] mb-2">
            AI & Memory Controls
          </h4>

          {[
            { key: "routine_learning", label: "Routine & Pattern Learning", desc: "Detect recurring habits and ask neutral check-ins when deviated" },
            { key: "location_analysis", label: "Location & Travel Context", desc: "Extract visited cities and suppress false routine alerts during trips" },
            { key: "photo_analysis", label: "Photo & Vision Intelligence", desc: "Analyze uploaded memories for places, scenes, and items" },
            { key: "ai_personalization", label: "AI Memory Personalization", desc: "Tailor diary draft tone and highlight relevant past connections" },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between py-1.5 border-b border-[#e5d5be] last:border-b-0">
              <div className="pr-4">
                <p className="text-xs font-semibold text-[#3d2714]">{item.label}</p>
                <p className="text-[11px] text-[#7d654c]">{item.desc}</p>
              </div>
              <button
                onClick={() => togglePref(item.key as keyof typeof preferences)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  preferences[item.key as keyof typeof preferences] ? "bg-emerald-700 justify-end" : "bg-zinc-400 justify-start"
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-md" />
              </button>
            </div>
          ))}
        </div>

        {/* Data Ownership & Export */}
        <div className="space-y-3 border-t border-[#e2d2ba] pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#3d2714]">Export All Memories</p>
              <p className="text-[11px] text-[#7d654c]">Download a complete JSON export of your diary, commitments, and graph.</p>
            </div>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#eadecb] hover:bg-[#dfcbb2] text-[#543820] transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? "Exporting..." : "Export JSON"}</span>
            </button>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="text-xs font-semibold text-red-700">Delete Account & Data</p>
              <p className="text-[11px] text-[#7d654c]">Permanently erase your diary entries, recordings, and graph.</p>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-100 hover:bg-red-200 text-red-800 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* Confirmation Sub-modal */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-[#fbf7ee] p-6 rounded-2xl flex flex-col justify-center items-center text-center z-20">
            <AlertTriangle className="w-12 h-12 text-red-600 mb-2" />
            <h4 className="text-sm font-bold text-red-900 mb-1">Permanently Delete Account?</h4>
            <p className="text-xs text-[#705439] mb-4 max-w-xs">
              This action cannot be undone. All your audio recordings, diary stories, and memories will be immediately destroyed.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#543820] bg-[#eadecb]"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-700 hover:bg-red-800 shadow-md"
              >
                Yes, Delete Everything
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
