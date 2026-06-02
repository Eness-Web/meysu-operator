"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LogIn } from "lucide-react";


function usernameToEmail(username: string): string {
  const map: Record<string, string> = {
    "KUTU DOLUM": "kutu.dolum@meysu.local",
    "KUTU PAKETLEME": "kutu.paketleme@meysu.local",
    "KUTU PALETLEME": "kutu.paletleme@meysu.local",
    "KUTU DEPAL": "kutu.depal@meysu.local",
    "PET DOLUM": "pet.dolum@meysu.local",
    "PET SİŞİRME": "pet.sisirme@meysu.local",
    "PET ETİKETLEME": "pet.etiketleme@meysu.local",
    "PET PAKETLEME": "pet.paketleme@meysu.local",
    "PET PALETLEME": "pet.paletleme@meysu.local",
    "CAM DOLUM": "cam.dolum@meysu.local",
    "CAM DEPAL": "cam.depal@meysu.local",
    "CAM ETİKET": "cam.etiket@meysu.local",
    "CAM PAKETLEME": "cam.paketleme@meysu.local",
    "CAM PALETLEME": "cam.paletleme@meysu.local",
    "ADMIN": "enes@meysu.local",
    "SELİM GÜLDÜOĞLU": "selim@meysu.local",
  };
  return map[username] || "";
}

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Zaten giriş yapmışsa yönlendir
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      const role = session.user.user_metadata?.role;
      const adminRoles = ["admin", "administrator"];
      if (adminRoles.includes(role)) {
        router.replace("/admin/dashboard");
      } else {
        router.replace("/dashboard");
      }
    });
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) { toast.error("Kullanıcı adı ve şifre giriniz"); return; }

    const email = usernameToEmail(username.trim().toUpperCase());
    if (!email) { toast.error("Kullanıcı bulunamadı"); return; }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login")) {
          toast.error("Kullanıcı adı veya şifre hatalı");
        } else {
          toast.error("Giriş yapılırken hata oluştu");
        }
        return;
      }

      const role = data.user?.user_metadata?.role;
      const displayName = data.user?.user_metadata?.display_name;
      toast.success(`Hoş geldin, ${displayName}!`);

      const adminRoles = ["admin", "administrator"];
      if (adminRoles.includes(role)) {
        router.push("/admin/dashboard");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      console.error(err);
      toast.error("Giriş yapılırken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden p-6">
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
          <p className="text-gray-500 mt-2 font-medium">Makine Takip Sistemi</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-xl">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Kullanıcı Adı</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value.toUpperCase())}
                
                className="w-full border-2 border-gray-200 rounded-xl p-3 text-lg font-bold uppercase text-gray-800 focus:border-red-500 outline-none transition-all"
                autoComplete="off" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Şifre</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                
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


