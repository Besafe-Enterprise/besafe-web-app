"use client";

import { useState, Suspense, useEffect } from "react";
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
  Building2,
  HardHat,
  KeyRound,
} from "lucide-react";
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
import "@/styles/login.css";

interface ApiError {
  response?: {
    data?: {
      error?: string;
      message?: string;
    };
  };
}

function getStrength(pw: string) {
  if (!pw) return { label: "", score: 0, color: "" };
  if (pw.length < 6)
    return { label: "Weak", score: 25, color: "var(--color-error)" };
  if (pw.length < 10)
    return { label: "Medium", score: 60, color: "var(--color-warning)" };
  return { label: "Strong", score: 100, color: "var(--color-success)" };
}

function AgencyLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const roleParam = searchParams.get("role");
  const isPWA = typeof window !== "undefined" && (window.matchMedia("(display-mode: standalone)").matches || (window.navigator as { standalone?: boolean }).standalone === true);
  const isFieldOnly = roleParam === "field" || isPWA;
  const [loginRole, setLoginRole] = useState<"admin" | "field">(
    isFieldOnly ? "field" : "admin"
  );

  // Field PWA must only use ?role=field — any other login route is bounced
  useEffect(() => {
    if (isPWA && roleParam !== "field") router.replace("/login?role=field");
  }, [isPWA, roleParam, router]);

  const { mutate: login, isPending } = useAgencyLogin();
  const { mutate: changeInitialPassword, isPending: isChangingPassword } =
    useChangeInitialPassword();

  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<ApiFieldError | null>(null);

  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [staffInfo, setStaffInfo] = useState<{
    id: string;
    email: string;
    name: string;
  } | null>(null);
  const [newPermanentPassword, setNewPermanentPassword] = useState("");
  const [confirmPermanentPassword, setConfirmPermanentPassword] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<AgencyLoginFormData>({
    resolver: zodResolver(agencyLoginSchema),
    defaultValues: {
      email: "",
      password: "",
      role: isFieldOnly ? "field" : "admin",
    },
  });

  const getRedirectTarget = () => {
    const paramRedirect = searchParams.get("redirect");
    if (paramRedirect) {
      // Normalize bare /operations (no page there) to Command Center
      return paramRedirect === "/operations" || paramRedirect === "/operations/"
        ? "/operations/command-center"
        : paramRedirect;
    }
    return loginRole === "field" ? "/field" : "/operations/command-center";
  };

  const onSubmit: SubmitHandler<AgencyLoginFormData> = (data) => {
    setApiError(null);

    login(data, {
      onSuccess: (res) => {
        if (res.must_change_password) {
          setMustChangePassword(true);
          setStaffInfo({
            id: String(res.user?.id || ""),
            email: res.user?.email || data.email,
            name: res.user?.name || "Team member",
          });
          toast.info("First-Time Sign In", {
            description: "Please configure your permanent password.",
          });
        } else {
          toast.success("Signed in successfully", {
            description: "Redirecting to your dashboard...",
          });
          router.push(getRedirectTarget());
        }
      },
      onError: (err: unknown) => {
        const apiErr = err as ApiError;
        const message =
          apiErr?.response?.data?.error ||
          apiErr?.response?.data?.message ||
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
          toast.success("Password updated successfully!", {
            description: "Welcome.",
          });
          router.push(getRedirectTarget());
        },
        onError: (err: unknown) => {
          const apiErr = err as ApiError;
          toast.error(
            apiErr?.response?.data?.error || "Failed to set permanent password"
          );
        },
      }
    );
  };

  const strength = getStrength(newPermanentPassword);

  return (
    <div className="login-page">
      <div className="login-glow" />

      <div className="login-container">
        <div className="login-brand">
          <div className="login-brand-icon">
            <ShieldAlert size={28} />
          </div>
          <h1>BeSafe</h1>
          <p>
            {mustChangePassword
              ? "Set up your permanent password"
              : "Sign in to your account"}
          </p>
        </div>

        {mustChangePassword ? (
          <Card className="login-card login-card--first-time">
            <CardContent>
              <form
                onSubmit={handlePermanentPasswordSubmit}
                className="login-form"
              >
                <div className="login-info-box">
                  <KeyRound size={18} className="login-info-box-icon" />
                  <div className="login-info-box-text">
                    <strong>Welcome, {staffInfo?.name || "User"}!</strong>
                    <span>
                      You are signing in with a temporary password. Please
                      create a permanent password to secure your account.
                    </span>
                  </div>
                </div>

                <div className="login-field">
                  <Label htmlFor="permanentPassword">
                    New Permanent Password
                  </Label>
                  <Input
                    id="permanentPassword"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={newPermanentPassword}
                    onChange={(e) => setNewPermanentPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                  />
                  {newPermanentPassword && (
                    <div className="login-strength">
                      <div className="login-strength-label">
                        <span>Strength:</span>
                        <span>{strength.label}</span>
                      </div>
                      <div className="login-strength-bar">
                        <div
                          className="login-strength-bar__fill"
                          style={{
                            width: `${strength.score}%`,
                            background: strength.color,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="login-field">
                  <Label htmlFor="confirmPermanentPassword">
                    Confirm Permanent Password
                  </Label>
                  <Input
                    id="confirmPermanentPassword"
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPermanentPassword}
                    onChange={(e) =>
                      setConfirmPermanentPassword(e.target.value)
                    }
                    placeholder="Repeat new password"
                  />
                </div>

                <Button
                  type="submit"
                  className="login-btn"
                  disabled={isChangingPassword}
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 size={16} style={{ marginRight: 8 }} />
                      <span>Setting password...</span>
                    </>
                  ) : (
                    <>
                      <span>Set Password &amp; Continue</span>
                      <ArrowRight size={16} style={{ marginLeft: 8 }} />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="login-card">
            <CardContent>
              {!isFieldOnly && (
                <div className="login-tabs">
                <button
                  type="button"
                  className={`login-tab ${
                    loginRole === "admin"
                      ? "login-tab--active"
                      : "login-tab--inactive"
                  }`}
                  onClick={() => {
                    setLoginRole("admin");
                    setValue("role", "admin");
                  }}
                >
                  <Building2 size={14} />
                  Agency Console
                </button>
                <button
                  type="button"
                  className={`login-tab ${
                    loginRole === "field"
                      ? "login-tab--active"
                      : "login-tab--inactive"
                  }`}
                  onClick={() => {
                    setLoginRole("field");
                    setValue("role", "field");
                  }}
                >
                  <HardHat size={14} />
                  Field Worker
                </button>
              </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="login-form">
                <input type="hidden" {...register("role")} />
                <div className="login-field">
                  <Label htmlFor="email">Email</Label>
                  <div className="input-wrapper">
                    <Mail size={16} className="input-icon" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="operator@agency.gov"
                      className={`${
                        errors.email || apiError?.field === "email"
                          ? "error"
                          : ""
                      }`}
                      style={{ paddingLeft: 40 }}
                      {...register("email")}
                    />
                  </div>
                  {(errors.email || apiError?.field === "email") && (
                    <p className="field-error">
                      {errors.email?.message || apiError?.message}
                    </p>
                  )}
                </div>

                <div className="login-field">
                  <Label htmlFor="password">Password</Label>
                  <div className="input-wrapper">
                    <LockKeyhole size={16} className="input-icon" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      className={`password-input ${
                        errors.password || apiError?.field === "password"
                          ? "error"
                          : ""
                      }`}
                      style={{ paddingLeft: 40 }}
                      {...register("password")}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>
                  {(errors.password || apiError?.field === "password") && (
                    <p className="field-error">
                      {errors.password?.message || apiError?.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="login-btn"
                  disabled={isPending}
                >
                  {isPending ? (
                    <>
                      <Loader2 size={16} style={{ marginRight: 8 }} />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight size={16} style={{ marginLeft: 8 }} />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="login-footer">
          <p>
            {isFieldOnly
              ? "Need to join an agency? "
              : "Don't have an account? "}
            <Link
              href={isFieldOnly ? "/register?role=field" : "/register"}
              className="login-footer-link"
            >
              {isFieldOnly ? "Apply as a field worker" : "Register your agency"}
            </Link>
          </p>
          <span className="login-footer-meta">
            <Building2 size={12} />
            BeSafe Emergency Platform
          </span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="login-page">
          <Loader2 size={24} className="animate-spin" />
        </div>
      }
    >
      <AgencyLoginForm />
    </Suspense>
  );
}
