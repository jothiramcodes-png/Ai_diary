import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { api } from "./services/api";
import { DiaryEntry, Commitment, Routine, NotificationItem } from "./types";
import { LeatherSpineNav } from "./components/LeatherSpineNav";
import { JournalLeftPage } from "./components/JournalLeftPage";
import { JournalRightPage } from "./components/JournalRightPage";
import { VoiceRecorderModal } from "./components/VoiceRecorderModal";
import { TextEntryModal } from "./components/TextEntryModal";
import { PhotoEntryModal } from "./components/PhotoEntryModal";
import { DraftReviewModal } from "./components/DraftReviewModal";
import { LifeGraphModal } from "./components/LifeGraphModal";
import { PhotosModal } from "./components/PhotosModal";
import { InsightsModal } from "./components/InsightsModal";
import { AskLifeBookWidget } from "./components/AskLifeBookWidget";
import { SettingsModal } from "./components/SettingsModal";
import { AdminModal } from "./components/AdminModal";
import { Menu, BookOpen } from "lucide-react";

export const AppContent: React.FC = () => {
  const { user } = useAuth();

  // Navigation State
  const [currentTab, setCurrentTab] = useState("today");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobilePageTab, setMobilePageTab] = useState<"left" | "right">("left");

  // Modals
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [textModalOpen, setTextModalOpen] = useState(false);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [photosModalOpen, setPhotosModalOpen] = useState(false);
  const [insightsModalOpen, setInsightsModalOpen] = useState(false);
  const [graphModalOpen, setGraphModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  // Active Data
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [activeEntry, setActiveEntry] = useState<DiaryEntry | null>(null);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [onThisDay, setOnThisDay] = useState<any>(null);

  // Search input state
  const [searchQuery, setSearchQuery] = useState("");

  // Mood selection
  const [selectedMood, setSelectedMood] = useState<string>("fulfilled");

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const [allEntries, allCommitments, allRoutines, allNotifs, otd] = await Promise.all([
        api.getEntries().catch(() => []),
        api.getCommitments().catch(() => []),
        api.getRoutines().catch(() => []),
        api.getNotifications().catch(() => []),
        api.getOnThisDay().catch(() => null)
      ]);

      setEntries(allEntries);
      if (allEntries.length > 0) {
        setActiveEntry(allEntries[0]);
      }
      setCommitments(allCommitments);
      setRoutines(allRoutines);
      setNotifications(allNotifs);
      setOnThisDay(otd);
    } catch (err) {
      console.error("Failed to load initial data", err);
    }
  };

  const handleEntryCreated = (newEntry: DiaryEntry) => {
    setActiveEntry(newEntry);
    setEntries((prev) => [newEntry, ...prev]);

    // Poll status until DRAFTED or USER_REVIEW
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const statusRes = await api.getEntryStatus(newEntry.id);
        setActiveEntry((prev) => prev ? {
          ...prev,
          status: statusRes.status,
          status_history: statusRes.history,
          title: statusRes.title || prev.title,
          generated_content: statusRes.generated_content || prev.generated_content,
          disambiguation: statusRes.disambiguation
        } : null);

        if (statusRes.status === "USER_REVIEW" || statusRes.status === "DRAFTED") {
          clearInterval(interval);
          setReviewModalOpen(true);
        } else if (statusRes.status === "COMPLETED" || attempts > 20) {
          clearInterval(interval);
        }
      } catch (e) {
        clearInterval(interval);
      }
    }, 1500);
  };

  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleRetryProcessing = async () => {
    if (!activeEntry) return;
    try {
      const updated = await api.retryEntryProcessing(activeEntry.id);
      handleEntryCreated(updated);
    } catch (e) {
      console.error("Retry processing failed:", e);
    }
  };

  const handleRegenerateEntry = async (tone = "reflective") => {
    let targetEntry = activeEntry;
    if (!targetEntry && entries.length > 0) {
      targetEntry = entries[0];
    }
    if (!targetEntry) {
      try {
        targetEntry = await api.submitText(
          "Today I went to Madurai for a customer meeting with Ravi. We discussed the website project and he asked me to send the quotation tomorrow. After the meeting, I had a nice biryani lunch with Kumar at ABC Restaurant. It was a long but fulfilling day. I reached home around 8 PM.",
          "A Productive Day in Madurai",
          "Business / Travel",
          "productive"
        );
        setActiveEntry(targetEntry);
        setEntries([targetEntry]);
      } catch (err) {
        console.error("Failed to create baseline entry:", err);
        return;
      }
    }

    setIsRegenerating(true);
    try {
      const updated = await api.regenerateEntry(targetEntry.id, tone);
      setActiveEntry(updated);
      setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    } catch (e) {
      console.error("Regeneration failed:", e);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleEntryConfirmed = async (updated: DiaryEntry) => {
    setActiveEntry(updated);
    setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    const comms = await api.getCommitments().catch(() => []);
    setCommitments(comms);
  };

  const handleMarkDone = async (id: string) => {
    try {
      await api.completeCommitment(id);
      setCommitments((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: "COMPLETED" } : c))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleNavSelect = (tab: string) => {
    setCurrentTab(tab);
    setMobileMenuOpen(false);
    if (tab === "graph") setGraphModalOpen(true);
    else if (tab === "photos") setPhotosModalOpen(true);
    else if (tab === "insights") setInsightsModalOpen(true);
    else if (tab === "settings" || tab === "privacy") setSettingsModalOpen(true);
    else if (tab === "admin") setAdminModalOpen(true);
    else if (tab === "add_memory") setVoiceModalOpen(true);
    else if (tab === "commitments") setMobilePageTab("right");
    else if (tab === "today") setMobilePageTab("left");
  };

  const pendingCommitments = commitments.filter((c) => c.status === "PENDING");

  return (
    <div className="min-h-screen bg-[#1c1109] text-[#2c2016] flex flex-col md:flex-row items-stretch justify-center p-0 sm:p-2 md:p-6 lg:p-8 font-sans antialiased relative">
      {/* Desk Atmosphere Items */}
      {/* Coffee Cup on bottom left */}
      <div className="hidden xl:block fixed bottom-6 left-4 z-10 pointer-events-none drop-shadow-2xl">
        <div className="w-28 h-28 rounded-full bg-[#e3d7cb] border-4 border-[#bca894] shadow-2xl flex items-center justify-center relative">
          <div className="w-22 h-22 rounded-full bg-[#523019] flex items-center justify-center overflow-hidden border border-[#3d200e]">
            <div className="w-14 h-14 rounded-full bg-[#e8dac1] opacity-90 blur-[1px] rotate-45 transform scale-y-75 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-[#c9b499] blur-[0.5px]" />
            </div>
          </div>
          {/* Steam subtle pulse */}
          <div className="absolute -top-3 left-8 w-4 h-6 bg-white/20 blur-md rounded-full animate-pulse" />
        </div>
      </div>

      {/* Sticky Note 1 */}
      <div className="hidden 2xl:block fixed bottom-40 left-6 z-10 pointer-events-none transform -rotate-6 bg-[#fff7d1] p-4 rounded shadow-lg border border-amber-200/80 w-36 text-center font-handwriting text-[#4a391a]">
        <p className="text-sm font-bold leading-tight">Good Stories Build A Better You. :)</p>
      </div>

      {/* Sticky Note 2 on top right desk */}
      <div className="hidden 2xl:block fixed top-16 right-8 z-10 pointer-events-none transform rotate-3 bg-[#fff7d1] p-4 rounded shadow-lg border border-amber-200/80 w-40 text-center font-handwriting text-[#4a391a]">
        <p className="text-base font-bold leading-tight">"Small moments make a big life." ✨</p>
      </div>

      {/* Fountain Pen on bottom desk */}
      <div className="hidden xl:block fixed bottom-4 right-1/3 z-10 pointer-events-none transform -rotate-12 opacity-90 drop-shadow-xl">
        <div className="w-48 h-3.5 bg-gradient-to-r from-amber-950 via-amber-800 to-yellow-600 rounded-full shadow-lg border border-yellow-500/40 relative">
          <div className="absolute right-0 top-0 w-8 h-3.5 bg-yellow-500 rounded-r-full" />
          <div className="absolute -right-3 top-0.5 w-3 h-2.5 bg-yellow-400 transform rotate-45" />
        </div>
      </div>

      {/* Journal Book Outer Shell */}
      <div className="w-full max-w-7xl flex flex-col md:flex-row shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] rounded-none sm:rounded-2xl overflow-hidden border-y sm:border-2 border-[#3d2315] relative z-20">
        {/* Mobile Top App Bar (visible on md:hidden) */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#3a2012] text-amber-100 border-b border-[#52301a]">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 rounded-lg bg-black/25 hover:bg-black/40 text-amber-200 relative transition-colors"
              title="Open Navigation"
            >
              <Menu className="w-5 h-5" />
              {pendingCommitments.length > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-600 rounded-full" />
              )}
            </button>
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-5 h-5 text-amber-400" />
              <span className="font-bold text-base font-book-brand tracking-wide text-amber-200">
                LifeBook AI
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setVoiceModalOpen(true)}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-xs font-semibold shadow-xs"
            >
              + Add
            </button>
            <div
              onClick={() => setSettingsModalOpen(true)}
              className="w-7 h-7 rounded-full bg-amber-800 border border-amber-600 flex items-center justify-center text-xs font-bold text-amber-200 cursor-pointer"
            >
              {user?.full_name ? user.full_name[0] : "A"}
            </div>
          </div>
        </div>

        {/* Mobile Page Tab Switcher (visible on lg:hidden) */}
        <div className="lg:hidden flex items-center bg-[#ede0cb] border-b border-[#d8c7ad] p-1.5 gap-1.5">
          <button
            onClick={() => setMobilePageTab("left")}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all text-center ${
              mobilePageTab === "left"
                ? "bg-[#fbf7ee] text-[#352010] shadow-xs border border-[#cfbeab]"
                : "text-[#70553e] hover:text-[#352010]"
            }`}
          >
            📖 Today's Diary
          </button>
          <button
            onClick={() => setMobilePageTab("right")}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 ${
              mobilePageTab === "right"
                ? "bg-[#fbf7ee] text-[#352010] shadow-xs border border-[#cfbeab]"
                : "text-[#70553e] hover:text-[#352010]"
            }`}
          >
            <span>📋 Tasks & Routines</span>
            {pendingCommitments.length > 0 && (
              <span className="px-1.5 py-0.2 bg-red-600 text-white text-[10px] rounded-full">
                {pendingCommitments.length}
              </span>
            )}
          </button>
        </div>

        {/* Left Leather Spine Navigation (desktop sidebar + mobile drawer) */}
        <LeatherSpineNav
          currentTab={currentTab}
          onSelectTab={handleNavSelect}
          pendingCommitmentsCount={pendingCommitments.length}
          isOpenMobile={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        {/* Double Open Journal Pages */}
        <main className="flex-1 journal-paper flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-[#e2d2ba] journal-page-crease min-h-[90vh]">
          <div className={`${mobilePageTab === "left" ? "block" : "hidden"} lg:block flex-1`}>
            <JournalLeftPage
              user={user}
              activeEntry={activeEntry}
              onOpenVoice={() => setVoiceModalOpen(true)}
              onOpenText={() => setTextModalOpen(true)}
              onOpenPhoto={() => setPhotoModalOpen(true)}
              onOpenReview={() => setReviewModalOpen(true)}
              onRetryProcessing={handleRetryProcessing}
              onRegenerate={handleRegenerateEntry}
              isRegenerating={isRegenerating}
              onOpenPhotos={() => setPhotosModalOpen(true)}
              onOpenGraph={() => setGraphModalOpen(true)}
              onTellMeMore={() => setInsightsModalOpen(true)}
            />
          </div>

          <div className={`${mobilePageTab === "right" ? "block" : "hidden"} lg:block flex-1`}>
            <JournalRightPage
              user={user}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              pendingCommitments={pendingCommitments}
              routines={routines}
              onMarkDone={handleMarkDone}
              onViewAllCommitments={() => setGraphModalOpen(true)}
              onViewAllRoutines={() => setInsightsModalOpen(true)}
              onOpenPhotos={() => setPhotosModalOpen(true)}
              notifications={notifications}
              showNotifications={showNotifications}
              onToggleNotifications={() => setShowNotifications(!showNotifications)}
              selectedMood={selectedMood}
              onSelectMood={setSelectedMood}
            />
          </div>
        </main>
      </div>

      {/* Floating AI Assistant Widget (matches bottom right of reference image) */}
      <AskLifeBookWidget />

      {/* Modals */}
      <VoiceRecorderModal
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        onEntryCreated={handleEntryCreated}
      />

      <TextEntryModal
        isOpen={textModalOpen}
        onClose={() => setTextModalOpen(false)}
        onEntryCreated={handleEntryCreated}
      />

      <PhotoEntryModal
        isOpen={photoModalOpen}
        onClose={() => setPhotoModalOpen(false)}
        onEntryCreated={handleEntryCreated}
      />

      <DraftReviewModal
        isOpen={reviewModalOpen}
        entry={activeEntry}
        onClose={() => setReviewModalOpen(false)}
        onConfirmed={handleEntryConfirmed}
      />

      <LifeGraphModal
        isOpen={graphModalOpen}
        onClose={() => setGraphModalOpen(false)}
      />

      <PhotosModal
        isOpen={photosModalOpen}
        onClose={() => setPhotosModalOpen(false)}
        onOpenPhotoEntry={() => setPhotoModalOpen(true)}
      />

      <InsightsModal
        isOpen={insightsModalOpen}
        onClose={() => setInsightsModalOpen(false)}
        onRoutineUpdated={loadData}
      />

      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
      />

      <AdminModal
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
      />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
