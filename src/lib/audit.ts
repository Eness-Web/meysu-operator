import { supabase } from "@/integrations/supabase/client";

export async function writeAuditLog({
  action,
  tableName,
  recordId,
  oldData,
  newData,
}: {
  action: "INSERT" | "UPDATE" | "DELETE";
  tableName: string;
  recordId?: string;
  oldData?: any;
  newData?: any;
}) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    await supabase.from("audit_logs").insert({
      user_id: session.user.id,
      user_name: session.user.user_metadata?.display_name || "",
      user_role: session.user.user_metadata?.role || "",
      action,
      table_name: tableName,
      record_id: recordId || null,
      old_data: oldData || null,
      new_data: newData || null,
    });
  } catch (e) {
    console.error("Audit log yazılamadı:", e);
  }
}