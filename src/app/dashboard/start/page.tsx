"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { OperatorSession } from "@/lib/session";
import { toast } from "sonner";
import { PERSONNEL_MAP, MACHINE_MAP, SHIFTS, getMachineKey } from "@/lib/constants";
import type { StartLog } from "@/lib/types";
import { todayTR, startOfDayTR, endOfDayTR } from "@/lib/dateUtils";
import { writeAuditLog } from "@/lib/audit";


const PRODUCTS_MAP: Record<string, string[]> = {
  dolum: ["330 ML", "500 ML", "250 ML"],
  depal: ["330 ML", "500 ML", "250 ML"],
  paketleme: ["330 ML", "500 ML", "250 ML"],
  paletleme: ["330 ML", "500 ML", "250 ML"],
  pet_dolum: ["2.5 LT", "1.5 LT", "1 LT"],
  pet_sisirme: ["2.5 LT", "1.5 LT", "1 LT"],
  pet_etiketleme: ["2.5 LT", "1.5 LT", "1 LT"],
  pet_paketleme: ["2.5 LT", "1.5 LT", "1 LT"],
  pet_paletleme: ["2.5 LT", "1.5 LT", "1 LT"],
  cam_dolum: ["250 ML", "500 ML"],
  cam_depal: ["250 ML", "500 ML"],
  cam_etiket: ["250 ML", "500 ML"],
  cam_paketleme: ["250 ML", "500 ML"],
  cam_paletleme: ["250 ML", "500 ML"],
};

export default function StartPage() {
  const [session, setSession] = useState<OperatorSession | null>(null);
  const [personnelName, setPersonnelName] = useState("");
  const [shift, setShift] = useState("");
  const [productType, setProductType] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [logs, setLogs] = useState<StartLog[]>([]);
  const [now, setNow] = useState(new Date());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNote, setEditNote] = useState("");

  useEffect(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (!session) return;
    const s = {
      id: session.user.id,
      role: session.user.user_metadata?.role || "",
      displayName: session.user.user_metadata?.display_name || "",
      username: session.user.email || "",
    };
    setSession(s);
    fetchLogs(s.id);
  });
  const t = setInterval(() => setNow(new Date()), 1000);
  return () => clearInterval(t);
}, []);
  const fetchLogs = async (operatorId: string) => {
    const today = todayTR();
    const { data, error } = await supabase
      .from("machine_start_logs")
      .select("*")
      .eq("operator_id", operatorId)
      .gte("start_time", startOfDayTR(today))
      .lte("start_time", endOfDayTR(today))
      .order("start_time", { ascending: false });
    if (error) { toast.error("Kayıtlar yüklenemedi"); return; }
    if (data) setLogs(data);
  };

  

  const handleSave = async () => {
  if (!session) return;
  if (!personnelName) { toast.error("Personel seçiniz"); return; }
  if (!shift) { toast.error("Vardiya seçiniz"); return; }
  if (!productType) { toast.error("Ürün seçiniz"); return; }

  // Çift kayıt kontrolü
  setSaving(true);
  const existing = await supabase
    .from("machine_start_logs")
    .select("id")
    .eq("operator_id", session.id)
    .eq("shift", shift)
    .gte("start_time", startOfDayTR(todayTR()))
    .lte("start_time", endOfDayTR(todayTR()))
    .limit(1);

  if (existing.data && existing.data.length > 0) {
    toast.error("Bu vardiya için zaten start kaydı var!");
    setSaving(false);
    return;
  }
    const machineName = MACHINE_MAP[getMachineKey(session.role)] || session.role;
    const machineStart = await supabase
      .from("machine_start_logs")
      .select("id")
      .eq("machine_name", machineName)
      .gte("start_time", startOfDayTR(todayTR()))
      .lte("start_time", endOfDayTR(todayTR()))
      .limit(1);
    if (machineStart.data && machineStart.data.length > 0) {
      toast.error("Bu makine için bugün zaten start kaydı var!");
      setSaving(false);
      return;
    }
    try {
     const { data: insertedData, error } = await supabase.from("machine_start_logs").insert({
  operator_id: session.id,
  operator_name: session.displayName,
  personnel_name: personnelName,
  machine_name: machineName,
  shift,
  product_type: productType,
  start_time: new Date().toISOString(),
  note: note || null,
}).select().single();

if (error) throw error;
toast.success("Başlangıç kaydedildi!");
await writeAuditLog({
  action: "INSERT",
  tableName: "machine_start_logs",
  recordId: insertedData?.id,
  newData: { machine_name: machineName, shift, product_type: productType, personnel_name: personnelName },
});
      setPersonnelName(""); setShift(""); setProductType(""); setNote("");
      fetchLogs(session.id);
    } catch (e) {
      console.error(e);
      toast.error("Hata oluştu");
    } finally { setSaving(false); }
  };

  const handleEdit = async (id: string) => {
    if (!session) return;
    const { error } = await supabase.from("machine_start_logs").update({ note: editNote }).eq("id", id).eq("operator_id", session.id);
    if (!error) { toast.success("Kayıt düzeltildi"); setEditingId(null); fetchLogs(session.id); }
    else toast.error("Hata oluştu");
  };

  const fmt = (iso: string) => new Date(iso).toLocaleTimeString("tr-TR");
  const personnel = PERSONNEL_MAP[getMachineKey(session?.role ?? "")] ?? [];
  const machineName = MACHINE_MAP[getMachineKey(session?.role ?? "")] ?? session?.role ?? "";
  const products = PRODUCTS_MAP[getMachineKey(session?.role ?? "")] ?? [];

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

        {/* Ürün Seçimi */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Ürün <span className="text-red-500">*</span></label>
          <div className="grid grid-cols-3 gap-3">
            {products.map((p) => (
              <button key={p} type="button"
                onClick={() => setProductType(p)}
                className={`py-4 rounded-xl font-black text-lg border-2 transition-all ${
                  productType === p
                    ? "bg-green-600 border-green-600 text-white shadow-lg scale-105"
                    : "bg-white border-gray-300 text-gray-700 hover:border-green-400"
                }`}>
                {p}
              </button>
            ))}
          </div>
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
        {saving ? "Kaydediliyor..." : " BAŞLAT"}
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
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-sm font-semibold text-gray-700">{log.personnel_name} — {log.machine_name}</p>
                        {log.product_type && (
                          <span className="text-xs bg-green-100 text-green-700 font-black px-2 py-0.5 rounded-full">
                            {log.product_type}
                          </span>
                        )}
                      </div>
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