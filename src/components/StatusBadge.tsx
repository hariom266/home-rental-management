import { cn } from "@/lib/utils";
import { titleCase } from "@/lib/format";

const TONES: Record<string, string> = {
  paid: "bg-success/12 text-success border-success/30",
  successful: "bg-success/12 text-success border-success/30",
  resolved: "bg-success/12 text-success border-success/30",
  active: "bg-success/12 text-success border-success/30",
  occupied: "bg-success/12 text-success border-success/30",
  pending: "bg-warning/15 text-warning-foreground border-warning/40",
  submitted: "bg-warning/15 text-warning-foreground border-warning/40",
  partially_paid: "bg-warning/15 text-warning-foreground border-warning/40",
  in_progress: "bg-primary/10 text-primary border-primary/30",
  medium: "bg-primary/10 text-primary border-primary/30",
  low: "bg-muted text-muted-foreground border-border",
  vacant: "bg-muted text-muted-foreground border-border",
  inactive: "bg-muted text-muted-foreground border-border",
  maintenance: "bg-warning/15 text-warning-foreground border-warning/40",
  overdue: "bg-destructive/12 text-destructive border-destructive/30",
  failed: "bg-destructive/12 text-destructive border-destructive/30",
  rejected: "bg-destructive/12 text-destructive border-destructive/30",
  emergency: "bg-destructive/12 text-destructive border-destructive/30",
  high: "bg-destructive/12 text-destructive border-destructive/30",
  urgent: "bg-destructive/12 text-destructive border-destructive/30",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const tone = TONES[status] ?? "bg-secondary text-secondary-foreground border-border";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        tone,
        className,
      )}
    >
      {titleCase(status)}
    </span>
  );
}
