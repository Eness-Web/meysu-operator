export const SHIFTS = ["08:30 - 18:00"];

export const STOP_REASONS: string[] = [
  "Makine Arızası",
  "Diğer",
];

export const PERSONNEL_MAP: Record<string, string[]> = {
  // Kutu Hattı
  dolum: ["ENES ÇELİK", "EREN ÜNAL"],
  paketleme: ["YUSUF ÖTER", "BURHAN DEMİRTAŞ"],
  paletleme: ["SAVAŞ AÇAR", "ERCAN KARAGÖZ"],
  depal: ["ŞABAN AYBUGA", "EYÜP KARAMAN"],

  // Pet Hattı
  pet_dolum: ["ALİ YILMAZ"],
  pet_sisirme: [],
  pet_etiketleme: [],
  pet_paketleme: [],
  pet_paletleme: [],

  // Cam Hattı
  cam_dolum: ["MAHMUT EKİCİ", "MEHMET KAYA"],
  cam_paketleme: [],
  cam_paletleme: [],
  cam_depal: [],
  cam_etiket: [],
};

export const MACHINE_MAP: Record<string, string> = {
  // Kutu Hattı
  dolum: "Kutu Dolum",
  paketleme: "Kutu Paketleme",
  paletleme: "Kutu Paletleme",
  depal: "Kutu Depal",

  // Pet Hattı
  pet_dolum: "Pet Dolum",
  pet_sisirme: "Pet Şişirme",
  pet_etiketleme: "Pet Etiketleme",
  pet_paketleme: "Pet Paketleme",
  pet_paletleme: "Pet Paletleme",

  // Cam Hattı
  cam_dolum: "Cam Dolum",
  cam_paketleme: "Cam Paketleme",
  cam_paletleme: "Cam Paletleme",
  cam_depal: "Cam Depal",      
  cam_etiket: "Cam Etiket",
};

export const UNIT_MAP: Record<string, string> = {
  // Kutu Hattı
  dolum: "Kutu",
  paketleme: "Kutu",
  paletleme: "Kutu",
  depal: "Kutu",

  // Pet Hattı
  pet_dolum: "Şişe",
  pet_sisirme: "Şişe",
  pet_etiketleme: "Şişe",
  pet_paketleme: "Şişe",
  pet_paletleme: "Şişe",

  // Cam Hattı
  cam_dolum: "Cam Şişe",
  cam_paketleme: "Cam Şişe",
  cam_paletleme: "Cam Şişe",
};

/**
 * Veritabanındaki role değerini (ör. "KUTU DOLUM", "dolum", "Kutu Dolum")
 * MACHINE_MAP/PERSONNEL_MAP anahtarına (ör. "dolum") dönüştürür.
 */
export function getMachineKey(role: string): string {
  if (!role) return "";
  if (role in MACHINE_MAP) return role;
  const normalized = role.toLowerCase().replace(/\s+/g, "_");
  if (normalized in MACHINE_MAP) return normalized;
  const withoutPrefix = normalized.replace(/^kutu_/, "");
  if (withoutPrefix in MACHINE_MAP) return withoutPrefix;
  return normalized;
}