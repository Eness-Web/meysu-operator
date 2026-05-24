"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/integrations/supabase/client";
import { saveSession, getSession } from "@/lib/session";
import { toast } from "sonner";
import { LogIn } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const s = getSession();
    if (s) router.replace("/dashboard");
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) { toast.error("Kullanıcı adı ve şifre giriniz"); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("operator_accounts")
        .select("id, username, password, display_name, role")
        .eq("username", username.trim().toUpperCase())
        .eq("password", password)
        .maybeSingle();

      if (error) throw error;
      if (!data) { toast.error("Kullanıcı adı veya şifre hatalı"); return; }
      saveSession({ id: data.id, username: data.username, displayName: data.display_name, role: data.role });
      toast.success(`Hoş geldin, ${data.display_name}`);
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      toast.error("Giriş yapılırken hata oluştu");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden p-6">

      {/* Arka plan silüeti */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <img src="/meysu-logo.png" alt=""
          className="w-[600px] h-[600px] object-contain opacity-[0.06] rotate-[-10deg]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="/meysu-logo.png" alt="Meysu Logo"
              className="w-32 h-32 object-contain drop-shadow-xl" />
          </div>
          <h1 className="text-4xl font-black text-gray-800 tracking-tight">MEYSU GIDA</h1>
          <p className="text-gray-500 mt-2 font-medium">Kutu Hattı Dolum Takip Sistemi</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-xl">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Kullanıcı Adı</label>
              <input value={username} onChange={(e) => setUsername(e.target.value.toUpperCase())}
                placeholder="ÖRN: KUTU DOLUM"
                className="w-full border-2 border-gray-200 rounded-xl p-3 text-lg font-bold uppercase text-gray-800 focus:border-red-500 outline-none transition-all"
                autoComplete="off" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Şifre</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border-2 border-gray-200 rounded-xl p-3 text-lg font-bold text-gray-800 focus:border-red-500 outline-none transition-all"
                autoComplete="off" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full h-14 bg-red-600 hover:bg-red-700 text-white font-black text-lg rounded-xl transition-all flex items-center justify-center gap-2">
              <LogIn className="w-5 h-5" />
              {loading ? "Giriş yapılıyor..." : "GİRİŞ YAP"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}