"use client";

import React, { useState } from "react";
import {
  KeyRound,
  ShieldCheck,
  Lock,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { AdminPageHeader } from "@/components/shared/admin-page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { useUpdateAgencyPassword } from "@/lib/hooks/settings/use-agency-settings";
import { toast } from "sonner";

export default function StationSecuritySettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { mutate: updatePassword, isPending } = useUpdateAgencyPassword();

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error("Please enter both current and new passwords");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    updatePassword(
      { current_password: currentPassword, new_password: newPassword },
      {
        onSuccess: () => {
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
        },
      }
    );
  };

  const getPasswordStrength = (pw: string) => {
    if (!pw) return { label: "", score: 0, color: "" };
    if (pw.length < 6) return { label: "Weak", score: 25, color: "bg-destructive" };
    if (pw.length < 10) return { label: "Medium", score: 60, color: "bg-amber-500" };
    return { label: "Strong", score: 100, color: "bg-emerald-500" };
  };

  const strength = getPasswordStrength(newPassword);

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in-50 duration-200">
      {/* ─── Header ────────────────────────────────────────────── */}
      <AdminPageHeader
        title="Station Passcode & Access Control"
        subtitle="Update administrative login credentials and manage access authorization for this station"
        action={
          <Badge
            variant="outline"
            className="h-8 px-3 text-xs font-mono font-bold bg-primary/10 border-primary/30 text-primary flex items-center gap-1.5"
          >
            <Lock className="w-3.5 h-3.5 text-primary" />
            <span>Station Authentication Protected</span>
          </Badge>
        }
      />

      {/* ─── Passcode Form Card ────────────────────────────────── */}
      <Card className="border-border/80 bg-card/90 shadow-lg backdrop-blur-md overflow-hidden">
        <CardHeader className="p-5 border-b border-border/80 bg-secondary/10">
          <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-primary" />
            <span>Change Administrative Passcode</span>
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Update the credentials required to access and operate this station command hub
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSavePassword} className="space-y-4 max-w-md text-xs">
            {/* Current Password */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-foreground">
                Current Passcode
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border/80 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-foreground">
                New Passcode
              </label>
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border/80 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />

              {/* Password Strength Indicator */}
              {newPassword && (
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-muted-foreground">Strength:</span>
                    <span className="font-bold text-foreground">{strength.label}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full ${strength.color} transition-all duration-300`}
                      style={{ width: `${strength.score}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-foreground">
                Confirm New Passcode
              </label>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border/80 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="pt-3">
              <Button
                type="submit"
                size="sm"
                disabled={isPending}
                className="h-9 px-4 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    <span>Updating Passcode...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 mr-1.5" />
                    <span>Update Passcode</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
