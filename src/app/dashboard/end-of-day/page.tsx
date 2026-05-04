"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getSession } from "@/lib/session";
import { toast } from "sonner";
import { PERSONNEL, MACHINES, SHIFTS } from "@/lib/constants";

export default function EndOfDayPage() {
  const [session, setSession] = useState<any>(null);
  const [personnelName, setPersonnelName] = useState("");
  const [shift, setShift] = useState("");
  const [total, setTotal] = useState("");
  const [waste, setWaste] = useState("");
  const [saving, setSaving] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);

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
    try {
      const { error } = await supabase.from("end_of_day_logs").insert({
        operator_id: session.id,
        operator_name: session.displayName,
        personnel_name: personnelName,
        shift,
        total_cans: Number(total),
        waste_cans: Number(waste),
        net_cans: net,
      });
      if (error) throw error;
      toast.success("Gün sonu kaydedildi!");
      setPersonnelName(""); setShift(""); setTotal(""); setWaste("");
      fetchToday(session.id);
    } catch { toast.error("Hata oluştu"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu kaydı silmek istediğinize emin misiniz?")) return;
    const { error } = await supabase.from("end_of_day_logs").delete().eq("id", id);
    if (!error) { toast.success("Kayıt silindi"); fetchToday(session.id); }
    else toast.error("Silme hatası");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
        <h2 className="text-2xl font-black text-gray-800">GÜN SONU</h2>
        <p className="text-gray-500 mt-1">Günlük üretim sayılarını gir</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        {[
          { label: "Personel", value: personnelName, setter: setPersonnelName, options: PERSONNEL },
          { label: "Vardiya", value: shift, setter: setShift, options: SHIFTS },
        ].map(({ label, value, setter, options }) => (
          <div key={label}>
            <label className="block text-sm font-bold text-gray-700 mb-2">{label} <span className="text-red-500">*</span></label>
            <select value={value} onChange={(e) => setter(e.target.value)}
              className="w-full border-2 border-gray-300 rounded-lg p-3 text-lg font-bold focus:border-orange-500 outline-none bg-white">
              <option value="">— {label} seçiniz —</option>
              {options.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        ))}

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Toplam Çıkan Teneke</label>
          <input type="number" value={total} onChange={(e) => setTotal(e.target.value)}
            placeholder="0"
            className="w-full border-2 border-gray-300 rounded-lg p-3 text-2xl font-bold focus:border-orange-500 outline-none" />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Fire Teneke Sayısı</label>
          <input type="number" value={waste} onChange={(e) => setWaste(e.target.value)}
            placeholder="0"
            className="w-full border-2 border-gray-300 rounded-lg p-3 text-2xl font-bold focus:border-red-500 outline-none" />
        </div>

        <div className="bg-gray-50 rounded-lg p-4 text-center border-2 border-dashed border-gray-300">
          <p className="text-sm text-gray-500">Net Teneke (Otomatik)</p>
          <p className="text-4xl font-black text-green-600">{net}</p>
        </div>

        <button onClick={handleSave} disabled={saving}
          className="w-full h-14 bg-orange-500 hover:bg-orange-600 text-white font-black text-lg rounded-lg transition-all">
          {saving ? "Kaydediliyor..." : " GÜN SONUNU KAYDET"}
        </button>
      </div>

      {logs.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-bold text-gray-700 mb-3">Bugünkü Gün Sonu Kayıtları</h3>
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="border rounded-lg p-3 flex justify-between items-center">
                <div>
                  <p className="font-bold text-sm">🏭 {log.machine_name} | ⏰ {log.shift}</p>
                  <p className="text-sm text-gray-600">👤 {log.personnel_name}</p>
                  <p className="text-xs text-gray-500">
                    Toplam: <b>{log.total_cans}</b> | Fire: <b className="text-red-600">{log.waste_cans}</b> | Net: <b className="text-green-600">{log.net_cans}</b>
                  </p>
                </div>
                <button onClick={() => handleDelete(log.id)}
                  className="bg-red-100 hover:bg-red-200 text-red-600 font-bold text-xs px-3 py-1 rounded-lg">
                  Sil
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}