"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getSession } from "@/lib/session";
import { toast } from "sonner";
import { PERSONNEL_MAP, MACHINE_MAP, SHIFTS, UNIT_MAP } from "@/lib/constants";

export default function EndOfDayPage() {
  const [session, setSession] = useState<any>(null);
  const [personnelName, setPersonnelName] = useState("");
  const [shift, setShift] = useState("");
  const [total, setTotal] = useState("");
  const [waste, setWaste] = useState("");
  const [saving, setSaving] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTotal, setEditTotal] = useState("");
  const [editWaste, setEditWaste] = useState("");

  useEffect(() => {
    const s = getSession();
    if (s) { setSession(s); fetchToday(s.id); }
  }, []);

  const fetchToday = async (operatorId: string) => {
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("end_of_day_logs")
      .select("*")
      .eq("operator_id", operatorId)
      .gte("created_at", today)
      .order("created_at", { ascending: false });
    if (data) setLogs(data);
  };

  const net = Math.max(0, Number(total || 0) - Number(waste || 0));

  const handleSave = async () => {
    if (!personnelName) { toast.error("Personel seçiniz"); return; }
    if (!shift) { toast.error("Vardiya seçiniz"); return; }
    if (!total || !waste) { toast.error("Teneke sayılarını giriniz"); return; }
    setSaving(true);
    const machineName = MACHINE_MAP[session.role] || "Bilinmiyor";
    try {
      const { error } = await supabase.from("end_of_day_logs").insert({
        operator_id: session.id,
        operator_name: session.displayName,
        personnel_name: personnelName,
        machine_name: machineName,
        shift,
        total_cans: Number(total),
        waste_cans: Number(waste),
        net_cans: net,
      });
      if (error) throw error;
      toast.success("Kapanış kaydedildi!");
      setPersonnelName(""); setShift(""); setTotal(""); setWaste("");
      fetchToday(session.id);
    } catch { toast.error("Hata oluştu"); }
    finally { setSaving(false); }
  };

  const handleEdit = async (id: string) => {
    const editNet = Math.max(0, Number(editTotal) - Number(editWaste));
    const { error } = await supabase.from("end_of_day_logs").update({
      total_cans: Number(editTotal),
      waste_cans: Number(editWaste),
      net_cans: editNet,
    }).eq("id", id);
    if (!error) { toast.success("Kayıt düzeltildi"); setEditingId(null); fetchToday(session.id); }
    else toast.error("Hata oluştu");
  };

  const personnel = PERSONNEL_MAP[session?.role] || [];
  const machineName = MACHINE_MAP[session?.role] || "Bilinmiyor";
  const unit = UNIT_MAP[session?.role] || "Adet";

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
        <h2 className="text-2xl font-black text-gray-800">KAPANIŞ</h2>
        <p className="text-gray-500 mt-1">{machineName} — Günlük üretim sayılarını gir</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Personel <span className="text-red-500">*</span></label>
          <select value={personnelName} onChange={(e) => setPersonnelName(e.target.value)}
            className="w-full border-2 border-gray-300 rounded-lg p-3 text-lg font-bold focus:border-orange-500 outline-none bg-white">
            <option value="">— Personel seçiniz —</option>
            {personnel.map((o: string) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Vardiya <span className="text-red-500">*</span></label>
          <select value={shift} onChange={(e) => setShift(e.target.value)}
            className="w-full border-2 border-gray-300 rounded-lg p-3 text-lg font-bold focus:border-orange-500 outline-none bg-white">
            <option value="">— Vardiya seçiniz —</option>
            {SHIFTS.map((o: string) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">
  Toplam Çıkan {unit}
</label>
          <input type="number" value={total} onChange={(e) => setTotal(e.target.value)} placeholder="0"
            className="w-full border-2 border-gray-300 rounded-lg p-3 text-2xl font-bold focus:border-orange-500 outline-none" />
        </div>
        <div>
         <label className="block text-sm font-bold text-gray-700 mb-2">
  Fire {unit} Sayısı
</label>
          <input type="number" value={waste} onChange={(e) => setWaste(e.target.value)} placeholder="0"
            className="w-full border-2 border-gray-300 rounded-lg p-3 text-2xl font-bold focus:border-red-500 outline-none" />
        </div>
        <div className="bg-gray-50 rounded-lg p-4 text-center border-2 border-dashed border-gray-300">
          <p className="text-sm text-gray-500">Net {unit} (Otomatik)</p>
          <p className="text-4xl font-black text-green-600">{net}</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="w-full h-14 bg-orange-500 hover:bg-orange-600 text-white font-black text-lg rounded-lg transition-all">
          {saving ? "Kaydediliyor..." : "✓ KAPANIŞI KAYDET"}
        </button>
      </div>

      {logs.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-bold text-gray-700 mb-3">Bugünkü Kapanışlar</h3>
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="border rounded-lg p-3">
                {editingId === log.id ? (
                  <div className="space-y-2">
                    <p className="font-bold text-sm text-gray-700">{log.personnel_name} | {log.shift}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-500">Toplam</label>
                        <input type="number" value={editTotal} onChange={(e) => setEditTotal(e.target.value)}
                          className="w-full border-2 border-gray-300 rounded-lg p-2 font-bold outline-none" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Fire</label>
                        <input type="number" value={editWaste} onChange={(e) => setEditWaste(e.target.value)}
                          className="w-full border-2 border-gray-300 rounded-lg p-2 font-bold outline-none" />
                      </div>
                    </div>
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
                      <p className="font-bold text-sm">{log.personnel_name} | {log.shift}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Toplam: <b>{log.total_cans}</b> | Fire: <b className="text-red-600">{log.waste_cans}</b> | Net: <b className="text-green-600">{log.net_cans}</b>
                      </p>
                    </div>
                    <button onClick={() => { setEditingId(log.id); setEditTotal(log.total_cans.toString()); setEditWaste(log.waste_cans.toString()); }}
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