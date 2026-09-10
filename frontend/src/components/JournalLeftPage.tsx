import React from "react";
import {
  Sun,
  Mic,
  PenTool,
  Image as ImageIcon,
  Edit2,
  MapPin,
  User as UserIcon,
  Briefcase,
  Utensils,
  Lightbulb,
  BookOpen,
  Sparkles,
  RotateCcw,
  Calendar
} from "lucide-react";
import { DiaryEntry, User } from "../types";
import { ProcessingTracker } from "./ProcessingTracker";

interface JournalLeftPageProps {
  user: User | null;
  activeEntry: DiaryEntry | null;
  onOpenVoice: () => void;
  onOpenText: () => void;
  onOpenPhoto: () => void;
  onOpenReview: () => void;
  onTellMeMore: () => void;
  onRetryProcessing?: () => void;
  onRegenerate?: (tone?: string) => Promise<void> | void;
  isRegenerating?: boolean;
  onOpenPhotos?: () => void;
  onOpenGraph?: () => void;
  onOpenCalendar?: () => void;
}

export const JournalLeftPage: React.FC<JournalLeftPageProps> = ({
  user,
  activeEntry,
  onOpenVoice,
  onOpenText,
  onOpenPhoto,
  onOpenReview,
  onTellMeMore,
  onRetryProcessing,
  onRegenerate,
  isRegenerating = false,
  onOpenPhotos,
  onOpenGraph,
  onOpenCalendar,
}) => {
  return (
    <section className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 space-y-6 overflow-y-auto">
      {/* Top Date Header & Handwritten Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[#ebdcc4] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-serif-title font-bold text-[#352010] tracking-tight">
              Thursday
            </h2>
            <Sun className="w-6 h-6 text-amber-500 fill-amber-400" />
          </div>
          <div
            onClick={onOpenCalendar}
            className="group inline-flex items-center gap-1.5 cursor-pointer hover:opacity-85 transition-opacity"
            title="Open Life Calendar & Daily Memories"
          >
            <p className="text-xs font-semibold text-[#8c6e51] group-hover:text-amber-900 uppercase tracking-wider mt-0.5">
              September 10, 2026
            </p>
            <Calendar className="w-3.5 h-3.5 text-[#8c6e51] group-hover:text-amber-900" />
          </div>
          <p className="text-base text-[#6b492b] font-handwriting mt-1 font-medium">
            Good morning, {user?.full_name?.split(" ")[0] || "Arun"}! Here's what your life looks like today.
          </p>
        </div>

        {/* Taped Polaroid Photo Card */}
        <div className="transform rotate-2 shrink-0 self-center sm:self-auto">
          <div className="w-28 bg-white p-2 pb-3 rounded shadow-md border border-[#dfd2be] relative">
            <div className="washi-tape absolute -top-2.5 left-1/2 -translate-x-1/2 w-14 h-4 transform -rotate-2 rounded-xs border border-amber-900/10" />
            <img
              src="https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=300&auto=format&fit=crop&q=80"
              alt="Madurai Temple"
              className="w-full h-20 object-cover rounded-xs"
            />
            <p className="text-[11px] font-handwriting text-center text-[#543b23] mt-1 font-bold">
              Madurai ??
            </p>
          </div>
        </div>
      </div>

      {/* Central Memory Capture Box: "What happened today?" */}
      <div className="bg-[#eff5eb] border border-[#cbdcc2] rounded-2xl p-5 shadow-sm">
        <div className="text-center mb-4">
          <h3 className="text-base font-bold text-[#2d4726] font-serif-title">
            What happened today?
          </h3>
          <p className="text-xs text-[#52704b]">
            Talk, write or add a photo. I'll take care of the rest.
          </p>
        </div>

        {/* Waveform and Microphone Button */}
        <div className="flex items-center justify-center gap-4 my-3">
          <div className="flex items-center gap-1 h-8">
            {[12, 20, 16, 28, 14, 22, 10].map((h, i) => (
              <span
                key={i}
                style={{ height: `${h}px` }}
                className="w-1 bg-[#86b579] rounded-full"
              />
            ))}
          </div>

          <button
            onClick={onOpenVoice}
            className="w-14 h-14 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95 hover:scale-105 group border-2 border-emerald-500/40"
            title="Tap to speak"
          >
            <Mic className="w-6 h-6 group-hover:animate-pulse" />
          </button>

          <div className="flex items-center gap-1 h-8">
            {[10, 22, 14, 28, 16, 20, 12].map((h, i) => (
              <span
                key={i}
                style={{ height: `${h}px` }}
                className="w-1 bg-[#86b579] rounded-full"
              />
            ))}
          </div>
        </div>

        <p className="text-[11px] font-bold text-[#45683d] text-center mb-4">
          Tap to speak
        </p>

        {/* Three Quick Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2 border-t border-[#d6e5cd]">
          <button
            onClick={onOpenText}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 hover:bg-white text-xs font-semibold text-[#3a5732] border border-[#bed3b5] shadow-2xs transition-colors"
          >
            <PenTool className="w-3.5 h-3.5 text-emerald-700" />
            <span>Write a memory</span>
          </button>

          <button
            onClick={onOpenPhoto}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 hover:bg-white text-xs font-semibold text-[#3a5732] border border-[#bed3b5] shadow-2xs transition-colors"
          >
            <ImageIcon className="w-3.5 h-3.5 text-emerald-700" />
            <span>Add a photo</span>
          </button>

          <button
            onClick={onOpenText}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/80 hover:bg-white text-xs font-semibold text-[#3a5732] border border-[#bed3b5] shadow-2xs transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Example</span>
          </button>
        </div>
      </div>

      {/* Active Entry Real-Time Processing Stepper */}
      {activeEntry && activeEntry.status !== "COMPLETED" && (
        <ProcessingTracker
          status={activeEntry.status}
          history={activeEntry.status_history || []}
          entryId={activeEntry.id}
          onRetry={onRetryProcessing}
        />
      )}

      {/* Today's Diary Narrative Card */}
      <div className="bg-[#fbf7ee] border border-[#dfd0ba] rounded-2xl p-5 shadow-xs relative">
        <div className="flex items-center justify-between mb-3 border-b border-[#ede1ce] pb-2">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#8a6849]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#8a6849]">
              Today's Diary
            </span>
            {isRegenerating && (
              <span className="text-[10px] text-amber-800 bg-amber-100/90 border border-amber-300 px-2 py-0.5 rounded-full font-medium flex items-center gap-1 animate-pulse">
                <Sparkles className="w-2.5 h-2.5" /> AI Rewriting...
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onRegenerate && onRegenerate()}
              disabled={isRegenerating}
              title="Regenerate today's diary with AI"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-[#8a6849] hover:text-[#3d2511] hover:bg-[#ede1ce] transition-all disabled:opacity-50 cursor-pointer border border-transparent hover:border-[#dfd0ba]"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isRegenerating ? "animate-spin text-amber-700" : ""}`} />
              <span>{isRegenerating ? "Rewriting..." : "Regenerate"}</span>
            </button>
            <button
              onClick={onOpenReview}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-[#8a6849] hover:text-[#3d2511] hover:bg-[#ede1ce] font-semibold transition-all cursor-pointer border border-transparent hover:border-[#dfd0ba]"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
          </div>
        </div>

        <h3 className="text-lg font-bold text-[#352010] font-serif-title mb-2">
          {activeEntry?.title || "A Productive Day in Madurai"}
        </h3>
        <p className="text-xs md:text-sm text-[#473322] leading-relaxed font-serif-title mb-3">
          {activeEntry?.generated_content ||
            activeEntry?.raw_text ||
            "Today I went to Madurai for a customer meeting with Ravi. We discussed the website project and he asked me to send the quotation tomorrow. After the meeting, I had a nice biryani lunch with Kumar at ABC Restaurant. It was a long but fulfilling day. I reached home around 8 PM."}
        </p>

        {/* Quick Style / Tone Pills */}
        <div className="flex items-center flex-wrap gap-1.5 mb-4 pt-1 border-t border-[#f0e6d5]/70">
          <span className="text-[10px] uppercase font-bold text-[#8a6849]/80 tracking-wider mr-1">AI Tone:</span>
          {[
            { id: "reflective", label: "Reflective" },
            { id: "poetic", label: "Poetic" },
            { id: "concise", label: "Concise" },
            { id: "detailed", label: "Detailed" }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => onRegenerate && onRegenerate(t.id)}
              disabled={isRegenerating}
              title={`Regenerate diary with ${t.label} tone`}
              className="text-[11px] px-2.5 py-0.5 rounded-full border border-[#d9c4a8] text-[#5c3e21] hover:bg-[#ebdcc4] active:scale-95 transition-all disabled:opacity-50 cursor-pointer font-serif-title"
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Photo Thumbnails */}
        <div
          onClick={onOpenPhotos}
          className="grid grid-cols-4 gap-2 mb-4 cursor-pointer group"
          title="Click to view full photo scrapbook"
        >
          <img
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=300&auto=format&fit=crop&q=80"
            alt="Meeting"
            className="w-full h-16 object-cover rounded-lg border border-[#dfd0ba] group-hover:opacity-90 transition-opacity"
          />
          <img
            src="https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&auto=format&fit=crop&q=80"
            alt="Biryani lunch"
            className="w-full h-16 object-cover rounded-lg border border-[#dfd0ba] group-hover:opacity-90 transition-opacity"
          />
          <img
            src="https://images.unsplash.com/photo-1577495508048-b635879837f1?w=300&auto=format&fit=crop&q=80"
            alt="Friends"
            className="w-full h-16 object-cover rounded-lg border border-[#dfd0ba] group-hover:opacity-90 transition-opacity"
          />
          <div className="relative rounded-lg overflow-hidden border border-[#dfd0ba]">
            <img
              src="https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=300&auto=format&fit=crop&q=80"
              alt="Temple"
              className="w-full h-16 object-cover group-hover:scale-105 transition-transform"
            />
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xs font-bold group-hover:bg-black/40 transition-colors">
              +3
            </div>
          </div>
        </div>

        {/* Extracted Concept Tag Pills */}
        <div className="flex flex-wrap gap-1.5 pt-3 border-t border-[#ede1ce]">
          <span
            onClick={onOpenGraph}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-100/70 text-blue-900 text-[11px] font-semibold cursor-pointer hover:bg-blue-200 transition-colors"
            title="View in People & Places"
          >
            <MapPin className="w-3 h-3 text-blue-700" /> Madurai
          </span>
          <span
            onClick={onOpenGraph}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-100/70 text-blue-900 text-[11px] font-semibold cursor-pointer hover:bg-blue-200 transition-colors"
            title="View in People & Places"
          >
            <UserIcon className="w-3 h-3 text-blue-700" /> Ravi
          </span>
          <span
            onClick={onOpenGraph}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-100/70 text-blue-900 text-[11px] font-semibold cursor-pointer hover:bg-blue-200 transition-colors"
            title="View in People & Places"
          >
            <UserIcon className="w-3 h-3 text-blue-700" /> Kumar
          </span>
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-100/70 text-amber-900 text-[11px] font-semibold">
            <Utensils className="w-3 h-3 text-amber-700" /> Biryani
          </span>
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-100/70 text-purple-900 text-[11px] font-semibold">
            <Briefcase className="w-3 h-3 text-purple-700" /> Customer Meeting
          </span>
          <span className="px-2 py-1 rounded-md bg-emerald-100/60 text-emerald-900 text-[11px] font-medium">
            Business
          </span>
          <span className="px-2 py-1 rounded-md bg-emerald-100/60 text-emerald-900 text-[11px] font-medium">
            Travel
          </span>
          <span className="px-2 py-1 rounded-md bg-emerald-100/60 text-emerald-900 text-[11px] font-medium">
            Food
          </span>
        </div>
      </div>

      {/* AI Understood Grid */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#8a6849]">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span>AI understood</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 rounded-xl bg-[#ede0cb]/80 border border-[#ddcdb6]">
            <span className="text-[10px] font-bold text-blue-800 uppercase block mb-1">
              People
            </span>
            <p className="text-xs font-semibold text-[#352010]">Ravi, Kumar</p>
          </div>

          <div className="p-3 rounded-xl bg-[#ede0cb]/80 border border-[#ddcdb6]">
            <span className="text-[10px] font-bold text-emerald-800 uppercase block mb-1">
              Places
            </span>
            <p className="text-xs font-semibold text-[#352010]">Madurai, ABC Restaurant</p>
          </div>

          <div className="p-3 rounded-xl bg-[#ede0cb]/80 border border-[#ddcdb6]">
            <span className="text-[10px] font-bold text-amber-800 uppercase block mb-1">
              Activities
            </span>
            <p className="text-xs font-semibold text-[#352010]">Meeting, Lunch, Travel</p>
          </div>

          <div className="p-3 rounded-xl bg-[#ede0cb]/80 border border-[#ddcdb6]">
            <span className="text-[10px] font-bold text-purple-800 uppercase block mb-1">
              Categories
            </span>
            <p className="text-xs font-semibold text-[#352010]">Business, Travel, Food</p>
          </div>
        </div>
      </div>

      {/* Routine Insight Card */}
      <div className="p-4 rounded-xl bg-[#e5eff9] border border-[#c3daf2] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <Lightbulb className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-blue-950">
              LifeBook noticed...
            </h4>
            <p className="text-xs text-blue-900 mt-0.5 leading-relaxed">
              You usually have lunch at ABC Restaurant on Fridays, but today you were travelling to Madurai.
            </p>
          </div>
        </div>
        <button
          onClick={onTellMeMore}
          className="px-3 py-1.5 bg-white hover:bg-blue-50 text-blue-800 font-semibold text-xs rounded-lg border border-blue-200 shadow-2xs shrink-0 transition-colors"
        >
          Interesting! Tell me more ?
        </button>
      </div>
    </section>
  );
};
