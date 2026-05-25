"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/integrations/supabase/client";
import { getSession } from "@/lib/session";
import type { Machine } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Play, StopCircle, ClipboardCheck, History, Cog, Factory } from "lucide-react";
import Link from "next/link";

export default function DashboardHome() {
  const router = useRouter();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [stats, setStats] = useState({ startToday: 0, stopToday: 0, endToday: 0 });
  const [session, setSession] = useState<{ displayName: string } | null>(null);

  useEffect(() => {
    const s = getSession();
    if (!s) return;
    setSession({ displayName: s.displayName });
    (async () => {
      const { data: links } = await supabase
        .from("operator_machines")
        .select("machine_id")
        .eq("operator_id", s.id);
      const ids = (links || []).map((l: { machine_id: string }) => l.machine_id);
      if (ids.length === 0) {
        setMachines([]);
      } else {
        const { data: machs } = await supabase
          .from("machines")
          .select("id, line_id, code, name, machine_type, output_label")
          .in("id", ids)
          .order("machine_type")
          .order("name");
        setMachines((machs || []) as Machine[]);
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const iso = today.toISOString();

      const [{ count: startCount }, { count: stopCount }, { count: endCount }] = await Promise.all([
        supabase.from("machine_start_logs").select("id", { count: "exact", head: true }).eq("operator_id", s.id).gte("created_at", iso),
        supabase.from("machine_stop_logs").select("id", { count: "exact", head: true }).eq("operator_id", s.id).gte("created_at", iso),
        supabase.from("end_of_day_logs").select("id", { count: "exact", head: true }).eq("operator_id", s.id).gte("created_at", iso),
      ]);
      setStats({
        startToday: startCount || 0,
        stopToday: stopCount || 0,
        endToday: endCount || 0,
      });
    })();
  }, []);

  const quickActions = [
    { href: "/dashboard/start", title: "MAKİNE START", desc: "Makineyi başlat, saati kaydet", icon: Play, color: "from-green-500 to-green-700", iconBg: "bg-green-600" },
    { href: "/dashboard/stop", title: "DURMA KAYDI", desc: "Arıza/duruş nedenini kaydet", icon: StopCircle, color: "from-red-500 to-red-700", iconBg: "bg-red-600" },
    { href: "/dashboard/end-of-day", title: "KAPANIŞ", desc: "Günlük üretim sayısını gir", icon: ClipboardCheck, color: "from-blue-500 to-blue-700", iconBg: "bg-blue-600" },
    { href: "/dashboard/history", title: "GEÇMİŞ", desc: "Tüm kayıtları görüntüle", icon: History, color: "from-purple-500 to-purple-700", iconBg: "bg-purple-600" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-black text-slate-900">Hoş geldin, {session?.displayName}!</h1>
        <p className="text-lg text-slate-600 mt-2">Kutu hattı makine takip paneline hoş geldiniz. Yapmak istediğiniz işlemi seçin.</p>
      </div>

      
      <div className="grid grid-cols-3 gap-6">
        <Card className="p-6 border-l-8 border-l-green-500 bg-white shadow-md">
          <p className="text-lg font-semibold text-slate-500 uppercase">Start</p>
          <p className="text-5xl font-black text-green-600 mt-2">{stats.startToday}</p>
        </Card>
        <Card className="p-6 border-l-8 border-l-red-500 bg-white shadow-md">
          <p className="text-lg font-semibold text-slate-500 uppercase"> Duruş</p>
          <p className="text-5xl font-black text-red-600 mt-2">{stats.stopToday}</p>
        </Card>
        <Card className="p-6 border-l-8 border-l-blue-500 bg-white shadow-md">
          <p className="text-lg font-semibold text-slate-500 uppercase">Kapanış</p>
          <p className="text-5xl font-black text-blue-600 mt-2">{stats.endToday}</p>
        </Card>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Hızlı İşlemler</h2>
        <div className="grid grid-cols-2 gap-6">
          {quickActions.map((a) => {
            const Icon = a.icon;
            return (
              <Link
                key={a.href}
                href={a.href}
                className={`group bg-gradient-to-br ${a.color} text-white rounded-2xl p-8 shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all`}
              >
                <div className="flex items-center gap-5">
                  <div className={`w-20 h-20 rounded-2xl ${a.iconBg} flex items-center justify-center shadow-inner shrink-0`}>
                    <Icon className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black tracking-tight">{a.title}</h3>
                    <p className="text-white/90 font-medium mt-1">{a.desc}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="text-3xl font-bold text-slate-850 mb-4 flex items-center gap-4">
          <Cog className="w-7 h-7" /> 
          Sorumlu Olduğunuz Makineler (3)
        </h2>
        <div className="grid grid-cols-3 gap-5">
          {/* Machines */}
<div className="bg-white rounded-lg shadow p-4">
  <h3 className="font-bold text-gray-850 mb-5">Sorumlu Olduğunuz Makineler</h3>
  <div className="grid grid-cols-3 gap-4">
  {[
    { name: "Mikser", color: "bg-blue-100 border-blue-800 text-blue-800" },
    { name: "Pastör", color: "bg-orange-100 border-orange-800 text-orange-800" },
    { name: "Barkotlama", color: "bg-purple-100 border-purple-800 text-purple-800" },
  ].map((machine) => (
    <div key={machine.name}
      className={`${machine.color} border-2 rounded-lg p-5 text-center font-black text-lg`}>
       {machine.name}
    </div>
  ))}
</div>
   
  </div>
</div>
          {machines.map((m) => (
            <Card key={m.id} className="p-5 flex items-center gap-4 border-2 hover:border-red-300 transition-colors">
            <div className="flex justify-center mb-6">
            <img
              src="/meysu-logo.png"
              className="w-28 h-28 object-contain drop-shadow-2xl"
            />
          </div>
              <div className="min-w-0">
                <p className="font-bold text-lg truncate">{m.name}</p>
                <p className="text-xs uppercase font-semibold text-slate-500">
                  {m.machine_type === "ana" ? "Ana Makine" : "Yan Makine"}
                </p>
              </div>
            </Card>
          ))}
          {machines.length === 0 && (
            <p className="col-span-3 text-center text-slate-500 py-8">
             
            </p>
          )}
        </div>
      </div>
    
  );
}
