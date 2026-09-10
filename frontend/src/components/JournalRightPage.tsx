import React from "react";
import {
  Search,
  Bell,
  Calendar,
  Utensils
} from "lucide-react";
import { Commitment, Routine, NotificationItem, User } from "../types";

interface JournalRightPageProps {
  user: User | null;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  pendingCommitments: Commitment[];
  onMarkDone: (id: string) => void;
  onViewAllCommitments: () => void;
  onViewAllRoutines: () => void;
  notifications: NotificationItem[];
  showNotifications: boolean;
  onToggleNotifications: () => void;
  selectedMood: string;
  onSelectMood: (m: string) => void;
  onOpenPhotos?: () => void;
}

export const JournalRightPage: React.FC<JournalRightPageProps> = ({
  user,
  searchQuery,
  onSearchChange,
  pendingCommitments,
  onMarkDone,
  onViewAllCommitments,
  onViewAllRoutines,
  notifications,
  showNotifications,
  onToggleNotifications,
  selectedMood,
  onSelectMood,
  onOpenPhotos,
}) => {
  return (
    <section className="flex-1 p-6 md:p-8 lg:p-10 space-y-6 overflow-y-auto">
      {/* Top Search Bar & Header Icons */}
      <div className="flex items-center justify-between gap-3 border-b border-[#ebdcc4] pb-4">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-[#9f856c] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search your memories..."
            className="w-full pl-9 pr-4 py-2 bg-white/80 border border-[#dfd0ba] rounded-full text-xs text-[#352010] placeholder-[#9f856c] focus:outline-none focus:border-[#7d5635] shadow-2xs"
          />
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={onToggleNotifications}
            className="p-2 rounded-full hover:bg-[#ede0cb] text-[#6b492b] transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-600 rounded-full" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-10 w-72 bg-white rounded-xl shadow-xl border border-[#d5c2a7] p-3 z-30 space-y-2">
              <h4 className="text-xs font-bold text-[#352010]">Notifications</h4>
              {notifications.map((n) => (
                <div key={n.id} className="text-xs p-2 rounded bg-amber-50/60 border border-amber-100">
                  <p className="font-semibold text-amber-900">{n.title}</p>
                  <p className="text-[11px] text-[#5e442d]">{n.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User Avatar */}
        <div className="w-9 h-9 rounded-full bg-[#523019] text-amber-200 border-2 border-amber-400/40 flex items-center justify-center font-bold text-xs shadow-md">
          {user?.full_name ? user.full_name[0] : "A"}
        </div>
      </div>

      {/* Things that need your attention (Commitments) */}
      <div className="bg-[#fbf7ee] border border-[#dfd0ba] rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3 border-b border-[#ede1ce] pb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#8a6849]">
              Things that need your attention
            </h3>
            <span className="px-1.5 py-0.2 bg-red-600 text-white rounded-full text-[10px] font-bold">
              {pendingCommitments.length}
            </span>
          </div>
          <button
            onClick={onViewAllCommitments}
            className="text-xs font-semibold text-[#8a6849] hover:text-[#352010]"
          >
            View all →
          </button>
        </div>

        <div className="space-y-3">
          {pendingCommitments.map((comm) => (
            <div
              key={comm.id}
              className="p-3 rounded-xl bg-[#f5ecda]/90 border border-[#e2d2ba] flex items-center justify-between gap-2 transition-all hover:bg-[#ede0cb]"
            >
              <div className="pr-2">
                <p className="text-xs font-bold text-[#352010]">{comm.description}</p>
                <p className="text-[11px] text-[#705439]">{comm.project || "Personal"}</p>
                <div className="flex items-center gap-1 text-[10px] text-red-700 font-semibold mt-1">
                  <Calendar className="w-3 h-3 text-red-600" />
                  <span>{comm.due_date || "Upcoming"}</span>
                </div>
              </div>

              <button
                onClick={() => onMarkDone(comm.id)}
                className="px-3 py-1.5 rounded-lg bg-white hover:bg-emerald-50 text-emerald-800 text-xs font-bold border border-[#d5c2a7] shadow-2xs shrink-0 transition-colors"
              >
                Mark Done
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Your Routines */}
      <div className="bg-[#fbf7ee] border border-[#dfd0ba] rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3 border-b border-[#ede1ce] pb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#8a6849]">
            Your routines
          </h3>
          <button
            onClick={onViewAllRoutines}
            className="text-xs font-semibold text-[#8a6849] hover:text-[#352010]"
          >
            View all →
          </button>
        </div>

        <div className="p-3 rounded-xl bg-[#ede0cb]/80 border border-[#ddcdb6] flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#352010]">Friday Lunch</h4>
              <p className="text-[11px] text-[#6e5138]">ABC Restaurant - Sambar Rice</p>
              <p className="text-[10px] text-[#8c6e51] font-medium mt-0.5">
                4 repeated Fridays
              </p>
            </div>
          </div>

          <div className="w-12 h-12 rounded-full border-4 border-emerald-500 bg-white flex flex-col items-center justify-center shadow-xs">
            <span className="text-[10px] font-bold text-emerald-800 leading-none">87%</span>
            <span className="text-[7px] text-zinc-500 uppercase">Conf</span>
          </div>
        </div>

        {/* Deviation Card */}
        <div className="p-3 rounded-lg bg-[#fff8ea] border border-[#ecdaba] text-xs text-[#6e5138] leading-relaxed">
          <p className="font-semibold text-amber-900 mb-0.5">Today was different.</p>
          <p className="text-[11px]">
            You usually have lunch at ABC Restaurant on Fridays, but today you were travelling to Madurai.
          </p>
        </div>
      </div>

      {/* On This Day & Recent Photos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* On This Day */}
        <div className="p-4 rounded-xl bg-[#f5ecda] border border-[#e2d2ba]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8a6849]">
              On This Day
            </span>
            <span className="text-[10px] text-[#8a6849] font-medium">Sep 10, 2024</span>
          </div>

          <div className="relative rounded-lg overflow-hidden mb-2 border border-[#d5c2a7]">
            <img
              src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300&auto=format&fit=crop&q=80"
              alt="Marina Beach"
              className="w-full h-20 object-cover"
            />
            <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px]">
              Personal
            </span>
          </div>

          <h4 className="text-xs font-bold text-[#352010] font-serif-title">
            A Relaxing Evening at Marina Beach
          </h4>
          <p className="text-[11px] text-[#6e5138] mt-1 leading-snug">
            Watched the sunset with friends. Life feels beautiful in these simple moments.
          </p>
        </div>

        {/* Recent Photos */}
        <div className="p-4 rounded-xl bg-[#f5ecda] border border-[#e2d2ba]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8a6849]">
              Recent Photos
            </span>
            <button
              onClick={onOpenPhotos}
              className="text-[10px] text-[#8a6849] hover:text-[#523924] font-medium hover:underline cursor-pointer"
            >
              View all →
            </button>
          </div>

          <div
            onClick={onOpenPhotos}
            className="grid grid-cols-2 gap-1.5 mb-2 cursor-pointer group"
          >
            <img
              src="https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=200&auto=format&fit=crop&q=80"
              alt="Food"
              className="w-full h-14 object-cover rounded border border-[#d5c2a7] group-hover:opacity-90 transition-opacity"
            />
            <img
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=200&auto=format&fit=crop&q=80"
              alt="Meeting"
              className="w-full h-14 object-cover rounded border border-[#d5c2a7] group-hover:opacity-90 transition-opacity"
            />
            <img
              src="https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=200&auto=format&fit=crop&q=80"
              alt="Temple"
              className="w-full h-14 object-cover rounded border border-[#d5c2a7] group-hover:opacity-90 transition-opacity"
            />
            <div className="relative rounded overflow-hidden border border-[#d5c2a7]">
              <img
                src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&auto=format&fit=crop&q=80"
                alt="Beach"
                className="w-full h-14 object-cover group-hover:scale-105 transition-transform"
              />
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-[10px] font-bold group-hover:bg-black/40 transition-colors">
                +6
              </div>
            </div>
          </div>

          <p className="text-[11px] font-handwriting text-center text-[#705439]">
            "Pictures tell stories too..." 📷
          </p>
        </div>
      </div>

      {/* Mood & Wellbeing */}
      <div className="p-4 rounded-xl bg-[#fbf7ee] border border-[#dfd0ba] flex items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8a6849] block">
            Mood & Wellbeing
          </span>
          <p className="text-xs font-semibold text-[#352010]">
            How are you feeling today?
          </p>
        </div>

        <div className="flex items-center gap-2">
          {[
            { id: "happy", emoji: "😊" },
            { id: "calm", emoji: "🙂" },
            { id: "neutral", emoji: "😐" },
            { id: "tired", emoji: "😔" }
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => onSelectMood(m.id)}
              className={`text-lg p-1.5 rounded-full transition-transform ${
                selectedMood === m.id ? "scale-125 bg-amber-100 border border-amber-300" : "opacity-75 hover:opacity-100"
              }`}
            >
              {m.emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Quote */}
      <div className="text-center pt-2">
        <p className="text-xs font-serif-title italic text-[#705439]">
          "A well-remembered life is a well-lived life." — LifeBook
        </p>
      </div>
    </section>
  );
};
