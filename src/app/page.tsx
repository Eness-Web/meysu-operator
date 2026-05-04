"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/integrations/supabase/client";
import { saveSession, getSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Factory, LogIn } from "lucide-react";

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
    if (!username || !password) {
      toast.error("Kullanıcı adı ve şifre giriniz");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("operator_accounts")
        .select("id, username, password, display_name, role")
        .eq("username", username.trim().toUpperCase())
        .eq("password", password)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        toast.error("Kullanıcı adı veya şifre hatalı");
        return;
      }
      saveSession({
        id: data.id,
        username: data.username,
        displayName: data.display_name,
        role: data.role,
      });
      toast.success(`Hoş geldin, ${data.display_name}`);
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      toast.error("Giriş yapılırken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-600 via-red-700 to-slate-900 p-6">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-white shadow-2xl mb-4">
            <Factory className="w-14 h-14 text-red-600" />
          </div>
          <h1 className="text-5xl font-black text-white tracking-tight">MEYSU GIDA</h1>
          <p className="text-xl text-red-100 mt-2 font-medium">Kutu Hattı Dolum Makinesi Takip Sistemi</p>
        </div>
        <Card className="p-10 shadow-2xl border-0">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-lg font-semibold">
                Kullanıcı Adı
              </Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toUpperCase())}
                placeholder="Örn: KUTU DOLUM"
                className="h-16 text-xl font-medium uppercase"
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-lg font-semibold">
                Şifre
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Şifrenizi girin"
                className="h-16 text-xl font-medium"
                autoComplete="off"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-16 text-xl font-bold bg-red-600 hover:bg-red-700"
            >
              <LogIn className="w-6 h-6 mr-2" />
              {loading ? "Giriş yapılıyor..." : "GİRİŞ YAP"}
            </Button>
          </form>
          <div className="mt-8 p-4 bg-slate-50 rounded-lg border">
            
            
          </div>
        </Card>
      </div>
    </div>
  );
}
