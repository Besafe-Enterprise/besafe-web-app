"use client";

import { useState } from "react";
import {
  Building2,
  ShieldCheck,
  ShieldAlert,
  MapPin,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
  Loader2,
  Search,
  ExternalLink,
  SlidersHorizontal,
} from "lucide-react";
import { AdminPageHeader } from "@/components/shared/admin-page-header";
import { AdminStatCard } from "@/components/shared/admin-stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  useGetAllAgencies,
  useVerifyAgency,
} from "@/lib/hooks/team/use-team-data";
import { formatDate } from "@/lib/utils/format";

export default function PlatformAgenciesPage() {
  const { data: agencies = [], isLoading, refetch } = useGetAllAgencies();
  const { mutate: verifyAgency, isPending: isVerifying } = useVerifyAgency();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterVerified, setFilterVerified] = useState<"all" | "verified" | "pending">("all");

  const filteredAgencies = agencies.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.region || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.email.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterVerified === "verified") return a.is_verified !== false;
    if (filterVerified === "pending") return a.is_verified === false;
    return true;
  });

  const totalAgencies = agencies.length;
  const verifiedCount = agencies.filter((a) => a.is_verified !== false).length;
  const pendingCount = agencies.filter((a) => a.is_verified === false).length;

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* ─── 1. Header ────────────────────────────────────────────── */}
      <AdminPageHeader
        title="Platform Agency Matrix"
        subtitle="Global station verification queue, emergency coverage perimeters, and jurisdictional controls"
      />

      {/* ─── 2. Metric Row ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AdminStatCard
          label="Registered Stations"
          value={isLoading ? "..." : totalAgencies}
          icon={Building2}
          accentColor="primary"
          trend={{
            value: "GLOBAL",
            isPositive: true,
            description: "Platform network nodes",
          }}
          subtext="Total emergency stations"
        />

        <AdminStatCard
          label="Verified Operational"
          value={isLoading ? "..." : verifiedCount}
          icon={ShieldCheck}
          accentColor="emerald"
          subtext="Active emergency endpoints"
        />

        <AdminStatCard
          label="Pending / Review"
          value={isLoading ? "..." : pendingCount}
          icon={ShieldAlert}
          accentColor="amber"
          subtext="Unverified stations"
        />
      </div>

      {/* ─── 3. Search & Filter Bar ───────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search stations by name, city, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-card border border-border/80 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-muted/40 p-1 rounded-xl border border-border/60">
          {(["all", "verified", "pending"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilterVerified(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                filterVerified === tab
                  ? "bg-card text-foreground shadow-sm font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ─── 4. Agencies Table ────────────────────────────────────── */}
      <Card className="border-border/80 bg-card/90 shadow-lg backdrop-blur-md overflow-hidden">
        <CardHeader className="p-4 sm:px-5 sm:py-4 border-b border-border/80 bg-secondary/10">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              <span>Registered Emergency Response Agencies</span>
            </CardTitle>
            <Badge variant="outline" className="text-[10px] font-mono font-bold">
              {filteredAgencies.length} Nodes
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span>Loading platform stations...</span>
            </div>
          ) : filteredAgencies.length === 0 ? (
            <div className="p-12 text-center text-xs text-muted-foreground space-y-2">
              <Building2 className="w-10 h-10 mx-auto text-muted-foreground/50" />
              <p className="font-semibold text-foreground">No matching agencies found</p>
              <p className="text-muted-foreground text-[11px]">
                Try adjusting your search query or verification filter.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/20 text-muted-foreground uppercase tracking-wider font-semibold text-[10px]">
                    <th className="py-3 px-4">Station & Region</th>
                    <th className="py-3 px-4">Verification</th>
                    <th className="py-3 px-4">Contact Coordinates</th>
                    <th className="py-3 px-4">Coverage Base</th>
                    <th className="py-3 px-4">Registration Date</th>
                    <th className="py-3 px-4 text-right">Verification Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredAgencies.map((agency) => {
                    const isVerified = agency.is_verified !== false;
                    const lat = agency.latitude || agency.location?.lat || 0;
                    const lng = agency.longitude || agency.location?.lng || 0;

                    return (
                      <tr
                        key={agency.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        {/* Name & Region */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                              {agency.name[0]?.toUpperCase() || "A"}
                            </div>
                            <div>
                              <p className="font-bold text-foreground text-xs">
                                {agency.name}
                              </p>
                              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-primary" />
                                <span>{agency.region || "Sector Not Specified"}</span>
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          {isVerified ? (
                            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Verified Station
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-amber-400 font-semibold text-[11px]">
                              <ShieldAlert className="w-3.5 h-3.5" /> Pending Approval
                            </span>
                          )}
                        </td>

                        {/* Contact */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5 text-[11px] font-mono text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <Mail className="w-3 h-3 text-primary" />
                              <span>{agency.email}</span>
                            </div>
                            {agency.phone_number && (
                              <div className="flex items-center gap-1.5">
                                <Phone className="w-3 h-3 text-emerald-400" />
                                <span>{agency.phone_number}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Coordinates */}
                        <td className="py-3.5 px-4 text-[11px] font-mono text-muted-foreground">
                          {lat !== 0 && lng !== 0 ? (
                            <span className="text-primary font-semibold">
                              {lat.toFixed(4)}°, {lng.toFixed(4)}°
                            </span>
                          ) : (
                            <span>No GPS Pin</span>
                          )}
                        </td>

                        {/* Registered Date */}
                        <td className="py-3.5 px-4 text-[11px] text-muted-foreground">
                          {formatDate(agency.created_at)}
                        </td>

                        {/* Action */}
                        <td className="py-3.5 px-4 text-right">
                          {isVerified ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                verifyAgency({
                                  agencyId: String(agency.id),
                                  isVerified: false,
                                })
                              }
                              disabled={isVerifying}
                              className="h-8 px-2.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
                            >
                              <XCircle className="w-3.5 h-3.5 mr-1" />
                              <span>Revoke Status</span>
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() =>
                                verifyAgency({
                                  agencyId: String(agency.id),
                                  isVerified: true,
                                })
                              }
                              disabled={isVerifying}
                              className="h-8 px-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                              <span>Approve Station</span>
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
