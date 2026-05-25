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

export type StartLog = {
  id: string;
  operator_id: string;
  operator_name: string;
  personnel_name: string;
  machine_name: string;
  shift: string;
  start_time: string;
  note: string | null;
  created_at: string;
};

export type StopLog = {
  id: string;
  operator_id: string;
  operator_name: string;
  personnel_name: string;
  machine_name: string;
  shift: string;
  stop_reason: string;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  solution: string | null;
  created_at: string;
};

export type EndOfDayLog = {
  id: string;
  operator_id: string;
  operator_name: string;
  personnel_name: string;
  machine_name: string;
  shift: string;
  total_cans: number;
  waste_cans: number;
  net_cans: number;
  created_at: string;
};
