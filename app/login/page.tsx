"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2,
  Mail,
  Eye,
  EyeOff,
  LockKeyhole,
  ArrowRight,
  ShieldAlert,
  Radio,
  Building2,
  KeyRound,} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useAgencyLogin,
  useChangeInitialPassword,
} from "@/lib/hooks/auth/use-agency-auth";
import {
  agencyLoginSchema,
  type AgencyLoginFormData,
} from "@/lib/validations/auth.schema";
import { toast } from "sonner";
import type { ApiFieldError } from "@/types/auth";

function AgencyLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";

  const { mutate: login, isPending } = useAgencyLogin();
  const { mutate: changeInitialPassword, isPending: isChangingPassword } =
    useChangeInitialPassword();

  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<ApiFieldError | null>(null);

  // First-time password change state
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [staffInfo, setStaffInfo] = useState<{ id: string; email: string; name: string } | null>(null);
  const [newPermanentPassword, setNewPermanentPassword] = useState("");
  const [confirmPermanentPassword, setConfirmPermanentPassword] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AgencyLoginFormData>({
    resolver: zodResolver(agencyLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit: SubmitHandler<AgencyLoginFormData> = (data) => {
    setApiError(null);

    login(data, {
      onSuccess: (res) => {
        if (res.must_change_password) {
          setMustChangePassword(true);
          setStaffInfo({
            id: String(res.user?.id || ""),
            email: res.user?.email || data.email,
            name: res.user?.name || "Dispatcher",
          });
          toast.info("First-Time Sign In", {
            description: "Please configure your permanent dispatch password.",
          });
        } else {
          toast.success("Agency authenticated successfully", {
            description: "Connecting to Live Emergency Dispatch Command...",
          });
          router.push(redirect);
        }
      },
      onError: (err: any) => {
        const message =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Authentication failed. Please check your credentials or verify the backend server is running.";
        const lower = message.toLowerCase();

        toast.error(message);

        if (
          lower.includes("email") ||
          lower.includes("agency not found") ||
          lower.includes("user not found")
        ) {
          setApiError({ field: "email", message });
        } else if (
          lower.includes("password") ||
          lower.includes("invalid credential") ||
          lower.includes("incorrect")
        ) {
          setApiError({ field: "password", message });
        } else {
          setApiError({ field: "root", message });
        }
      },
    });
  };

  const handlePermanentPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPermanentPassword || newPermanentPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPermanentPassword !== confirmPermanentPassword) {
      toast.error("Passwords do not match");
      return;
    }

    changeInitialPassword(
      {
        new_password: newPermanentPassword,
        staff_id: staffInfo?.id,
        email: staffInfo?.email,
      },
      {
        onSuccess: () => {
          toast.success("Permanent password configured successfully!", {
            description: "Welcome to the command terminal.",
          });
          router.push(redirect);
        },
        onError: (err: any) => {
          toast.error(
            err?.response?.data?.error || "Failed to set permanent password"
          );
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

  const strength = getPasswordStrength(newPermanentPassword);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background Tactical Glows */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-background to-background" />
      <div className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-red-600/10 blur-3xl" />

      <div className="relative z-10 w-full max-w-md space-y-8">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-xl shadow-blue-500/20 ring-1 ring-white/20">
            <ShieldAlert className="h-8 w-8 text-white" />
          </div>
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400 mb-1">
              <Radio className="w-3.5 h-3.5 animate-pulse text-blue-400" />
              <span>Agency Command Gateway</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              BeSafe Dispatch Center
            </h1>
            <p className="text-sm text-muted-foreground">
              {mustChangePassword
                ? "First-Time Security Passcode Configuration"
                : "Sign in to monitor live emergency telemetry and coordinate units"}
            </p>
          </div>
        </div>

        {/* ═══ STEP 2: FIRST-TIME PASSWORD CHANGE MODAL ═══ */}
        {mustChangePassword ? (
          <Card className="border border-border/80 bg-card/90 shadow-2xl backdrop-blur-xl animate-in fade-in-50 duration-300">
            <CardContent className="pt-6">
              <form
                onSubmit={handlePermanentPasswordSubmit}
                className="space-y-5"
              >
                <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 flex items-start gap-2.5">
                  <KeyRound className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-foreground">
                      Welcome, {staffInfo?.name || "Dispatcher"}!
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      You are signing in with a temporary passcode. Please create a permanent password to secure your operator account.
                    </p>
                  </div>
                </div>

                {/* New Permanent Password */}
                <div className="space-y-2">
                  <Label
                    htmlFor="permanentPassword"
                    className="text-xs font-semibold"
                  >
                    New Permanent Passcode
                  </Label>
                  <Input
                    id="permanentPassword"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={newPermanentPassword}
                    onChange={(e) => setNewPermanentPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="h-11 bg-background/50 border-border/80 focus:border-primary"
                  />

                  {newPermanentPassword && (
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-muted-foreground">Strength:</span>
                        <span className="font-bold text-foreground">
                          {strength.label}
                        </span>
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

                {/* Confirm Permanent Password */}
                <div className="space-y-2">
                  <Label
                    htmlFor="confirmPermanentPassword"
                    className="text-xs font-semibold"
                  >
                    Confirm Permanent Passcode
                  </Label>
                  <Input
                    id="confirmPermanentPassword"
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPermanentPassword}
                    onChange={(e) => setConfirmPermanentPassword(e.target.value)}
                    placeholder="Repeat new passcode"
                    className="h-11 bg-background/50 border-border/80 focus:border-primary"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isChangingPassword}
                  className="w-full h-11 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      <span>Activating Secure Terminal...</span>
                    </>
                  ) : (
                    <>
                      <span>Set Permanent Passcode & Enter</span>
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          /* ═══ STEP 1: STANDARD AGENCY & DISPATCHER LOGIN ═══ */
          <Card className="border border-border/80 bg-card/90 shadow-2xl backdrop-blur-xl">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {apiError?.field === "root" && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>{apiError.message}</span>
                  </div>
                )}

                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-semibold">
                    Station Email / Dispatch ID
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="operator@station.agency.gov"
                      className={`pl-10 h-11 bg-background/50 border-border/80 focus:border-primary ${
                        errors.email || apiError?.field === "email"
                          ? "border-destructive focus-visible:ring-destructive"
                          : ""
                      }`}
                      {...register("email")}
                    />
                  </div>
                  {(errors.email || apiError?.field === "email") && (
                    <p className="text-[11px] text-destructive font-medium">
                      {errors.email?.message || apiError?.message}
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs font-semibold">
                      Access Passcode
                    </Label>
                  </div>
                  <div className="relative">
                    <LockKeyhole className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••••••"
                      className={`pl-10 pr-10 h-11 bg-background/50 border-border/80 focus:border-primary ${
                        errors.password || apiError?.field === "password"
                          ? "border-destructive focus-visible:ring-destructive"
                          : ""
                      }`}
                      {...register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {(errors.password || apiError?.field === "password") && (
                    <p className="text-[11px] text-destructive font-medium">
                      {errors.password?.message || apiError?.message}
                    </p>
                  )}
                </div>

                {/* Submit Action */}
                <Button
                  type="submit"
                  disabled={isPending}
                  className="w-full h-11 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-[1.01]"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      <span>Authenticating Operator...</span>
                    </>
                  ) : (
                    <>
                      <span>Authorize Station Access</span>
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            Don't have a registered agency terminal?{" "}
            <Link
              href="/register"
              className="font-semibold text-primary hover:underline"
            >
              Register Station HQ
            </Link>
          </p>
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/60">
            <Building2 className="w-3 h-3" />
            <span>BeSafe Inter-Agency Dispatch Grid 2.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      }
    >
      <AgencyLoginForm />
    </Suspense>
  );
}
