"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getSession } from "@/lib/session";
import type { Machine } from "@/lib/types";

export function useOperatorMachines() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [operatorId, setOperatorId] = useState<string | null>(null);
  const [operatorName, setOperatorName] = useState<string | null>(null);

  useEffect(() => {
    const s = getSession();
    if (!s) {
      setLoading(false);
      return;
    }
    setOperatorId(s.id);
    setOperatorName(s.displayName);
    (async () => {
      const { data: links } = await supabase
        .from("operator_machines")
        .select("machine_id")
        .eq("operator_id", s.id);
      const ids = (links || []).map((l: { machine_id: string }) => l.machine_id);
      if (ids.length === 0) {
        setMachines([]);
        setLoading(false);
        return;
      }
      const { data: machs } = await supabase
        .from("machines")
        .select("id, line_id, code, name, machine_type, output_label")
        .in("id", ids)
        .order("machine_type")
        .order("name");
      setMachines((machs || []) as Machine[]);
      setLoading(false);
    })();
  }, []);

  return { machines, loading, operatorId, operatorName };
}
