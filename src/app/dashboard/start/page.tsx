"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getSession, type OperatorSession } from "@/lib/session";
import { toast } from "sonner";
import { PERSONNEL_MAP, MACHINE_MAP, SHIFTS, getMachineKey } from "@/lib/constants";
import type { StartLog } from "@/lib/types";

export default function StartPage() {
  const [session, setSession] = useState<OperatorSession | null>(null);
  const [personnelName, setPersonnelName] = useState("");
  const [shift, setShift] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [logs, setLogs] = useState<StartLog[]>([]);
  const [now, setNow] = useState(new Date());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNote, setEditNote] = useState("");

  useEffect(() => {
    const s = getSession();
    if (s) { setSession(s); fetchLogs(s.id); }
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fetchLogs = async (operatorId: string) => {
    const today = new Date().toISOString().split("T")[0];
    const { data, error } = await supabase
      .from("machine_start_logs")
      .select("*")
      .eq("operator_id", operatorId)
      .gte("start_time", today)
      .order("start_time", { ascending: false });
    if (error) { toast.error("Kayıtlar yüklenemedi"); return; }
    if (data) setLogs(data);
  };

  const handleSave = async () => {
    if (!session) return;
    if (!personnelName) { toast.error("Personel seçiniz"); return; }
    if (!shift) { toast.error("Vardiya seçiniz"); return; }
    setSaving(true);
    const machineName = MACHINE_MAP[getMachineKey(session.role)] || session.role;
    try {
      const { error } = await supabase.from("machine_start_logs").insert({
        operator_id: session.id,
        operator_name: session.displayName,
        personnel_name: personnelName,
        machine_name: machineName,
        shift,
        start_time: new Date().toISOString(),
        note: note || null,
      });
      if (error) throw error;
      toast.success("Başlangıç kaydedildi!");
      setPersonnelName(""); setShift(""); setNote("");
      fetchLogs(session.id);
    } catch (e) {
      console.error(e);
      toast.error("Hata oluştu");
    } finally { setSaving(false); }
  };

  const handleEdit = async (id: string) => {
    if (!session) return;
    const { error } = await supabase.from("machine_start_logs").update({ note: editNote }).eq("id", id);
    if (!error) { toast.success("Kayıt düzeltildi"); setEditingId(null); fetchLogs(session.id); }
    else toast.error("Hata oluştu");
  };

  const fmt = (iso: string) => new Date(iso).toLocaleTimeString("tr-TR");
  const personnel = PERSONNEL_MAP[getMachineKey(session?.role ?? "")] ?? [];
  const machineName = MACHINE_MAP[getMachineKey(session?.role ?? "")] ?? session?.role ?? "";

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-600">
        <h2 className="text-2xl font-black text-gray-800">MAKİNE BAŞLANGICI</h2>
        <p className="text-gray-500 mt-1">{machineName} — Makineyi başlatın ve saati kaydedin</p>
      </div>

      <div className="bg-gray-900 text-white rounded-lg shadow p-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400 uppercase">Şu anki saat</p>
          <p className="text-5xl font-black font-mono">{now.toLocaleTimeString("tr-TR")}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-400">Giriş Yapan</p>
          <p className="text-xl font-bold">{session?.displayName}</p>
          <p className="text-sm text-gray-400 mt-1">{machineName}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Personel <span className="text-red-500">*</span></label>
          <select value={personnelName} onChange={(e) => setPersonnelName(e.target.value)}
            className="w-full border-2 border-gray-300 rounded-lg p-3 text-lg font-bold focus:border-green-500 outline-none bg-white">
            <option value="">— Personel seçiniz —</option>
            {personnel.map((o: string) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Vardiya <span className="text-red-500">*</span></label>
          <select value={shift} onChange={(e) => setShift(e.target.value)}
            className="w-full border-2 border-gray-300 rounded-lg p-3 text-lg font-bold focus:border-green-500 outline-none bg-white">
            <option value="">— Vardiya seçiniz —</option>
            {SHIFTS.map((o: string) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Not (Opsiyonel)</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="Varsa not ekleyiniz"
            className="w-full border-2 border-gray-300 rounded-lg p-3 text-base focus:border-green-500 outline-none min-h-[80px]" />
        </div>
      </div>

      <button onClick={handleSave} disabled={saving}
        className="w-full h-16 bg-green-600 hover:bg-green-700 text-white font-black text-xl rounded-lg transition-all shadow-lg">
        {saving ? "Kaydediliyor..." : "▶ BAŞLAT"}
      </button>

      {logs.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-bold text-gray-700 mb-3">Bugünkü Başlangıçlar</h3>
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="border rounded-lg p-3">
                {editingId === log.id ? (
                  <div className="space-y-2">
                    <p className="font-black text-green-600">{fmt(log.start_time)} — {log.personnel_name}</p>
                    <textarea value={editNote} onChange={(e) => setEditNote(e.target.value)}
                      className="w-full border-2 border-gray-300 rounded-lg p-2 text-sm outline-none"
                      placeholder="Notu düzenle" />
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(log.id)}
                        className="flex-1 bg-green-600 text-white font-bold py-1.5 rounded-lg text-sm">Kaydet</button>
                      <button onClick={() => setEditingId(null)}
                        className="flex-1 bg-gray-200 text-gray-700 font-bold py-1.5 rounded-lg text-sm">İptal</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-black text-green-600 text-lg">{fmt(log.start_time)}</p>
                      <p className="text-sm font-semibold text-gray-700">{log.personnel_name} — {log.machine_name}</p>
                      <p className="text-xs text-gray-500">{log.shift}</p>
                      {log.note && <p className="text-xs text-gray-400">{log.note}</p>}
                    </div>
                    <button onClick={() => { setEditingId(log.id); setEditNote(log.note || ""); }}
                      className="bg-blue-100 hover:bg-blue-200 text-blue-600 font-bold text-xs px-3 py-1.5 rounded-lg">
                      Düzelt
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}