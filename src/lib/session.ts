"use client";

export type OperatorSession = {
  id: string;
  username: string;
  displayName: string;
  role: string;
};

const STORAGE_KEY = "meysu_operator_session";

export function saveSession(session: OperatorSession) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function getSession(): OperatorSession | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as OperatorSession;
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
