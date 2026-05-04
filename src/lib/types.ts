export type Machine = {
  id: string;
  line_id: string;
  code: string;
  name: string;
  machine_type: "ana" | "yan";
  output_label: string | null;
};

export type StopReason = {
  id: string;
  label: string;
  is_active: boolean;
};

export type OperatorAccount = {
  id: string;
  username: string;
  display_name: string;
  role: string;
};
