"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface DropdownMenuContextValue {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue | null>(null);

function useDropdownMenu() {
  const context = React.useContext(DropdownMenuContext);
  if (!context) {
    throw new Error("useDropdownMenu must be used within a DropdownMenu");
  }
  return context;
}

function DropdownMenu({ children }: { children: React.ReactNode }) {
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
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div ref={containerRef} className="relative inline-block w-full text-left">
        {children}
      </div>
    </DropdownMenuContext.Provider>
  );
}

function DropdownMenuTrigger({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { open, setOpen } = useDropdownMenu();

  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      aria-expanded={open}
      className={cn("cursor-pointer outline-none", className)}
      {...props}
    >
      {children}
    </button>
  );
}

function DropdownMenuContent({
  className,
  align = "end",
  side = "top",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  align?: "start" | "end" | "center";
  side?: "top" | "bottom";
}) {
  const { open } = useDropdownMenu();

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
        "absolute z-50 min-w-52 rounded-xl border border-border/80 bg-card/95 p-1 text-foreground shadow-2xl backdrop-blur-xl animate-in fade-in-50 zoom-in-95",
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

function DropdownMenuItem({
  className,
  onClick,
  children,
  disabled,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { setOpen } = useDropdownMenu();

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        if (disabled) return;
        setOpen(false);
        onClick?.(e);
      }}
      className={cn(
        "flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-foreground transition-colors hover:bg-secondary/70 focus:bg-secondary/70 outline-none disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("-mx-1 my-1 h-px bg-border/60", className)}
      {...props}
    />
  );
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
};
