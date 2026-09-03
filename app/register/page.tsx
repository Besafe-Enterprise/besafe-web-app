"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import {
  Loader2,
  Mail,
  Eye,
  EyeOff,
  LockKeyhole,
  ArrowRight,
  ArrowLeft,
  ShieldAlert,
  Building2,
  Phone,
  MapPin,
  Compass,
  CheckCircle2,
  ShieldCheck,
  HardHat,
  User,
  Search,
  Check,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAgencyRegister, useAgencyLogin } from "@/lib/hooks/auth/use-agency-auth";
import {
  agencyRegisterSchema,
  step1Fields,
  step2Fields,
  type AgencyRegisterFormData,
} from "@/lib/validations/auth.schema";
import { fieldWorkerApi, type AgencyOption } from "@/lib/api";
import { toast } from "sonner";
import type { ApiFieldError } from "@/types/auth";
import "@/styles/register.css";

interface ApiError {
  response?: {
    data?: {
      error?: string;
      message?: string;
    };
  };
}

const LocationMapPicker = dynamic(
  () => import("@/components/map/LocationMapPicker"),
  {
    ssr: false,
    loading: () => (
      <div className="register-map-loading">
        <div className="register-map-loading-inner">
          <Loader2 size={16} className="animate-spin" />
          <span>Loading Map Radar...</span>
        </div>
      </div>
    ),
  }
);

/* ════════════════════════════════════════════════════════════
   AGENCY REGISTRATION WIZARD (existing flow)
   ════════════════════════════════════════════════════════════ */

const STEPS = [
  { id: 1, title: "Identity", subtitle: "Agency Profile", icon: Building2 },
  { id: 2, title: "Location", subtitle: "Agency Map", icon: Compass },
  { id: 3, title: "Security", subtitle: "Credentials", icon: LockKeyhole },
];

function AgencyRegisterWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  const { mutate: registerAgency, isPending: isRegistering } = useAgencyRegister();
  const { mutate: loginAgency, isPending: isLoggingIn } = useAgencyLogin();

  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<ApiFieldError | null>(null);
  const [stationPlaceLabel, setStationPlaceLabel] = useState<string>("");

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AgencyRegisterFormData>({
    resolver: zodResolver(agencyRegisterSchema),
    mode: "onTouched",
    defaultValues: {
      name: "",
      region: "",
      phone_number: "",
      lat: 15.5007,
      lng: 32.5599,
      email: "",
      password: "",
    },
  });

  const formValues = watch();

  const handleNextStep = async () => {
    let isValid = false;

    if (currentStep === 1) {
      isValid = await trigger(step1Fields);
      if (isValid) setCurrentStep(2);
    } else if (currentStep === 2) {
      isValid = await trigger(step2Fields);
      if (isValid) setCurrentStep(3);
    }
  };

  const handlePrevStep = () => {
    if (currentStep === 2) setCurrentStep(1);
    if (currentStep === 3) setCurrentStep(2);
  };

  const onSubmit: SubmitHandler<AgencyRegisterFormData> = (data) => {
    setApiError(null);

    registerAgency(data, {
      onSuccess: () => {
        toast.success("Agency registered successfully!", {
          description: "Logging in to your command dashboard...",
        });

        loginAgency(
          { email: data.email, password: data.password },
          {
            onSuccess: () => {
              router.push("/operations/command-center");
            },
            onError: () => {
              router.push("/login?registered=true");
            },
          }
        );
      },
      onError: (err: unknown) => {
        const apiErr = err as ApiError;
        const message =
          apiErr?.response?.data?.error ||
          apiErr?.response?.data?.message ||
          "Registration failed. Please check your information.";
        const lower = message.toLowerCase();

        toast.error(message);

        if (lower.includes("phone")) {
          setApiError({ field: "password", message });
          setCurrentStep(1);
        } else if (lower.includes("email") || lower.includes("already registered")) {
          setApiError({ field: "email", message });
          setCurrentStep(3);
        } else {
          setApiError({ field: "root", message });
        }
      },
    });
  };

  const isSubmitting = isRegistering || isLoggingIn;

  return (
    <>
      <div className="register-brand">
        <div className="register-brand-icon">
          <ShieldAlert size={28} />
        </div>
        <h1>Agency Onboarding</h1>
        <p>Configure your emergency response agency in 3 quick steps</p>
      </div>

      {/* Stepper Bar */}
      <div className="register-stepper">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;

          return (
            <div key={step.id} className={`register-stepper-step ${isCompleted ? "register-stepper-step--completed" : isCurrent ? "register-stepper-step--current" : "register-stepper-step--todo"}`}>
              <div className="register-stepper-group">
                <div className="register-stepper-icon">
                  {isCompleted ? <CheckCircle2 size={16} /> : <Icon size={16} />}
                </div>
                <div className="register-stepper-label">
                  <span className="register-stepper-label-title">{step.title}</span>
                  <span className="register-stepper-label-sub">{step.subtitle}</span>
                </div>
              </div>

              {idx < STEPS.length - 1 && (
                <div className={`register-stepper-line ${currentStep > step.id ? "register-stepper-line--done" : ""}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Wizard Content Card */}
      <Card className="register-card">
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="register-form">
            {/* STEP 1: AGENCY IDENTITY */}
            {currentStep === 1 && (
              <div className="register-form-inner">
                <div className="register-section-title">
                  <h2>
                    <Building2 size={16} />
                    Agency Identity &amp; Operational Region
                  </h2>
                  <p>Enter official department identity and primary dispatch phone number</p>
                </div>

                <div className="register-field">
                  <Label htmlFor="name">Agency / Department Name</Label>
                  <div className="input-wrapper">
                    <Building2 size={16} className="input-icon" />
                    <Input
                      id="name"
                      placeholder="e.g. Metropolitan Police Division 4"
                      className={errors.name ? "error" : ""}
                      style={{ paddingLeft: 40 }}
                      {...register("name")}
                    />
                  </div>
                  {errors.name && (
                    <p className="field-error">{errors.name.message}</p>
                  )}
                </div>

                <div className="register-field-grid">
                  <div className="register-field">
                    <Label htmlFor="region">Region / City</Label>
                    <div className="input-wrapper">
                      <MapPin size={16} className="input-icon" />
                      <Input
                        id="region"
                        placeholder="e.g. Lagos, London, or Khartoum North"
                        className={errors.region ? "error" : ""}
                        style={{ paddingLeft: 40 }}
                        {...register("region")}
                      />
                    </div>
                    {errors.region && (
                      <p className="field-error">{errors.region.message}</p>
                    )}
                  </div>

                  <div className="register-field">
                    <Label htmlFor="phone_number">Dispatch Contact Phone</Label>
                    <div className="input-wrapper">
                      <Phone size={16} className="input-icon" />
                      <Input
                        id="phone_number"
                        placeholder="+1 (800) 555-0199"
                        className={errors.phone_number ? "error" : ""}
                        style={{ paddingLeft: 40 }}
                        {...register("phone_number")}
                      />
                    </div>
                    {errors.phone_number && (
                      <p className="field-error">{errors.phone_number.message}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: AGENCY LOCATION */}
            {currentStep === 2 && (
              <div className="register-form-inner">
                <div className="register-section-title">
                  <h2>
                    <Compass size={16} />
                    Agency Headquarters Location
                  </h2>
                  <p>Search your agency address or drag the pin on the map to set your response base</p>
                </div>

                <LocationMapPicker
                  lat={formValues.lat}
                  lng={formValues.lng}
                  onLocationChange={(newLat, newLng, placeName) => {
                    setValue("lat", newLat, { shouldValidate: true });
                    setValue("lng", newLng, { shouldValidate: true });
                    if (placeName) setStationPlaceLabel(placeName);
                  }}
                />

                {(errors.lat || errors.lng) && (
                  <p className="field-error">
                    {errors.lat?.message || errors.lng?.message}
                  </p>
                )}

                <div className="register-info-box">
                  <ShieldCheck size={16} />
                  <span>
                    BeSafe&apos;s geospatial proximity engine automatically routes distress alerts within your agency&apos;s operational radius.
                  </span>
                </div>
              </div>
            )}

            {/* STEP 3: ACCESS CREDENTIALS */}
            {currentStep === 3 && (
              <div className="register-form-inner">
                <div className="register-section-title">
                  <h2>
                    <LockKeyhole size={16} />
                    Access &amp; Security Credentials
                  </h2>
                  <p>Set up your master dispatch login and review agency details</p>
                </div>

                {/* Summary Review */}
                <div className="register-summary">
                  <div className="register-summary-row">
                    <span className="summary-label">Agency:</span>
                    <span className="summary-value">{formValues.name || "—"}</span>
                  </div>
                  <div className="register-summary-row">
                    <span className="summary-label">Region / City:</span>
                    <span className="summary-value">{formValues.region || "—"}</span>
                  </div>
                  {stationPlaceLabel && (
                    <div className="register-summary-row">
                      <span className="summary-label">Agency Address:</span>
                      <span className="summary-value summary-value--muted">{stationPlaceLabel}</span>
                    </div>
                  )}
                  <div className="register-summary-row">
                    <span className="summary-label">Agency Coordinates:</span>
                    <span className="summary-value summary-value--mono">{formValues.lat}&deg; N, {formValues.lng}&deg; E</span>
                  </div>
                </div>

                {/* Email */}
                <div className="register-field">
                  <Label htmlFor="email">Official Admin Email</Label>
                  <div className="input-wrapper">
                    <Mail size={16} className="input-icon" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="dispatch@police.gov"
                      className={`${errors.email || apiError?.field === "email" ? "error" : ""}`}
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

                {/* Password */}
                <div className="register-field">
                  <Label htmlFor="password">Master Access Password</Label>
                  <div className="input-wrapper">
                    <LockKeyhole size={16} className="input-icon" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••••••"
                      className={`password-input ${errors.password ? "error" : ""}`}
                      style={{ paddingLeft: 40, paddingRight: 40 }}
                      {...register("password")}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="field-error">{errors.password.message}</p>
                  )}
                </div>
              </div>
            )}

            {/* Root Error Banner */}
            {apiError?.field === "root" && (
              <div className="register-error-box">
                {apiError.message}
              </div>
            )}

            {/* Wizard Action Buttons */}
            <div className="register-actions">
              {currentStep > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevStep}
                  disabled={isSubmitting}
                  className="register-btn register-btn--outline"
                >
                  <ArrowLeft size={14} />
                  Back
                </Button>
              ) : (
                <div />
              )}

              {currentStep < 3 ? (
                <Button
                  type="button"
                  onClick={handleNextStep}
                  className="register-btn register-btn--primary"
                >
                  <span>Next Step</span>
                  <ArrowRight size={14} />
                </Button>
              ) : (
                <Button
                  type="submit"
                  className="register-btn register-btn--primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Registering Agency...
                    </>
                  ) : (
                    <>
                      <span>Complete Registration</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}

/* ════════════════════════════════════════════════════════════
   FIELD WORKER REGISTRATION (apply to an agency, pending approval)
   ════════════════════════════════════════════════════════════ */

interface FieldFormData {
  name: string;
  email: string;
  phone_number: string;
  password: string;
  confirm: string;
}

const FW_STEPS = [
  { id: 1, title: "Agency", subtitle: "Pick your response unit" },
  { id: 2, title: "Details", subtitle: "Who you are" },
  { id: 3, title: "Password", subtitle: "Secure your account" },
];

function fwStrength(pw: string) {
  if (!pw) return { label: "", score: 0, color: "" };
  if (pw.length < 6) return { label: "Weak", score: 25, color: "var(--color-error)" };
  if (pw.length < 10) return { label: "Medium", score: 60, color: "var(--color-warning)" };
  return { label: "Strong", score: 100, color: "var(--color-success)" };
}

function FieldWorkerRegister() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [apiError, setApiError] = useState<ApiFieldError | null>(null);
  const [search, setSearch] = useState("");
  const [selectedAgency, setSelectedAgency] = useState<AgencyOption | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    data: agencies = [],
    isLoading,
    isError,
  } = useQuery<AgencyOption[]>({
    queryKey: ["agency", "options"],
    queryFn: async () => await fieldWorkerApi.getAgencyOptions(),
    staleTime: 60 * 1000,
  });

  const {
    register,
    watch,
    trigger,
    formState: { errors },
  } = useForm<FieldFormData>({
    defaultValues: { name: "", email: "", phone_number: "", password: "", confirm: "" },
  });

  const password = watch("password") || "";
  const confirm = watch("confirm") || "";
  const strength = fwStrength(password);

  const filtered = agencies.filter((a) =>
    `${a.name} ${a.region || ""}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleBack = () => {
    setApiError(null);
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
  };

  const handleNext = async () => {
    setApiError(null);
    if (step === 1) {
      if (!selectedAgency) {
        toast.error("Please select the agency you'd like to join.");
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      const ok = await trigger(["name", "email", "phone_number"]);
      if (ok) setStep(3);
      return;
    }
    if (step === 3) {
      const ok = await trigger(["password"]);
      if (!ok) return;
      if (!confirm) {
        toast.error("Please confirm your password.");
        return;
      }
      if (password !== confirm) {
        setApiError({ field: "root", message: "Passwords do not match. Please enter them again." });
        return;
      }
      await doSubmit();
    }
  };

  const doSubmit = async () => {
    if (!selectedAgency) return;
    setApiError(null);
    setIsSubmitting(true);
    try {
      await fieldWorkerApi.register({
        name: watch("name"),
        email: watch("email"),
        phone_number: watch("phone_number"),
        password,
        agency_id: selectedAgency.id,
      });
      setSubmitted(true);
    } catch (err) {
      const apiErr = err as ApiError;
      const message =
        apiErr?.response?.data?.error ||
        apiErr?.response?.data?.message ||
        "Failed to submit your application. Please try again.";
      toast.error(message);
      setApiError({ field: "root", message });
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="register-card">
        <CardContent>
          <div className="register-success">
            <div className="register-success-icon">
              <CheckCircle2 size={32} />
            </div>
            <h2>Application submitted</h2>
            <p>
              Your field worker application for{" "}
              <strong>{selectedAgency?.name || "the agency"}</strong> is now
              pending approval.
            </p>
            <div className="register-success-steps">
              <div className="register-success-step">
                <span className="register-success-step__dot"><Check size={14} /></span>
                <span>Your agency admin will review your application.</span>
              </div>
              <div className="register-success-step">
                <span className="register-success-step__dot"><Check size={14} /></span>
                <span>Once approved, you can sign in to the Field Worker app.</span>
              </div>
            </div>
            <div className="register-success-actions">
              <Link href="/login?role=field" className="register-btn register-btn--primary register-link-btn">
                Go to Field Worker Login
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="register-brand">
        <div className="register-brand-icon">
          <HardHat size={28} />
        </div>
        <h1>Join as a Field Worker</h1>
        <p>Apply to respond through a verified agency</p>
      </div>

      {/* Stepper */}
      <div className="register-stepper">
        {FW_STEPS.map((s) => {
          const isCompleted = step > s.id;
          const isCurrent = step === s.id;
          return (
            <div
              key={s.id}
              className={`register-stepper-step ${
                isCompleted
                  ? "register-stepper-step--completed"
                  : isCurrent
                  ? "register-stepper-step--current"
                  : "register-stepper-step--todo"
              }`}
            >
              <div className="register-stepper-group">
                <div className="register-stepper-icon">
                  {isCompleted ? <CheckCircle2 size={16} /> : <span>{s.id}</span>}
                </div>
                <div className="register-stepper-label">
                  <span className="register-stepper-label-title">{s.title}</span>
                  <span className="register-stepper-label-sub">{s.subtitle}</span>
                </div>
              </div>
              {s.id < FW_STEPS.length && (
                <div className={`register-stepper-line ${isCompleted ? "register-stepper-line--done" : ""}`} />
              )}
            </div>
          );
        })}
      </div>

      <Card className="register-card">
        <CardContent>
          {apiError?.field === "root" && (
            <div className="register-error-box">{apiError.message}</div>
          )}

          {/* STEP 1 — AGENCY */}
          {step === 1 && (
            <div className="register-form-inner">
              <div className="register-section-title">
                <h2>
                  <Building2 size={16} /> Choose your response unit
                </h2>
                <p>Pick the verified agency you want to respond with</p>
              </div>

              {isLoading ? (
                <div className="register-field-loading">
                  <Loader2 size={16} className="animate-spin" /> Loading agencies...
                </div>
              ) : isError ? (
                <div className="register-simple-hint">
                  Couldn&apos;t load agencies. Check your connection and refresh.
                </div>
              ) : (
                <>
                  <div className="input-wrapper">
                    <Search size={16} className="input-icon" />
                    <Input
                      placeholder="Search agency by name or region"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      style={{ paddingLeft: 40 }}
                    />
                  </div>
                  <div className="register-agency-list">
                    {filtered.length === 0 && (
                      <div className="register-simple-hint">No agencies found.</div>
                    )}
                    {filtered.map((a) => {
                      const active = selectedAgency?.id === a.id;
                      return (
                        <button
                          key={a.id}
                          type="button"
                          className={`register-agency-option ${active ? "register-agency-option--active" : ""}`}
                          onClick={() => setSelectedAgency(a)}
                        >
                          <span className="register-agency-option-icon">
                            <Building2 size={16} />
                          </span>
                          <span className="register-agency-option-meta">
                            <strong>{a.name}</strong>
                            <span>{a.region || "Region TBD"}</span>
                            {a.phone_number && (
                              <span className="register-agency-option-phone">
                                <Phone size={12} /> {a.phone_number}
                              </span>
                            )}
                          </span>
                          {active ? (
                            <CheckCircle2 size={18} className="register-agency-option-check" />
                          ) : (
                            <span className="register-agency-option-radio" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {!selectedAgency && (
                    <p className="field-error">Select an agency to continue.</p>
                  )}
                </>
              )}
            </div>
          )}

          {/* STEP 2 — DETAILS */}
          {step === 2 && (
            <div className="register-form-inner">
              <div className="register-section-title">
                <h2>
                  <User size={16} /> Your details
                </h2>
                <p>How your agency and dispatch should reach you</p>
              </div>

              {selectedAgency && (
                <div className="register-selected-agency">
                  <Building2 size={16} />
                  <span>
                    Joining <strong>{selectedAgency.name}</strong>
                  </span>
                </div>
              )}

              <div className="register-simple-field">
                <Label htmlFor="fname">Full Name</Label>
                <div className="input-wrapper">
                  <User size={16} className="input-icon" />
                  <Input
                    id="fname"
                    placeholder="Your full name"
                    className={errors.name ? "error" : ""}
                    style={{ paddingLeft: 40 }}
                    {...register("name", { required: "Full name is required" })}
                  />
                </div>
                {errors.name && <p className="field-error">{errors.name.message}</p>}
              </div>

              <div className="register-simple-field">
                <Label htmlFor="femail">Email</Label>
                <div className="input-wrapper">
                  <Mail size={16} className="input-icon" />
                  <Input
                    id="femail"
                    type="email"
                    placeholder="you@example.com"
                    className={errors.email ? "error" : ""}
                    style={{ paddingLeft: 40 }}
                    {...register("email", { required: "Email is required" })}
                  />
                </div>
                {errors.email && <p className="field-error">{errors.email.message}</p>}
              </div>

              <div className="register-simple-field">
                <Label htmlFor="fphone">Phone Number</Label>
                <div className="input-wrapper">
                  <Phone size={16} className="input-icon" />
                  <Input
                    id="fphone"
                    placeholder="+1 (555) 000-0000"
                    className={errors.phone_number ? "error" : ""}
                    style={{ paddingLeft: 40 }}
                    {...register("phone_number", { required: "Phone number is required" })}
                  />
                </div>
                {errors.phone_number && <p className="field-error">{errors.phone_number.message}</p>}
              </div>
            </div>
          )}

          {/* STEP 3 — PASSWORD */}
          {step === 3 && (
            <div className="register-form-inner">
              <div className="register-section-title">
                <h2>
                  <LockKeyhole size={16} /> Create a password
                </h2>
                <p>You&apos;ll use this to sign in to the Field Worker app</p>
              </div>

              <div className="register-simple-field">
                <Label htmlFor="fpassword">Password</Label>
                <div className="input-wrapper">
                  <LockKeyhole size={16} className="input-icon" />
                  <Input
                    id="fpassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimum 6 characters"
                    className={`password-input ${errors.password ? "error" : ""}`}
                    style={{ paddingLeft: 40, paddingRight: 40 }}
                    {...register("password", {
                      required: "Password is required",
                      minLength: { value: 6, message: "At least 6 characters" },
                    })}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="field-error">{errors.password.message}</p>}
                {password && (
                  <div className="login-strength" style={{ marginTop: 8 }}>
                    <div className="login-strength-label">
                      <span>Strength: </span>
                      <span>{strength.label}</span>
                    </div>
                    <div className="login-strength-bar">
                      <div
                        className="login-strength-bar__fill"
                        style={{ width: `${strength.score}%`, background: strength.color }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="register-simple-field">
                <Label htmlFor="fconfirm">Confirm Password</Label>
                <div className="input-wrapper">
                  <LockKeyhole size={16} className="input-icon" />
                  <Input
                    id="fconfirm"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Repeat your password"
                    className="password-input"
                    style={{ paddingLeft: 40, paddingRight: 40 }}
                    {...register("confirm", { required: "Please confirm your password" })}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirm(!showConfirm)}
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {confirm && password && confirm !== password && (
                  <p className="field-error">Passwords do not match.</p>
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="register-actions">
            {step > 1 ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={isSubmitting}
                className="register-btn register-btn--outline"
              >
                <ArrowLeft size={14} /> Back
              </Button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <Button type="button" onClick={handleNext} className="register-btn register-btn--primary">
                <span>Continue</span> <ArrowRight size={14} />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleNext}
                className="register-btn register-btn--primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    <span>Submit Application</span> <ArrowRight size={14} />
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

/* ════════════════════════════════════════════════════════════
   PAGE SHELL (role toggle)
   ════════════════════════════════════════════════════════════ */

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="register-page">
          <Loader2 size={24} className="animate-spin" />
        </div>
      }
    >
      <RegisterPageInner />
    </Suspense>
  );
}

function RegisterPageInner() {
  const searchParams = useSearchParams();
  const isFieldOnly = searchParams.get("role") === "field";
  const [registerRole, setRegisterRole] = useState<"admin" | "field">(
    isFieldOnly ? "field" : "admin"
  );

  return (
    <div className="register-page">
      <div className="register-glow" />

      <div className="register-container">
        {!isFieldOnly && (
          <div className="register-role-tabs">
            <button
              type="button"
              className={`register-role-tab ${registerRole === "admin" ? "register-role-tab--active" : ""}`}
              onClick={() => setRegisterRole("admin")}
            >
              <Building2 size={14} />
              Agency Console
            </button>
            <button
              type="button"
              className={`register-role-tab ${registerRole === "field" ? "register-role-tab--active" : ""}`}
              onClick={() => setRegisterRole("field")}
            >
              <HardHat size={14} />
              Field Worker
            </button>
          </div>
        )}

        {registerRole === "admin" ? <AgencyRegisterWizard /> : <FieldWorkerRegister />}

        <div className="register-footer">
          <p>
            Already registered?{" "}
            <Link
              href={registerRole === "field" ? "/login?role=field" : "/login"}
              className="register-footer-link"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
