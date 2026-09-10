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
  src?: string | null;
  size?: "sm" | "default" | "lg";
}

export function Avatar({ name, src, size = "default" }: AvatarProps) {
  const [failed, setFailed] = React.useState(false);
  const showImg = !!src && !failed;
  return (
    <span className={`avatar avatar--${size}`} style={showImg ? { backgroundImage: `url("${src}")`, backgroundSize: "cover", backgroundPosition: "center", color: "transparent" } : undefined}>
      {!showImg && initialsOf(name)}
      {showImg && (
        <img src={src} alt={name || "avatar"} style={{ display: "none" }} onError={() => setFailed(true)} />
      )}
    </span>
  );
}
