"use client";

import { useMeysuIframe } from "@/hooks/useMeysuIframe";

export default function GlobalClientEffects() {
  useMeysuIframe();
  return null;
}

