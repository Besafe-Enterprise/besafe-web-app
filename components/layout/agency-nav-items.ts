import {
  LayoutDashboard,
  Map,
  AlertTriangle,
  FileText,
  Settings,
  Users,
  Building2,
  SlidersHorizontal,
  MapPin,
  Lock,
  Radio,
} from "lucide-react";
import type { ComponentType } from "react";
import type { AgencyRole } from "@/types/auth";

export interface NavItem {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  badgeKey?: "alerts" | "reports";
  requiredRoles?: AgencyRole[];
}

export interface NavGroup {
  title: string;
  items: string[];
  requiredRoles?: AgencyRole[];
}

export const navItems: NavItem[] = [
  {
    label: "Overview HUD",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Live Vector Radar",
    href: "/dashboard/map",
    icon: Map,
  },
  {
    label: "Emergency Alerts",
    href: "/dashboard/alerts",
    icon: AlertTriangle,
    badgeKey: "alerts",
  },
  {
    label: "SafeChat Reports",
    href: "/dashboard/reports",
    icon: FileText,
    badgeKey: "reports",
  },
  {
    label: "Agency Team",
    href: "/dashboard/team",
    icon: Users,
    requiredRoles: ["SUPER_ADMIN", "AGENCY_ADMIN"],
  },
  {
    label: "Agency Settings",
    href: "/dashboard/settings",
    icon: Settings,
    requiredRoles: ["SUPER_ADMIN", "AGENCY_ADMIN"],
  },
  {
    label: "Agencies Matrix",
    href: "/dashboard/admin/agencies",
    icon: Building2,
    requiredRoles: ["SUPER_ADMIN"],
  },
];

export const navGroups: NavGroup[] = [
  {
    title: "Command & Telemetry",
    items: ["/dashboard", "/dashboard/map", "/dashboard/alerts"],
  },
  {
    title: "Intelligence & Reports",
    items: ["/dashboard/reports"],
  },
  {
    title: "Agency Administration",
    items: ["/dashboard/team", "/dashboard/settings"],
    requiredRoles: ["SUPER_ADMIN", "AGENCY_ADMIN"],
  },
  {
    title: "Platform Administration",
    items: ["/dashboard/admin/agencies"],
    requiredRoles: ["SUPER_ADMIN"],
  },
];

export const settingsNavItems: NavItem[] = [
  {
    label: "Agency Profile",
    href: "/dashboard/settings",
    icon: SlidersHorizontal,
  },
  {
    label: "Agency Geolocation",
    href: "/dashboard/settings/location",
    icon: MapPin,
  },

  {
    label: "Access Passcode",
    href: "/dashboard/settings/security",
    icon: Lock,
  },
  {
    label: "Sound & Telemetry",
    href: "/dashboard/settings/telemetry",
    icon: Radio,
  },
];
