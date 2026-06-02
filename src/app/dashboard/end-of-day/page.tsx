"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { OperatorSession } from "@/lib/session";
import { toast } from "sonner";
import { PERSONNEL_MAP, MACHINE_MAP, SHIFTS, getMachineKey } from "@/lib/constants";
import { todayTR, startOfDayTR, endOfDayTR } from "@/lib/dateUtils";
import { writeAuditLog } from "@/lib/audit";



// 330 ML parametreleri
const PARAMS_330 = {
  DEPAL_PER_PALET: 8096,
  DOLUM_MAX: 288000,
  PAKETLEME_MAX: 12000,
  PALETLEME_MAX: 120,
  KOLI_BASI: 24,
  PALET_BASI_KOLI: 100,
};

const MACHINE_CONFIG: Record<string, {
  fields: { key: string; label: string; placeholder: string; unit: string }[];
  description: string;
}> = {
  dolum: {
    description: "Net üretim ve fire adet giriniz",
    fields: [
      { key: "total", label: "Toplam Çıkan Kutu", placeholder: "0", unit: "adet" },
      { key: "fire", label: "Fire Kutu", placeholder: "0", unit: "adet" },
    ],
  },
  depal: {
    description: "Gönderilen palet sayısını giriniz",
    fields: [
      { key: "total", label: "Gönderilen Palet Sayısı", placeholder: "0", unit: "palet" },
      { key: "fire", label: "Fire Palet", placeholder: "0", unit: "palet" },
    ],
  },
  paketleme: {
    description: "Net koli ve fire adet giriniz",
    fields: [
      { key: "total", label: "Toplam Çıkan Koli", placeholder: "0", unit: "koli" },
      { key: "fire", label: "Fire Adet", placeholder: "0", unit: "adet" },
    ],
  },
  paletleme: {
    description: "Net palet ve fire koli giriniz",
    fields: [
      { key: "total", label: "Toplam Çıkan Palet", placeholder: "0", unit: "palet" },
      { key: "fire", label: "Fire Koli", placeholder: "0", unit: "koli" },
    ],
  },
};

export default function EndOfDayPage() {
  const [session, setSession] = useState<OperatorSession | null>(null);
  const [personnelName, setPersonnelName] = useState("");
  const [shift, setShift] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});

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
    fetchToday(s.id);
  });
}, []);
  const fetchToday = async (operatorId: string) => {
  const today = todayTR();
  const { data } = await supabase
    .from("end_of_day_logs")
    .select("*")
    .eq("operator_id", operatorId)
    .gte("created_at", startOfDayTR(today))
    .lt("created_at", endOfDayTR(today))
    .order("created_at", { ascending: false });
  if (data) setLogs(data);
};

  const machineKey = getMachineKey(session?.role ?? "");
  const machineName = MACHINE_MAP[machineKey] ?? session?.role ?? "";
  const personnel = PERSONNEL_MAP[machineKey] ?? [];
  const config = MACHINE_CONFIG[machineKey];

  // Anlık hesaplamalar
  const total = Number(values.total || 0);
  const fire = Number(values.fire || 0);
  const net = Math.max(0, total - fire);

  // Depal hesabı
  const depalGonderilen = net * PARAMS_330.DEPAL_PER_PALET;
  const depalFire = fire * PARAMS_330.DEPAL_PER_PALET;
  const depalEff = Math.round((depalGonderilen / PARAMS_330.DOLUM_MAX) * 100);

  // Dolum hesabı
  const dolumEff = Math.round((net / PARAMS_330.DOLUM_MAX) * 100);

  // Paketleme hesabı
  const paketlemeFireKoli = Math.round(fire / PARAMS_330.KOLI_BASI * 10) / 10;
  const paketlemeEff = Math.round((total / PARAMS_330.PAKETLEME_MAX) * 100);

  // Paletleme hesabı
  const paletlemeFireAdet = fire * PARAMS_330.KOLI_BASI;
  const paletlemeEff = Math.round((total / PARAMS_330.PALETLEME_MAX) * 100);

  const handleSave = async () => {
  if (!session) return;
  if (!personnelName) { toast.error("Personel seçiniz"); return; }
  if (!shift) { toast.error("Vardiya seçiniz"); return; }
  if (!values.total && machineKey !== "depal") { toast.error("Toplam değeri giriniz"); return; }
  if (machineKey === "depal" && !values.total) { toast.error("Palet sayısını giriniz"); return; }

  // Çift kayıt kontrolü
  setSaving(true);
  const existing = await supabase
    .from("end_of_day_logs")
    .select("id")
    .eq("operator_id", session.id)
    .eq("shift", shift)
    .gte("created_at", startOfDayTR(todayTR()))
    .limit(1);

  if (existing.data && existing.data.length > 0) {
    toast.error("Bu vardiya için zaten kapanış kaydı var!");
    setSaving(false);
    return;
  }
    const machineNameCheck = MACHINE_MAP[machineKey] ?? session.role;
    const existingMachine = await supabase
      .from("end_of_day_logs")
      .select("id")
      .eq("machine_name", machineNameCheck)
      .eq("shift", shift)
      .gte("created_at", startOfDayTR(todayTR()))
      .lt("created_at", endOfDayTR(todayTR()))
      .limit(1);
    if (existingMachine.data && existingMachine.data.length > 0) {
      toast.error("Bu makine ve vardiya için zaten kapanış kaydı var!");
      setSaving(false);
      return;
    }
    if (!session) return;
    if (!personnelName) { toast.error("Personel seçiniz"); return; }
    if (!shift) { toast.error("Vardiya seçiniz"); return; }
    if (!values.total && machineKey !== "depal") { toast.error("Toplam değeri giriniz"); return; }
    if (machineKey === "depal" && !values.total) { toast.error("Palet sayısını giriniz"); return; }

    setSaving(true);
    try {
      let insertData: any = {
        operator_id: session.id,
        operator_name: session.displayName,
        personnel_name: personnelName,
        machine_name: machineName,
        shift,
        product_type: "330 ML",
      };

      if (machineKey === "depal") {
        insertData = {
          ...insertData,
          total_cans: total * PARAMS_330.DEPAL_PER_PALET,
          waste_cans: fire * PARAMS_330.DEPAL_PER_PALET,
          net_cans: depalGonderilen,
          stop_minutes: 0,
          fire_count: fire,
          fire_unit: "palet",
        };
      } else if (machineKey === "dolum") {
        insertData = {
          ...insertData,
          total_cans: total,
          waste_cans: fire,
          net_cans: net,
          stop_minutes: 0,
          fire_count: fire,
          fire_unit: "adet",
        };
      } else if (machineKey === "paketleme") {
        insertData = {
          ...insertData,
          total_cans: total,
          waste_cans: fire,
          net_cans: total,
          stop_minutes: 0,
          fire_count: fire,
          fire_unit: "adet",
        };
      } else if (machineKey === "paletleme") {
        insertData = {
          ...insertData,
          total_cans: total,
          waste_cans: fire,
          net_cans: total,
          stop_minutes: 0,
          fire_count: fire,
          fire_unit: "koli",
        };
      } else {
        insertData = {
          ...insertData,
          total_cans: total,
          waste_cans: fire,
          net_cans: net,
          stop_minutes: 0,
          fire_count: fire,
          fire_unit: "adet",
        };
      }

      const { error } = await supabase.from("end_of_day_logs").insert(insertData);
      if (error) throw error;
      toast.success("Kapanış kaydedildi!");
      setPersonnelName(""); setShift(""); setValues({});
      fetchToday(session.id);
      await writeAuditLog({
  action: "INSERT",
  tableName: "end_of_day_logs",
  newData: { machine_name: machineName, shift, product_type: "330 ML" },
});
    } catch { toast.error("Hata oluştu"); }
    finally { setSaving(false); }
  };

  const handleEdit = async (id: string) => {
    if (!session) return;
    const { error } = await supabase.from("end_of_day_logs").update({
      total_cans: Number(editValues.total || 0),
      waste_cans: Number(editValues.fire || 0),
      net_cans: Math.max(0, Number(editValues.total || 0) - Number(editValues.fire || 0)),
      fire_count: Number(editValues.fire || 0),
    }).eq("id", id).eq("operator_id", session.id);
    if (!error) { toast.success("Kayıt düzeltildi"); setEditingId(null); fetchToday(session.id); }
    else toast.error("Hata oluştu");
  };

  const getLogSummary = (log: any) => {
    if (machineKey === "depal") return `${log.fire_count} palet fire | Gönderilen: ${log.net_cans?.toLocaleString("tr-TR")} adet`;
    if (machineKey === "paketleme") return `Net: ${log.total_cans} koli | Fire: ${log.fire_count} adet`;
    if (machineKey === "paletleme") return `Net: ${log.total_cans} palet | Fire: ${log.fire_count} koli`;
    return `Toplam: ${log.total_cans?.toLocaleString("tr-TR")} | Fire: ${log.waste_cans} | Net: ${log.net_cans?.toLocaleString("tr-TR")}`;
  };

  if (!config) {
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
            <label className="block text-sm font-bold text-gray-700 mb-2">Net Üretim</label>
            <input type="number" value={values.total || ""} onChange={(e) => setValues({ ...values, total: e.target.value })}
              placeholder="0" className="w-full border-2 border-gray-300 rounded-lg p-3 text-2xl font-bold focus:border-orange-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Fire</label>
            <input type="number" value={values.fire || ""} onChange={(e) => setValues({ ...values, fire: e.target.value })}
              placeholder="0" className="w-full border-2 border-gray-300 rounded-lg p-3 text-2xl font-bold focus:border-red-500 outline-none" />
          </div>
          <button onClick={handleSave} disabled={saving}
            className="w-full h-14 bg-orange-500 hover:bg-orange-600 text-white font-black text-lg rounded-lg transition-all">
            {saving ? "Kaydediliyor..." : "✓ KAPANIŞI KAYDET"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
        <h2 className="text-2xl font-black text-gray-800">KAPANIŞ</h2>
        <p className="text-gray-500 mt-1">{machineName} — {config.description}</p>
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

        {config.fields.map(field => (
          <div key={field.key}>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              {field.label} <span className="text-gray-400 font-normal">({field.unit})</span>
            </label>
            <input type="number"
              value={values[field.key] || ""}
              onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
              placeholder={field.placeholder}
              className="w-full border-2 border-gray-300 rounded-lg p-3 text-2xl font-bold focus:border-orange-500 outline-none" />
          </div>
        ))}

        {/* Anlık özet kartı */}
        {values.total && (
          <div className="rounded-xl p-4 border-2 border-dashed border-orange-300 bg-orange-50 space-y-2">
            {machineKey === "depal" && (
              <>
                <p className="text-sm font-black text-orange-700">Depal Hesabı (330 ML)</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-white rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-500">Gönderilen</p>
                    <p className="font-black text-blue-600">{depalGonderilen.toLocaleString("tr-TR")} adet</p>
                    <p className="text-xs text-gray-400">{net} palet × 8.096</p>
                  </div>
                  <div className="bg-white rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-500">Fire</p>
                    <p className="font-black text-red-500">{depalFire.toLocaleString("tr-TR")} adet</p>
                    <p className="text-xs text-gray-400">{fire} palet × 8.096</p>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-2 text-center">
                  <p className="text-xs text-gray-500">Verimlilik</p>
                  <p className={`text-2xl font-black ${depalEff >= 90 ? "text-green-600" : depalEff >= 75 ? "text-orange-500" : "text-red-500"}`}>
                    %{Math.min(100, depalEff)}
                  </p>
                  <p className="text-xs text-gray-400">{depalGonderilen.toLocaleString("tr-TR")} / 288.000</p>
                </div>
              </>
            )}

            {machineKey === "dolum" && (
              <>
                <p className="text-sm font-black text-orange-700">Dolum Hesabı (330 ML)</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-white rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-500">Net Üretim</p>
                    <p className="font-black text-green-600">{net.toLocaleString("tr-TR")} adet</p>
                  </div>
                  <div className="bg-white rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-500">Verimlilik</p>
                    <p className={`text-2xl font-black ${dolumEff >= 90 ? "text-green-600" : dolumEff >= 75 ? "text-orange-500" : "text-red-500"}`}>
                      %{Math.min(100, dolumEff)}
                    </p>
                  </div>
                </div>
              </>
            )}

            {machineKey === "paketleme" && (
              <>
                <p className="text-sm font-black text-orange-700">Paketleme Hesabı (330 ML)</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-white rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-500">Net Koli</p>
                    <p className="font-black text-green-600">{total} koli</p>
                    <p className="text-xs text-gray-400">Fire: {fire} adet = {paketlemeFireKoli} koli</p>
                  </div>
                  <div className="bg-white rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-500">Verimlilik</p>
                    <p className={`text-2xl font-black ${paketlemeEff >= 90 ? "text-green-600" : paketlemeEff >= 75 ? "text-orange-500" : "text-red-500"}`}>
                      %{Math.min(100, paketlemeEff)}
                    </p>
                    <p className="text-xs text-gray-400">{total} / 12.000</p>
                  </div>
                </div>
              </>
            )}

            {machineKey === "paletleme" && (
              <>
                <p className="text-sm font-black text-orange-700">Paletleme Hesabı (330 ML)</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-white rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-500">Net Palet</p>
                    <p className="font-black text-green-600">{total} palet</p>
                    <p className="text-xs text-gray-400">Fire: {fire} koli = {paletlemeFireAdet} adet</p>
                  </div>
                  <div className="bg-white rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-500">Verimlilik</p>
                    <p className={`text-2xl font-black ${paletlemeEff >= 90 ? "text-green-600" : paletlemeEff >= 75 ? "text-orange-500" : "text-red-500"}`}>
                      %{Math.min(100, paletlemeEff)}
                    </p>
                    <p className="text-xs text-gray-400">{total} / 120</p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

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
                        <input type="number" value={editValues.total || ""}
                          onChange={(e) => setEditValues({ ...editValues, total: e.target.value })}
                          className="w-full border-2 border-gray-300 rounded-lg p-2 font-bold outline-none" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Fire</label>
                        <input type="number" value={editValues.fire || ""}
                          onChange={(e) => setEditValues({ ...editValues, fire: e.target.value })}
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
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm">{log.personnel_name} | {log.shift}</p>
                        {log.product_type && (
                          <span className="text-xs bg-orange-100 text-orange-700 font-black px-2 py-0.5 rounded-full">
                            {log.product_type}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{getLogSummary(log)}</p>
                    </div>
                    <button onClick={() => {
                      setEditingId(log.id);
                      setEditValues({
                        total: log.total_cans?.toString() || "",
                        fire: log.fire_count?.toString() || "",
                      });
                    }}
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