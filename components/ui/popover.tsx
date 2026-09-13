"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface PopoverContextValue {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const PopoverContext = React.createContext<PopoverContextValue | null>(null);

function usePopover() {
  const context = React.useContext(PopoverContext);
  if (!context) {
    throw new Error("usePopover must be used within a Popover");
  }
  return context;
}

function Popover({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <PopoverContext.Provider value={{ open, setOpen }}>
      <div ref={containerRef} className="relative inline-block text-left">
        {children}
      </div>
    </PopoverContext.Provider>
  );
}

function PopoverTrigger({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { open, setOpen } = usePopover();

  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      aria-expanded={open}
      className={cn("outline-none cursor-pointer", className)}
      {...props}
    >
      {children}
    </button>
  );
}

function PopoverContent({
  className,
  align = "center",
  side = "bottom",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  align?: "start" | "end" | "center";
  side?: "top" | "bottom";
}) {
  const { open } = usePopover();

  if (!open) return null;

  const alignClasses = {
    start: "left-0",
    end: "right-0",
    center: "left-1/2 -translate-x-1/2",
  };

  const sideClasses = {
    top: "bottom-full mb-2",
    bottom: "top-full mt-2",
  };

  return (
    <div
      className={cn(
        "absolute z-[100] min-w-80 rounded-2xl border border-border bg-card p-3 text-foreground shadow-2xl backdrop-blur-2xl animate-in fade-in-50 zoom-in-95",
        alignClasses[align],
        sideClasses[side],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export { Popover, PopoverTrigger, PopoverContent };
