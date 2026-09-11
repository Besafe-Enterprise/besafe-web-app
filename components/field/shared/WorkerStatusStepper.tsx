"use client";
import React from "react";
import type { WorkerStage, ReportWorkerStage } from "@/lib/field/utils";

interface StepperStep {
  label: string;
}

const ALERT_STEPS: StepperStep[] = [
  { label: "New" },
  { label: "Assigned" },
  { label: "Completed" },
];

const ALERT_STAGE_INDEX: Record<WorkerStage, number> = {
  new: 0,
  assigned: 1,
  acknowledged: 1,
  resolved: 2,
};

const REPORT_STEPS: StepperStep[] = [
  { label: "New" },
  { label: "Reviewing" },
  { label: "Completed" },
];

const REPORT_STAGE_INDEX: Record<ReportWorkerStage, number> = {
  new: 0,
  assigned: 1,
  triaged: 1,
  reviewing: 1,
  resolved: 2,
};

/**
 * Text-first progress stepper for the active case or report.
 * Accepts either `WorkerStage` (alerts) or `ReportWorkerStage` (SafeChat reports).
 * Status is always shown with a label (never colour alone) so it remains
 * legible outdoors / for a11y.
 */
export function WorkerStatusStepper({ stage }: { stage: WorkerStage | ReportWorkerStage }) {
  const isReport = stage === "triaged" || stage === "reviewing" || (stage === "resolved" && "triaged" in REPORT_STAGE_INDEX);
  const steps = isReport ? REPORT_STEPS : ALERT_STEPS;
  const stageIndex = isReport
    ? REPORT_STAGE_INDEX[stage as ReportWorkerStage]
    : ALERT_STAGE_INDEX[stage as WorkerStage];
  const current = stageIndex ?? 0;

  return (
    <div className="field-stepper">
      {steps.map((step, idx) => {
        const isDone = idx < current;
        const isCurrent = idx === current;
        return (
          <React.Fragment key={idx}>
            {idx > 0 && (
              <div className={`field-stepper__line ${idx <= current ? "done" : ""}`} />
            )}
            <div className="field-stepper__node-wrap">
              <div className={`field-stepper__node ${isDone ? "done" : isCurrent ? "current" : ""}`}>
                {isDone ? "✓" : idx + 1}
              </div>
              <span className={`field-stepper__label ${isCurrent ? "current" : isDone ? "done" : ""}`}>
                {step.label}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}
