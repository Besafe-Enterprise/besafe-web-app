import React from "react";
import Link from "next/link";

interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  trend?: string;
  trendNegative?: boolean;
  warning?: boolean;
  href?: string;
}

export function KpiCard({
  label,
  value,
  sub,
  trend,
  trendNegative,
  warning,
  href,
}: KpiCardProps) {
  const cls = `kpi-card ${warning ? "kpi-card--warning" : ""}`;

  const content = (
    <>
      <span className="kpi-card__label">{label}</span>
      <span className="kpi-card__value">{value}</span>
      {sub && <span className="kpi-card__sub">{sub}</span>}
      {trend && (
        <span
          className={`kpi-card__trend ${
            trendNegative ? "kpi-card__trend--negative" : ""
          }`}
        >
          {trend}
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cls}>
        {content}
      </Link>
    );
  }

  return <div className={cls}>{content}</div>;
}
