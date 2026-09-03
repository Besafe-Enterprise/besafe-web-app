"use client";
import React from "react";
import type { WorkerStage } from "@/lib/field/utils";

const STEPS: { stage: WorkerStage; label: string }[] = [
  { stage: "active", label: "Assigned" },
  { stage: "acknowledged", label: "Accepted" },
  { stage: "resolved", label: "Completed" },
];

const STAGE_INDEX: Record<WorkerStage, number> = {
  active: 0,
  acknowledged: 1,
  resolved: 2,
};

/**
 * Text-first progress stepper for the active case. Status is always shown with
 * a label (never colour alone) so it remains legible outdoors / for a11y.
 */
export function WorkerStatusStepper({ stage }: { stage: WorkerStage }) {
  const current = STAGE_INDEX[stage];

  return (
    <div className="field-stepper">
      {STEPS.map((step, idx) => {
        const isDone = idx < current;
        const isCurrent = idx === current;
        return (
          <React.Fragment key={step.stage}>
            {idx > 0 && (
              <div
                className={`field-stepper__line ${idx <= current ? "done" : ""}`}
              />
            )}
            <div className="field-stepper__node-wrap">
              <div
                className={`field-stepper__node ${
                  isDone ? "done" : isCurrent ? "current" : ""
                }`}
              >
                {isDone ? "✓" : idx + 1}
              </div>
              <span
                className={`field-stepper__label ${
                  isCurrent ? "current" : isDone ? "done" : ""
                }`}
              >
                {step.label}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}
