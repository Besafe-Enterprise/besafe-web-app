"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import dynamic from "next/dynamic";
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
  step3Fields,
  type AgencyRegisterFormData,
} from "@/lib/validations/auth.schema";
import { toast } from "sonner";
import type { ApiFieldError } from "@/types/auth";

interface ApiError {
  response?: {
    data?: {
      error?: string;
      message?: string;
    };
  };
}

// Dynamic import for Mapbox Location Picker to bypass SSR
const LocationMapPicker = dynamic(
  () => import("@/components/map/LocationMapPicker"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[260px] rounded-xl flex items-center justify-center bg-card border border-border">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span>Loading Map Radar...</span>
        </div>
      </div>
    ),
  }
);

const STEPS = [
  { id: 1, title: "Identity", subtitle: "Agency Profile", icon: Building2 },
  { id: 2, title: "Location", subtitle: "Station Map", icon: Compass },
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

  // Validate only the current step before advancing
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
              router.push("/operations");
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
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background Tactical Glows */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-background to-background" />
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-indigo-600/10 blur-3xl" />

      <div className="relative z-10 w-full max-w-xl space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-xl shadow-blue-500/20 ring-1 ring-white/20">
            <ShieldAlert className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Agency Onboarding Wizard
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Configure your emergency response station in 3 quick steps
            </p>
          </div>
        </div>

        {/* ─── 3-Step Interactive Stepper Bar ────────────────────────────── */}
        <div className="flex items-center justify-between px-3 sm:px-6">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;

            return (
              <div key={step.id} className="flex items-center flex-1 last:flex-none">
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold transition-all duration-300 ${
                      isCompleted
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                        : isCurrent
                        ? "bg-primary/20 text-primary border border-primary ring-2 ring-primary/30"
                        : "bg-muted text-muted-foreground border border-border"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div
                      className={`text-xs font-semibold ${
                        isCurrent ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {step.title}
                    </div>
                    <div className="text-[10px] text-muted-foreground/70">
                      {step.subtitle}
                    </div>
                  </div>
                </div>

                {/* Connector line between steps */}
                {idx < STEPS.length - 1 && (
                  <div
                    className={`h-[2px] mx-3 flex-1 transition-colors duration-300 ${
                      currentStep > step.id ? "bg-primary" : "bg-border"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* ─── Wizard Content Card ───────────────────────────────────────── */}
        <Card className="border border-border/80 bg-card/90 shadow-2xl backdrop-blur-xl">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* ═════════ STEP 1: AGENCY IDENTITY ═════════ */}
              {currentStep === 1 && (
                <div className="space-y-4 animate-in fade-in-50 duration-200">
                  <div className="pb-2 border-b border-border/50">
                    <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-primary" />
                      Agency Identity & Operational Region
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Enter official department identity and primary dispatch phone number
                    </p>
                  </div>

                  {/* Agency Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name">Agency / Department Name</Label>
                    <div className="relative">
                      <Building2 className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="name"
                        placeholder="e.g. Metropolitan Police Division 4"
                        className="pl-10 text-foreground bg-background/50 border-input focus-visible:ring-primary/60"
                        {...register("name")}
                      />
                    </div>
                    {errors.name && (
                      <p className="flex items-center gap-1.5 text-xs text-destructive mt-1 font-medium">
                        <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  {/* Region & Phone Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="region">Region / City</Label>
                      <div className="relative">
                        <MapPin className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="region"
                          placeholder="e.g. Lagos, London, or Khartoum North"
                          className="pl-10 text-foreground bg-background/50 border-input focus-visible:ring-primary/60"
                          {...register("region")}
                        />
                      </div>
                      {errors.region && (
                        <p className="flex items-center gap-1.5 text-xs text-destructive mt-1 font-medium">
                          <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
                          {errors.region.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone_number">Dispatch Contact Phone</Label>
                      <div className="relative">
                        <Phone className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="phone_number"
                          placeholder="+1 (800) 555-0199"
                          className="pl-10 text-foreground bg-background/50 border-input focus-visible:ring-primary/60"
                          {...register("phone_number")}
                        />
                      </div>
                      {errors.phone_number && (
                        <p className="flex items-center gap-1.5 text-xs text-destructive mt-1 font-medium">
                          <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
                          {errors.phone_number.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ═════════ STEP 2: STATION LOCATION (SEARCH & MAP) ═════════ */}
              {currentStep === 2 && (
                <div className="space-y-4 animate-in fade-in-50 duration-200">
                  <div className="pb-2 border-b border-border/50">
                    <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                      <Compass className="w-4 h-4 text-primary" />
                      Station Headquarters Location
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Search your station address or drag the pin on the map to set your response base
                    </p>
                  </div>

                  {/* Interactive Mapbox Location Picker */}
                  <LocationMapPicker
                    lat={formValues.lat}
                    lng={formValues.lng}
                    onLocationChange={(newLat, newLng, placeName) => {
                      setValue("lat", newLat, { shouldValidate: true });
                      setValue("lng", newLng, { shouldValidate: true });
                      if (placeName) setStationPlaceLabel(placeName);
                    }}
                  />

                  {/* Errors if any */}
                  {(errors.lat || errors.lng) && (
                    <p className="flex items-center gap-1.5 text-xs text-destructive font-medium">
                      <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
                      {errors.lat?.message || errors.lng?.message}
                    </p>
                  )}

                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <span>
                      BeSafe&apos;s geospatial proximity engine automatically routes distress alerts within your station&apos;s operational radius.
                    </span>
                  </div>
                </div>
              )}

              {/* ═════════ STEP 3: ACCESS CREDENTIALS ═════════ */}
              {currentStep === 3 && (
                <div className="space-y-4 animate-in fade-in-50 duration-200">
                  <div className="pb-2 border-b border-border/50">
                    <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                      <LockKeyhole className="w-4 h-4 text-primary" />
                      Access & Security Credentials
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Set up your master dispatch login and review agency details
                    </p>
                  </div>

                  {/* Summary Review Pill */}
                  <div className="p-3.5 rounded-xl bg-background/50 border border-border space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Agency:</span>
                      <span className="font-semibold text-foreground">{formValues.name || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Region / City:</span>
                      <span className="font-semibold text-foreground">{formValues.region || "—"}</span>
                    </div>
                    {stationPlaceLabel && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Station Address:</span>
                        <span className="font-medium text-foreground truncate max-w-[220px]">{stationPlaceLabel}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-mono text-[11px]">
                      <span className="text-muted-foreground">Station Coordinates:</span>
                      <span className="text-primary">{formValues.lat}° N, {formValues.lng}° E</span>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Official Admin Email</Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="dispatch@police.gov"
                        className="pl-10 text-foreground bg-background/50 border-input focus-visible:ring-primary/60"
                        {...register("email")}
                      />
                    </div>
                    {errors.email && (
                      <p className="flex items-center gap-1.5 text-xs text-destructive mt-1 font-medium">
                        <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
                        {errors.email.message}
                      </p>
                    )}
                    {apiError?.field === "email" && (
                      <p className="flex items-center gap-1.5 text-xs text-destructive mt-1 font-medium">
                        <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
                        {apiError.message}
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="password">Master Access Password</Label>
                    <div className="relative">
                      <LockKeyhole className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••••••"
                        className="pr-10 pl-10 text-foreground bg-background/50 border-input focus-visible:ring-primary/60"
                        {...register("password")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="flex items-center gap-1.5 text-xs text-destructive mt-1 font-medium">
                        <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
                        {errors.password.message}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Root Error Banner */}
              {apiError?.field === "root" && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 backdrop-blur-sm animate-in fade-in-50">
                  <p className="text-center text-xs font-medium text-destructive leading-relaxed">
                    {apiError.message}
                  </p>
                </div>
              )}

              {/* ─── Wizard Action Buttons ──────────────────────────────── */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-border/60">
                {currentStep > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevStep}
                    disabled={isSubmitting}
                    className="h-10 px-4 text-xs font-semibold"
                  >
                    <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                    Back
                  </Button>
                ) : (
                  <div />
                )}

                {currentStep < 3 ? (
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    className="h-10 px-5 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20"
                  >
                    <span>Next Step</span>
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    className="h-10 px-6 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Registering Agency...
                      </>
                    ) : (
                      <>
                        <span>Complete Registration</span>
                        <ArrowRight className="ml-1.5 h-4 w-4" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>

            {/* Footer Navigation */}
            <div className="text-center space-y-2 mt-4">
              <p className="text-xs text-muted-foreground">
                Already registered with the dispatch grid?{" "}
                <Link
                  href="/login"
                  className="font-medium text-primary hover:underline hover:text-primary/90"
                >
                  Sign in to Command
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AgencyRegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <AgencyRegisterWizard />
    </Suspense>
  );
}
