
export function todayTR(): string {
  return new Date().toLocaleDateString("tr-TR", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).split(".").reverse().join("-");
}

export function startOfDayTR(dateStr: string): string {
  return `${dateStr}T00:00:00+03:00`;
}


export function endOfDayTR(dateStr: string): string {
  return `${dateStr}T23:59:59+03:00`;
}