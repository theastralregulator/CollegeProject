import { Home, Bell, MessageSquareCode, GraduationCap, Grid3X3, ShieldCheck } from "lucide-react";

interface NavbarProps {
  currentTab: string;
  setTab: (tab: string) => void;
  isAdminLoggedIn: boolean;
  onLogout: () => void;
}

export default function Navbar({ currentTab, setTab, isAdminLoggedIn, onLogout }: NavbarProps) {
  const navItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "notices", label: "Notices", icon: Bell },
    { id: "ai", label: "AI Assistant", icon: MessageSquareCode },
    { id: "departments", label: "Departments", icon: GraduationCap },
    { id: "more", label: "More Features", icon: Grid3X3 },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand Logo and Title */}
        <div 
          onClick={() => setTab("home")} 
          className="flex cursor-pointer items-center transition active:scale-95 animate-fade-in"
        >
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-wider text-slate-900 font-sans leading-none">
              GPTC CONNECT
            </h1>
            <p className="text-[10px] text-blue-600 tracking-widest font-black uppercase mt-0.5 leading-none">
              Govt Polytechnic College Kaduthuruthy
            </p>
            <p className="text-[9px] text-slate-400 tracking-wider font-semibold uppercase mt-0.5 leading-none">
              Your Digital Student Portal
            </p>
          </div>
        </div>

        {/* Desktop Links */}
        <nav className="hidden md:flex items-center space-x-2">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-slate-100 text-blue-600 font-bold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <IconComponent className={`h-4.5 w-4.5 ${isActive ? "text-blue-650" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="h-6 w-px bg-slate-100 mx-3" />

          {isAdminLoggedIn ? (
            <div className="flex items-center space-x-2">
              <span className="rounded-full bg-green-100 px-3 py-1 text-[11px] font-bold text-green-700 uppercase">Admin</span>
              <button
                onClick={onLogout}
                className="rounded-full bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition-all shadow-sm"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={() => setTab("admin")}
              className={`px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-semibold transition-all shadow-sm uppercase tracking-wider ${
                currentTab === "admin" ? "bg-blue-600 hover:bg-blue-700" : ""
              }`}
            >
              Admin Login
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
