"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Save,
  Loader2,
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
import { useAgencyAuthStore } from "@/lib/store/agency-auth-store";
import { useUpdateAgencyDetails } from "@/lib/hooks/settings/use-agency-settings";

export default function StationProfileSettingsPage() {
  const agency = useAgencyAuthStore((s) => s.agency);

  // Form State
  const [name, setName] = useState(agency?.name || "");
  const [email, setEmail] = useState(agency?.email || "");
  const [phone, setPhone] = useState(agency?.phone_number || "");
  const [region, setRegion] = useState(agency?.region || "");

  const { mutate: updateDetails, isPending } = useUpdateAgencyDetails();

  useEffect(() => {
    if (agency) {
      setName(agency.name || "");
      setEmail(agency.email || "");
      setPhone(agency.phone_number || "");
      setRegion(agency.region || "");
    }
  }, [agency]);

  const handleSaveDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    updateDetails({
      name,
      email,
      region,
      phone_number: phone,
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in-50 duration-200">
      {/* ─── Header ────────────────────────────────────────────── */}
      <AdminPageHeader
        title="Station Profile & Identity"
        subtitle="Manage official agency credentials and public distress routing contact information"
        action={
          <Badge
            variant="outline"
            className="h-8 px-3 text-xs font-mono font-bold bg-primary/10 border-primary/30 text-primary flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            <span>Station Base Online</span>
          </Badge>
        }
      />

      {/* ─── Profile Form Card ─────────────────────────────────── */}
      <Card className="border-border/80 bg-card/90 shadow-lg backdrop-blur-md overflow-hidden">
        <CardHeader className="p-5 border-b border-border/80 bg-secondary/10">
          <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" />
            <span>Official Station Identity</span>
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Public station credentials displayed to citizens during SOS routing and dispatch operations
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSaveDetails} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Agency Name */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-primary" />
                  <span>Station / Agency Name</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Metropolitan Emergency Response Command"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border/80 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Region / City */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  <span>Jurisdiction Region / City</span>
                </label>
                <input
                  type="text"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder="e.g. Khartoum Metropolitan / Central Sector"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border/80 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Hotline Phone */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Emergency Routing Hotline Phone</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +234 800 555 0199"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border/80 text-foreground text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <p className="text-[10px] text-muted-foreground">
                  Citizens enter this hotline code to route direct mobile SOS distress calls here.
                </p>
              </div>

              {/* Official Email */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-primary" />
                  <span>Official Dispatch Email</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. command@safety.agency.gov"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border/80 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-border/60">
              <Button
                type="submit"
                size="sm"
                disabled={isPending}
                className="h-9 px-4 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    <span>Saving Profile...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5 mr-1.5" />
                    <span>Save Station Profile</span>
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
