import React from "react";
import {
  BookOpen,
  Home,
  PlusCircle,
  Bookmark,
  TrendingUp,
  Search,
  Image as ImageIcon,
  Users,
  Target,
  Shield,
  Settings,
  ShieldCheck,
  LogOut
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

interface LeatherSpineNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  pendingCommitmentsCount: number;
}

export const LeatherSpineNav: React.FC<LeatherSpineNavProps> = ({
  currentTab,
  onSelectTab,
  pendingCommitmentsCount
}) => {
  const { user, logout } = useAuth();

  const navItems = [
    { id: "today", label: "Today", icon: Home },
    { id: "memories", label: "Memories", icon: BookOpen },
    { id: "add_memory", label: "Add Memory", icon: PlusCircle },
    { id: "commitments", label: "Commitments", icon: Bookmark, badge: pendingCommitmentsCount },
    { id: "insights", label: "Insights", icon: TrendingUp },
    { id: "ask_diary", label: "Ask My Diary", icon: Search },
    { id: "photos", label: "Photos", icon: ImageIcon },
    { id: "graph", label: "People & Places", icon: Users },
    { id: "goals", label: "Goals", icon: Target },
    { id: "privacy", label: "Privacy", icon: Shield },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  if (user?.role === "admin") {
    navItems.push({ id: "admin", label: "Admin Console", icon: ShieldCheck, badge: 0 });
  }

  return (
    <aside className="w-56 md:w-64 min-h-screen leather-spine text-amber-100 flex flex-col justify-between py-6 select-none shrink-0 relative z-20">
      <div>
        {/* Brand Header */}
        <div className="px-5 mb-8">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-6 h-6 text-amber-400" />
            <h1 className="text-xl font-bold font-book-brand tracking-wider text-amber-200">
              LifeBook AI
            </h1>
          </div>
          <p className="text-xs text-amber-300/70 italic font-serif-title">
            Your life, remembered.
          </p>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5 pr-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <div key={item.id} className="relative">
                {isActive && (
                  /* Ribbon tab sticking out onto the paper */
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 w-4 h-9 bg-[#fbf7ee] rounded-r-md shadow-md pointer-events-none border-y border-r border-[#d5c3aa]" />
                )}

                <button
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-5 py-2.5 text-sm font-medium transition-all rounded-r-xl ${
                    isActive
                      ? "bg-[#e8dac1] text-[#2c1d11] font-semibold shadow-inner"
                      : "text-amber-200/80 hover:text-amber-100 hover:bg-black/20"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? "text-[#543820]" : "text-amber-400/80"}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-red-600 text-white shadow-sm">
                      {item.badge}
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Bottom Footer Script */}
      <div className="px-5 pt-6 border-t border-amber-900/40">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-800/80 border border-amber-600/50 flex items-center justify-center text-xs font-bold text-amber-200">
              {user?.full_name ? user.full_name[0] : "A"}
            </div>
            <div className="text-xs">
              <p className="font-semibold text-amber-200 truncate max-w-[100px]">{user?.full_name || "Arun"}</p>
              <p className="text-amber-400/60 text-[10px]">{user?.role === "admin" ? "Admin" : "Personal"}</p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="text-amber-400/60 hover:text-amber-200 transition-colors p-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[13px] text-amber-400/75 italic font-handwriting leading-relaxed text-center">
          "A Better You, A More Meaningful Tomorrow." ??
        </p>
      </div>
    </aside>
  );
};
