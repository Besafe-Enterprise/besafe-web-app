"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "default" | "lg";
}

function Avatar({ className, size = "default", ...props }: AvatarProps) {
  const sizeClasses = {
    sm: "size-7 text-xs",
    default: "size-9 text-sm",
    lg: "size-11 text-base",
  };

  return (
    <div
      data-slot="avatar"
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted border border-border select-none",
        sizeClasses[size],
        className
      )}
      {...props}
    />
  );
}

function AvatarImage({
  className,
  src,
  alt = "Avatar",
  ...props
}: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [hasError, setHasError] = React.useState(false);

  if (!src || hasError) return null;

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setHasError(true)}
      className={cn("aspect-square size-full object-cover", className)}
      {...props}
    />
  );
}

function AvatarFallback({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="avatar-fallback"
      className={cn(
        "flex size-full items-center justify-center font-bold uppercase text-muted-foreground",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export { Avatar, AvatarImage, AvatarFallback };
