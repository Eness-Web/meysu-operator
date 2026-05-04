"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getSession } from "@/lib/session";
import { toast } from "sonner";

export default function HistoryPage() {
  const [session, setSession] = useState<any>(null);
  const [tab, setTab] = useState<"end" | "stop" | "start">("end");
  const [endLogs, setEndLogs] = useState<any[]>([]);
  const [stopLogs, setStopLogs] = useState<any[]>([]);
  const [startLogs, setStartLogs] = useState<any[]>([]);
  const [filterMachine, setFilterMachine] = useState("");
  const [filterShift, setFilterShift] = useState("");

  useEffect(() => {
    const s = getSession();
    if (s) { setSession(s); fetchAll(s.id); }
  }, []);

  const fetchAll = async (operatorId: string) => {
    const [e, s, st] = await Promise.all([
      supabase.from("end_of_day_logs").select("*").eq("operator_id", operatorId).order("created_at", { ascending: false }).limit(50),
      supabase.from("machine_stop_logs").select("*").eq("operator_id", operatorId).order("created_at", { ascending: false }).limit(50),
      supabase.from("machine_start_logs").select("*").eq("operator_id", operatorId).order("start_time", { ascending: false }).limit(50),
    ]);
    if (e.data) setEndLogs(e.data);
    if (s.data) setStopLogs(s.data);
    if (st.data) setStartLogs(st.data);
  };

  const handleDelete = async (table: string, id: string) => {
    if (!confirm("Bu kaydı silmek istediğinize emin misiniz?")) return;
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (!error) { toast.success("Kayıt silindi"); fetchAll(session.id); }
    else toast.error("Silme hatası");
  };

  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("tr-TR");
  const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("tr-TR");

  const tabs = [
    { key: "end", label: "Gün Sonu", count: endLogs.length },
    { key: "stop", label: "Duruşlar", count: stopLogs.length },
    { key: "start", label: "Startlar", count: startLogs.length },
  ];

  const filtered = (logs: any[]) => logs.filter(l =>
    (!filterMachine || l.machine_name === filterMachine) &&
    (!filterShift || l.shift === filterShift)
  );

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-600">
        <h2 className="text-2xl font-black text-gray-800">GEÇMİŞ KAYITLAR</h2>
        <p className="text-gray-500 mt-1">Son 50 kayıt gösteriliyor</p>
      </div>

      
      <div className="bg-white rounded-lg shadow p-4 flex gap-4">
        <select value={filterMachine} onChange={(e) => setFilterMachine(e.target.value)}
          className="border-2 border-gray-300 rounded-lg p-2 font-bold text-sm focus:border-purple-500 outline-none bg-white flex-1">
          <option value="">Tüm Makineler</option>
          {["Mikser", "Pastör","Dolum"].map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={filterShift} onChange={(e) => setFilterShift(e.target.value)}
          className="border-2 border-gray-300 rounded-lg p-2 font-bold text-sm focus:border-purple-500 outline-none bg-white flex-1">
          <option value="">Tüm Vardiyalar</option>
          {["Sabah (08.30-18.00)" ,"Sabah (08.30-20.30)"].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="flex gap-2">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`px-5 py-2 rounded-lg font-bold text-sm transition-all ${tab === t.key ? "bg-purple-600 text-white shadow" : "bg-white text-gray-600 hover:bg-gray-100"}`}>
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        {tab === "end" && (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-3 font-bold">Tarih</th>
                <th className="text-left p-3 font-bold">Personel</th>
                <th className="text-left p-3 font-bold">Makine</th>
                <th className="text-left p-3 font-bold">Vardiya</th>
                <th className="text-center p-3 font-bold">Toplam</th>
                <th className="text-center p-3 font-bold text-red-600">Fire</th>
                <th className="text-center p-3 font-bold text-green-600">Net</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered(endLogs).map((log) => (
                <tr key={log.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{fmtDate(log.created_at)}</td>
                  <td className="p-3 font-semibold">{log.personnel_name}</td>
                  <td className="p-3">{log.machine_name}</td>
                  <td className="p-3 text-xs">{log.shift}</td>
                  <td className="p-3 text-center font-bold">{log.total_cans}</td>
                  <td className="p-3 text-center font-bold text-red-600">{log.waste_cans}</td>
                  <td className="p-3 text-center font-bold text-green-600">{log.net_cans}</td>
                  <td className="p-3">
                    <button onClick={() => handleDelete("end_of_day_logs", log.id)}
                      className="bg-red-100 hover:bg-red-200 text-red-600 text-xs font-bold px-2 py-1 rounded">Sil</button>
                  </td>
                </tr>
              ))}
              {filtered(endLogs).length === 0 && <tr><td colSpan={8} className="p-6 text-center text-gray-400">Kayıt yok</td></tr>}
            </tbody>
          </table>
        )}

        {tab === "stop" && (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-3 font-bold">Tarih</th>
                <th className="text-left p-3 font-bold">Personel</th>
                <th className="text-left p-3 font-bold">Makine</th>
                <th className="text-left p-3 font-bold">Neden</th>
                <th className="text-center p-3 font-bold">Başlangıç</th>
                <th className="text-center p-3 font-bold">Bitiş</th>
                <th className="text-center p-3 font-bold text-red-600">Süre</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered(stopLogs).map((log) => (
                <tr key={log.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{fmtDate(log.created_at)}</td>
                  <td className="p-3 font-semibold">{log.personnel_name}</td>
                  <td className="p-3">{log.machine_name}</td>
                  <td className="p-3 font-bold">{log.stop_reason}</td>
                  <td className="p-3 text-center">{fmtTime(log.start_time)}</td>
                  <td className="p-3 text-center">{log.end_time ? fmtTime(log.end_time) : <span className="text-red-500 font-bold">Açık</span>}</td>
                  <td className="p-3 text-center font-bold text-red-600">{log.duration_minutes ? `${log.duration_minutes} dk` : "-"}</td>
                  <td className="p-3">
                    <button onClick={() => handleDelete("machine_stop_logs", log.id)}
                      className="bg-red-100 hover:bg-red-200 text-red-600 text-xs font-bold px-2 py-1 rounded">Sil</button>
                  </td>
                </tr>
              ))}
              {filtered(stopLogs).length === 0 && <tr><td colSpan={8} className="p-6 text-center text-gray-400">Kayıt yok</td></tr>}
            </tbody>
          </table>
        )}

        {tab === "start" && (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-3 font-bold">Tarih</th>
                <th className="text-left p-3 font-bold">Personel</th>
                <th className="text-left p-3 font-bold">Makine</th>
                <th className="text-left p-3 font-bold">Vardiya</th>
                <th className="text-center p-3 font-bold">Saat</th>
                <th className="text-left p-3 font-bold">Not</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered(startLogs).map((log) => (
                <tr key={log.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{fmtDate(log.start_time)}</td>
                  <td className="p-3 font-semibold">{log.personnel_name}</td>
                  <td className="p-3">{log.machine_name}</td>
                  <td className="p-3 text-xs">{log.shift}</td>
                  <td className="p-3 text-center font-bold text-green-600">{fmtTime(log.start_time)}</td>
                  <td className="p-3 text-gray-500 text-xs">{log.note || "-"}</td>
                  <td className="p-3">
                    <button onClick={() => handleDelete("machine_start_logs", log.id)}
                      className="bg-red-100 hover:bg-red-200 text-red-600 text-xs font-bold px-2 py-1 rounded">Sil</button>
                  </td>
                </tr>
              ))}
              {filtered(startLogs).length === 0 && <tr><td colSpan={7} className="p-6 text-center text-gray-400">Kayıt yok</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}