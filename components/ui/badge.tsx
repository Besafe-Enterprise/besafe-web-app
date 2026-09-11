import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 whitespace-nowrap",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-brand-500 text-white hover:bg-brand-600",
        secondary:
          "border-transparent bg-surface-300 text-text-secondary hover:bg-surface-400",
        outline:
          "border border-border text-text-secondary hover:bg-surface-200",
        destructive:
          "border-transparent bg-critical text-critical-foreground hover:bg-critical/90",
        success:
          "border-transparent bg-low text-low-foreground hover:bg-low/90",
        warning:
          "border-transparent bg-medium text-medium-foreground hover:bg-medium/90",
        // Priority statuses
        critical:
          "border-transparent bg-critical text-critical-foreground hover:bg-critical/90",
        high:
          "border-transparent bg-high text-high-foreground hover:bg-high/90",
        medium:
          "border-transparent bg-medium text-medium-foreground hover:bg-medium/90",
        low:
          "border-transparent bg-low text-low-foreground hover:bg-low/90",
        // Case statuses
        "case-new":
          "border-transparent bg-brand-500 text-white",
        "case-triaged":
          "border-transparent bg-purple-500 text-white",
        "case-assigned":
          "border-transparent bg-indigo-500 text-white",
        "case-accepted":
          "border-transparent bg-cyan-500 text-white",
        "case-en-route":
          "border-transparent bg-warning text-warning-foreground",
        "case-on-site":
          "border-transparent bg-high text-high-foreground",
        "case-investigating":
          "border-transparent bg-critical text-critical-foreground",
        "case-pending-review":
          "border-transparent bg-purple-500 text-white",
        "case-resolved":
          "border-transparent bg-success text-success-foreground",
        "case-closed":
          "border-transparent bg-surface-400 text-text-secondary",
        // Worker statuses
        "worker-available":
          "border-transparent bg-success text-success-foreground",
        "worker-busy":
          "border-transparent bg-critical text-critical-foreground",
        "worker-en-route":
          "border-transparent bg-warning text-warning-foreground",
        "worker-on-site":
          "border-transparent bg-high text-high-foreground",
        "worker-offline":
          "border-transparent bg-surface-400 text-text-secondary",
        // Report statuses
        "report-draft":
          "border-transparent bg-surface-400 text-text-secondary",
        "report-submitted":
          "border-transparent bg-brand-500 text-white",
        "report-under-review":
          "border-transparent bg-purple-500 text-white",
        "report-changes-requested":
          "border-transparent bg-warning text-warning-foreground",
        "report-approved":
          "border-transparent bg-success text-success-foreground",
      },
      size: {
        sm: "px-1.5 py-0.5 text-[9px]",
        default: "px-2 py-0.5 text-[11px]",
        lg: "px-3 py-1 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}

export { Badge, badgeVariants };