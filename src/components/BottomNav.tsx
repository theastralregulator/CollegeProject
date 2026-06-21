import { Home, Bell, MessageSquareCode, GraduationCap, Grid3X3 } from "lucide-react";

interface BottomNavProps {
  currentTab: string;
  setTab: (tab: string) => void;
}

export default function BottomNav({ currentTab, setTab }: BottomNavProps) {
  const navItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "notices", label: "Notices", icon: Bell },
    { id: "ai", label: "AI Assistant", icon: MessageSquareCode },
    { id: "departments", label: "Departments", icon: GraduationCap },
    { id: "more", label: "More", icon: Grid3X3 },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-100 bg-white/95 pb-safe-bottom backdrop-blur-lg md:hidden">
      <div className="flex h-16 items-center justify-around px-2">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className="flex flex-col items-center justify-center w-14 h-12 rounded-xl transition active:scale-90"
            >
              <div
                className={`flex items-center justify-center p-1.5 rounded-xl transition ${
                  isActive ? "bg-blue-50 text-blue-600 scale-110" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <IconComponent className="h-5.5 w-5.5 stroke-[2.2]" />
              </div>
              <span
                className={`text-[9px] font-bold mt-0.5 tracking-tight ${
                  isActive ? "text-blue-600 font-extrabold" : "text-slate-500 font-medium"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
