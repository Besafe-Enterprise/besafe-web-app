import React from "react";

export function initialsOf(name?: string | null, fallback = "U"): string {
  if (!name) return fallback;
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

interface AvatarProps {
  name?: string | null;
  size?: "sm" | "default" | "lg";
}

export function Avatar({ name, size = "default" }: AvatarProps) {
  return (
    <span className={`avatar avatar--${size}`}>{initialsOf(name)}</span>
  );
}
