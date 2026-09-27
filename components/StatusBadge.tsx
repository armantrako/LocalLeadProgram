import type { LeadStatus } from "@/lib/types";

interface Props {
  status?: LeadStatus;
}

export default function StatusBadge({ status = "NEW" }: Props) {
  let color = "bg-muted/10 text-muted border-border";
  let label: string = status;
  let icon = "⚪";

  switch (status) {
    case "NEW":
      color = "bg-blue-500/10 text-blue-400 border-blue-500/30";
      icon = "🆕";
      label = "Novi";
      break;
    case "ANALYZING":
      color = "bg-purple-500/10 text-purple-400 border-purple-500/30 animate-pulse";
      icon = "🤖";
      label = "Analiza...";
      break;
    case "MESSAGE_READY":
      color = "bg-cyan-500/10 text-cyan-400 border-cyan-500/30";
      icon = "📝";
      label = "Poruka spremna";
      break;
    case "READY_TO_SEND":
      color = "bg-emerald-500/15 text-emerald-300 border-emerald-500/40";
      icon = "🟢";
      label = "Spreman za slanje";
      break;
    case "SENT":
      color = "bg-blue-600/15 text-blue-300 border-blue-600/40";
      icon = "📤";
      label = "Poslano";
      break;
    case "REPLIED":
      color = "bg-indigo-500/15 text-indigo-300 border-indigo-500/40";
      icon = "💬";
      label = "Odgovorio";
      break;
    case "INTERESTED":
      color = "bg-accent/20 text-accent border-accent/40 font-bold";
      icon = "🔥";
      label = "Zainteresovan";
      break;
    case "NOT_INTERESTED":
      color = "bg-gray-500/20 text-gray-400 border-gray-500/30";
      icon = "🛑";
      label = "Nije zainteresovan";
      break;
    case "FOLLOW_UP":
      color = "bg-amber-500/15 text-amber-300 border-amber-500/40";
      icon = "🔁";
      label = "Follow-up";
      break;
    case "DO_NOT_CONTACT":
      color = "bg-red-500/20 text-red-400 border-red-500/50 font-bold";
      icon = "🚫";
      label = "DO NOT CONTACT";
      break;
    case "ERROR":
      color = "bg-red-500/15 text-red-300 border-red-500/40";
      icon = "⚠️";
      label = "Greška";
      break;
    case "NOT_ELIGIBLE":
      color = "bg-yellow-500/15 text-yellow-300 border-yellow-500/40";
      icon = "⚠️";
      label = "Nije podoban";
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border ${color}`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </span>
  );
}
