"use client";

import type { Machine } from "@/lib/types";
import { Factory } from "lucide-react";
import { cn } from "@/lib/utils";

export function MachineSelector({
  machines,
  selectedId,
  onSelect,
}: {
  machines: Machine[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const anaMachines = machines.filter((m) => m.machine_type === "ana");
  const yanMachines = machines.filter((m) => m.machine_type === "yan");

  const renderGroup = (title: string, list: Machine[], accent: string) => {
    if (list.length === 0) return null;
    return (
      <div>
        <p className="text-sm font-black uppercase tracking-wider text-slate-500 mb-3">{title}</p>
        <div className="grid grid-cols-3 gap-3">
          {list.map((m) => {
            const active = selectedId === m.id;
            return (
              <button
                key={m.id}
                onClick={() => onSelect(m.id)}
                className={cn(
                  "rounded-xl p-5 border-2 text-left transition-all shadow-sm",
                  active
                    ? `${accent} text-white border-transparent shadow-lg scale-[1.02]`
                    : "bg-white border-slate-200 hover:border-slate-400 text-slate-800"
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-lg flex items-center justify-center shrink-0",
                      active ? "bg-white/20" : "bg-slate-100"
                    )}
                  >
                    <Factory className={cn("w-6 h-6", active ? "text-white" : "text-slate-600")} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-lg truncate">{m.name}</p>
                    <p className={cn("text-xs font-semibold", active ? "text-white/80" : "text-slate-500")}>
                      {m.machine_type === "ana" ? "Ana Makine" : "Yan Makine"}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  

  return (
    <div className="space-y-6">
      {renderGroup("Ana Makineler", anaMachines, "bg-red-600")}
      {renderGroup("Yan Makineler", yanMachines, "bg-slate-700")}
    </div>
  );
}
