"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { getSession, clearSession, type OperatorSession } from "@/lib/session";
import { Play, StopCircle, ClipboardCheck, History, LogOut, User, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<OperatorSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const s = getSession();
    if (!s) { router.replace("/"); return; }
    setSession(s);
    setReady(true);
  }, [router]);

  const handleLogout = () => { clearSession(); router.replace("/"); };

  if (!ready || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-slate-500 text-xl">Yükleniyor...</p>
      </div>
    );
  }

  const navItems = [
    { href: "/dashboard", label: "Ana Sayfa", icon: Home },
    { href: "/dashboard/start", label: "MAKİNE START", icon: Play },
    { href: "/dashboard/stop", label: "DURMA KAYDI", icon: StopCircle },
    { href: "/dashboard/end-of-day", label: "KAPANIŞ", icon: ClipboardCheck },
    { href: "/dashboard/history", label: "GEÇMİŞ KAYITLAR", icon: History },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top Header */}
      <header className="bg-[#1a237e] text-white px-6 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <img src="/meysu-logo.png" alt="Meysu Logo" className="w-10 h-10 object-contain" />
          <div>
            <h1 className="text-xl font-black tracking-tight leading-none">MEYSU GIDA</h1>
            <p className="text-xs text-blue-300">Kutu Hattı Takip</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-bold">{session.displayName}</p>
            <p className="text-xs text-blue-300">{session.username}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-400 flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
        </div>
      </header>

      {/* Nav Bar */}
      <nav className="bg-[#283593] px-4 py-2 flex items-center gap-2 flex-wrap shadow-md">
        {navItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded font-bold text-sm transition-all",
                active
                  ? "bg-[#1a237e] text-white shadow-inner"
                  : "bg-[#3949ab] text-white hover:bg-[#1a237e]"
              )}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
        <button
          onClick={handleLogout}
          className="ml-auto flex items-center gap-2 px-4 py-2 rounded font-bold text-sm bg-red-600 hover:bg-red-700 text-white transition-all"
        >
          <LogOut className="w-4 h-4" />
          ÇIKIŞ YAP
        </button>
      </nav>

      {/* Page Content */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}