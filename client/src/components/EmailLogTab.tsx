import { useQuery } from "@tanstack/react-query";
import { Mail, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";

type EmailLogEntry = {
  id: number;
  userId: string;
  emailType: string;
  recipientEmail: string;
  sentAt: string;
  userFirstName: string | null;
  userLastName: string | null;
  username: string | null;
};

function formatEmailType(type: string): { label: string; color: string; icon: typeof CheckCircle } {
  if (type === "payout_ready") return { label: "Payout Ready", color: "text-emerald-400", icon: CheckCircle };
  if (type === "payout_restricted") return { label: "Payout Restricted", color: "text-amber-400", icon: AlertTriangle };
  return { label: type, color: "text-white/50", icon: Mail };
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function EmailLogTab() {
  const { data: logs, isLoading, isError } = useQuery<EmailLogEntry[]>({
    queryKey: ["/api/admin/email-logs"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-white/40" data-testid="email-log-loading">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading email log…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-red-400 text-sm py-8 text-center" data-testid="email-log-error">
        Failed to load email log.
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-16 text-white/40" data-testid="email-log-empty">
        <Mail className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">No account-health emails have been sent yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="email-log-list">
      <p className="text-xs text-white/40 mb-4">
        Showing the {logs.length} most recent account-health notification{logs.length !== 1 ? "s" : ""} sent to artists.
      </p>
      {logs.map((entry) => {
        const { label, color, icon: Icon } = formatEmailType(entry.emailType);
        const artistName =
          entry.userFirstName || entry.userLastName
            ? [entry.userFirstName, entry.userLastName].filter(Boolean).join(" ")
            : entry.username || entry.userId;
        return (
          <div
            key={entry.id}
            className="flex items-start gap-4 rounded-lg bg-white/[0.02] border border-white/5 px-4 py-3"
            data-testid={`email-log-row-${entry.id}`}
          >
            <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${color}`} />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span className={`text-sm font-medium ${color}`} data-testid={`email-log-type-${entry.id}`}>
                  {label}
                </span>
                <span className="text-white/60 text-sm" data-testid={`email-log-artist-${entry.id}`}>
                  → {artistName}
                </span>
              </div>
              <p className="text-xs text-white/40 mt-0.5 truncate" data-testid={`email-log-recipient-${entry.id}`}>
                {entry.recipientEmail}
              </p>
            </div>
            <span className="text-xs text-white/30 flex-shrink-0 mt-0.5" data-testid={`email-log-date-${entry.id}`}>
              {formatDate(entry.sentAt)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
