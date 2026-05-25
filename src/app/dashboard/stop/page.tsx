"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getSession, type OperatorSession } from "@/lib/session";
import { toast } from "sonner";
import { PERSONNEL_MAP, MACHINE_MAP, SHIFTS, STOP_REASONS, getMachineKey } from "@/lib/constants";
import type { StopLog } from "@/lib/types";

export default function StopPage() {
  const [session, setSession] = useState<OperatorSession | null>(null);
  const [personnelName, setPersonnelName] = useState("");
  const [shift, setShift] = useState("");
  const [reason, setReason] = useState("");
  const [solution, setSolution] = useState("");
  const [saving, setSaving] = useState(false);
  const [activeLog, setActiveLog] = useState<StopLog | null>(null);
  const [logs, setLogs] = useState<StopLog[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSolution, setEditSolution] = useState("");

  useEffect(() => {
    const s = getSession();
    if (s) { setSession(s); fetchLogs(s.id); }
  }, []);

  const fetchLogs = async (operatorId: string) => {
    const today = new Date().toISOString().split("T")[0];
    const { data, error } = await supabase
      .from("machine_stop_logs")
      .select("*")
      .eq("operator_id", operatorId)
      .gte("created_at", today)
      .order("created_at", { ascending: false });
    if (error) { toast.error("Kayıtlar yüklenemedi"); return; }
    if (data) {
      setLogs(data);
      setActiveLog(data.find((l) => !l.end_time) ?? null);
    }
  };

  const handleStart = async () => {
    if (!session) return;
    if (!personnelName) { toast.error("Personel seçiniz"); return; }
    if (!shift) { toast.error("Vardiya seçiniz"); return; }
    if (!reason) { toast.error("Durma nedeni seçiniz"); return; }
    setSaving(true);
    const machineName = MACHINE_MAP[getMachineKey(session.role)] || session.role;
    try {
      const { data, error } = await supabase.from("machine_stop_logs").insert({
        operator_id: session.id,
        operator_name: session.displayName,
        personnel_name: personnelName,
        machine_name: machineName,
        shift,
        stop_reason: reason,
        start_time: new Date().toISOString(),
      }).select().single();
      if (error) throw error;
      toast.success("Duruş başlangıcı kaydedildi");
      setActiveLog(data);
      setPersonnelName(""); setShift(""); setReason("");
      fetchLogs(session.id);
    } catch { toast.error("Hata oluştu"); }
    finally { setSaving(false); }
  };

  const handleEnd = async () => {
    if (!session || !activeLog) return;
    if (!solution) { toast.error("Çözüm açıklaması yazınız"); return; }
    setSaving(true);
    try {
      const endTime = new Date();
      const startTime = new Date(activeLog.start_time);
      const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);
      const { error } = await supabase.from("machine_stop_logs").update({
        end_time: endTime.toISOString(),
        duration_minutes: durationMinutes,
        solution,
      }).eq("id", activeLog.id);
      if (error) throw error;
      toast.success(`Duruş bitti! Süre: ${durationMinutes} dakika`);
      setActiveLog(null); setSolution("");
      fetchLogs(session.id);
    } catch { toast.error("Hata oluştu"); }
    finally { setSaving(false); }
  };

  const handleEdit = async (id: string) => {
    if (!session) return;
    const { error } = await supabase.from("machine_stop_logs").update({ solution: editSolution }).eq("id", id);
    if (!error) { toast.success("Düzeltildi"); setEditingId(null); fetchLogs(session.id); }
    else toast.error("Hata oluştu");
  };

  const fmt = (iso: string) => new Date(iso).toLocaleTimeString("tr-TR");
  const personnel = PERSONNEL_MAP[getMachineKey(session?.role ?? "")] ?? [];
  const machineName = MACHINE_MAP[getMachineKey(session?.role ?? "")] ?? session?.role ?? "";

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-600">
        <h2 className="text-2xl font-black text-gray-800">DURMA KAYDI</h2>
        <p className="text-gray-500 mt-1">{machineName} — Duruş nedenini seç ve saatleri kaydet</p>
      </div>

      {activeLog ? (
        <div className="bg-red-50 border-2 border-red-500 rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <p className="font-bold text-red-700">AKTİF DURUŞ</p>
          </div>
          <div className="bg-white rounded p-4 space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-gray-500">Personel</p><p className="font-black">{activeLog.personnel_name}</p></div>
              <div><p className="text-xs text-gray-500">Makine</p><p className="font-black">{activeLog.machine_name}</p></div>
              <div><p className="text-xs text-gray-500">Vardiya</p><p className="font-bold text-sm">{activeLog.shift}</p></div>
              <div><p className="text-xs text-gray-500">Duruş Nedeni</p><p className="font-black">{activeLog.stop_reason}</p></div>
            </div>
            <div><p className="text-xs text-gray-500">Başlangıç Saati</p>
              <p className="font-bold text-red-600 text-2xl">{fmt(activeLog.start_time)}</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Çözüm Açıklaması</label>
            <textarea value={solution} onChange={(e) => setSolution(e.target.value)}
              placeholder="Sorunu nasıl çözdünüz?"
              className="w-full border-2 border-gray-300 rounded-lg p-3 text-base focus:border-red-500 outline-none min-h-[100px]" />
          </div>
          <button onClick={handleEnd} disabled={saving}
            className="w-full h-14 bg-red-600 hover:bg-red-700 text-white font-black text-lg rounded-lg transition-all">
            {saving ? "Kaydediliyor..." : " BİTİŞ SAATİNİ KAYDET"}
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Personel <span className="text-red-500">*</span></label>
            <select value={personnelName} onChange={(e) => setPersonnelName(e.target.value)}
              className="w-full border-2 border-gray-300 rounded-lg p-3 text-lg font-bold focus:border-red-500 outline-none bg-white">
              <option value="">— Personel seçiniz —</option>
              {personnel.map((o: string) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Vardiya <span className="text-red-500">*</span></label>
            <select value={shift} onChange={(e) => setShift(e.target.value)}
              className="w-full border-2 border-gray-300 rounded-lg p-3 text-lg font-bold focus:border-red-500 outline-none bg-white">
              <option value="">— Vardiya seçiniz —</option>
              {SHIFTS.map((o: string) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Durma Nedeni <span className="text-red-500">*</span></label>
            <select value={reason} onChange={(e) => setReason(e.target.value)}
              className="w-full border-2 border-gray-300 rounded-lg p-3 text-lg font-bold focus:border-red-500 outline-none bg-white">
              <option value="">— Neden seçiniz —</option>
              {STOP_REASONS.map((o: string) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <button onClick={handleStart} disabled={saving}
            className="w-full h-14 bg-red-600 hover:bg-red-700 text-white font-black text-lg rounded-lg transition-all">
            {saving ? "Kaydediliyor..." : " BAŞLANGIÇ SAATİNİ KAYDET"}
          </button>
        </div>
      )}

      {logs.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-bold text-gray-700 mb-3">Bugünkü Duruşlar</h3>
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="border rounded-lg p-3">
                {editingId === log.id ? (
                  <div className="space-y-2">
                    <p className="font-bold text-sm">{log.stop_reason} — {fmt(log.start_time)}</p>
                    <textarea value={editSolution} onChange={(e) => setEditSolution(e.target.value)}
                      className="w-full border-2 border-gray-300 rounded-lg p-2 text-sm outline-none"
                      placeholder="Çözümü düzenle" />
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(log.id)}
                        className="flex-1 bg-green-600 text-white font-bold py-1.5 rounded-lg text-sm">Kaydet</button>
                      <button onClick={() => setEditingId(null)}
                        className="flex-1 bg-gray-200 text-gray-700 font-bold py-1.5 rounded-lg text-sm">İptal</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-sm">{log.stop_reason} — {log.machine_name}</p>
                      <p className="text-sm text-gray-600">{log.personnel_name} | {log.shift}</p>
                      <p className="text-xs text-gray-500">
                        {fmt(log.start_time)} → {log.end_time ? fmt(log.end_time) : "devam ediyor"}
                        {log.duration_minutes && <span className="ml-2 font-bold text-red-600">({log.duration_minutes} dk)</span>}
                      </p>
                      {log.solution && <p className="text-xs text-green-600 mt-1">✓ {log.solution}</p>}
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <span className={`text-xs font-bold px-2 py-1 rounded ${log.end_time ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {log.end_time ? "Tamamlandı" : "Açık"}
                      </span>
                      <button onClick={() => { setEditingId(log.id); setEditSolution(log.solution || ""); }}
                        className="bg-blue-100 hover:bg-blue-200 text-blue-600 font-bold text-xs px-3 py-1 rounded-lg">
                        Düzelt
                      </button>
                    </div>
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