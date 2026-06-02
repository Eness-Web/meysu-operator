"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Play, StopCircle, ClipboardCheck, History } from "lucide-react";
import Link from "next/link";
import { MACHINE_MAP, getMachineKey } from "@/lib/constants";

export default function DashboardHome() {
  const [session, setSession] = useState<any>(null);
  const [stats, setStats] = useState({ startToday: 0, stopToday: 0, endToday: 0 });
  const [activeStop, setActiveStop] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;

      const role = session.user.user_metadata?.role;
      const displayName = session.user.user_metadata?.display_name;
      const machineName = MACHINE_MAP[getMachineKey(role)] || role;

      setSession({ id: session.user.id, displayName, role, machineName });

      const today = new Date().toISOString().split("T")[0];

      const [starts, stops, ends] = await Promise.all([
        supabase.from("machine_start_logs").select("id", { count: "exact", head: true })
          .eq("operator_id", session.user.id).gte("start_time", today),
        supabase.from("machine_stop_logs").select("*")
          .eq("operator_id", session.user.id).gte("created_at", today),
        supabase.from("end_of_day_logs").select("id", { count: "exact", head: true })
          .eq("operator_id", session.user.id).gte("created_at", today),
      ]);

      const openStop = (stops.data || []).find((s: any) => !s.end_time);
      setActiveStop(openStop || null);
      setStats({
        startToday: starts.count || 0,
        stopToday: stops.data?.length || 0,
        endToday: ends.count || 0,
      });
    });
  }, []);

  const quickActions = [
    { href: "/dashboard/start", title: "MAKİNE START", desc: "Makineyi başlat, saati kaydet", icon: Play, color: "from-green-500 to-green-700" },
    { href: "/dashboard/stop", title: "DURMA KAYDI", desc: "Arıza/duruş nedenini kaydet", icon: StopCircle, color: "from-red-500 to-red-700" },
    { href: "/dashboard/end-of-day", title: "KAPANIŞ", desc: "Günlük üretim sayısını gir", icon: ClipboardCheck, color: "from-blue-500 to-blue-700" },
    { href: "/dashboard/history", title: "GEÇMİŞ", desc: "Tüm kayıtları görüntüle", icon: History, color: "from-purple-500 to-purple-700" },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-black text-slate-900">
          Hoş geldin, {session?.displayName}!
        </h1>
        <p className="text-slate-500 mt-1">{session?.machineName} — Bugünkü durum</p>
      </div>

      {activeStop && (
        <div className="bg-red-50 border-2 border-red-500 rounded-2xl p-5">
          <p className="font-black text-red-600 text-lg">⚠️ AKTİF DURUŞ VAR!</p>
          <p className="text-red-500 font-bold mt-1">{activeStop.stop_reason}</p>
          <p className="text-red-400 text-sm mt-1">Duruş devam ediyor — lütfen kapatmayı unutmayın!</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Start", value: stats.startToday, color: "border-l-green-500 text-green-600" },
          { label: "Duruş", value: stats.stopToday, color: "border-l-red-500 text-red-600" },
          { label: "Kapanış", value: stats.endToday, color: "border-l-blue-500 text-blue-600" },
        ].map((s) => (
          <div key={s.label} className={`bg-white rounded-2xl shadow p-5 border-l-8 ${s.color.split(" ")[0]}`}>
            <p className="text-sm font-semibold text-slate-500 uppercase">{s.label}</p>
            <p className={`text-4xl font-black mt-1 ${s.color.split(" ")[1]}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {quickActions.map((a) => {
          const Icon = a.icon;
          return (
            <Link key={a.href} href={a.href}
              className={`bg-gradient-to-br ${a.color} text-white rounded-2xl p-6 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all`}>
              <Icon className="w-10 h-10 mb-3" />
              <h3 className="text-xl font-black">{a.title}</h3>
              <p className="text-white/80 text-sm mt-1">{a.desc}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}