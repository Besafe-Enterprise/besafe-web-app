import { z } from "zod"

export const agencyLoginSchema = z.object({
  email: z
    .string()
    .min(1, "Agency email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
  role: z.enum(["admin", "field"]).optional(),
})

export type AgencyLoginFormData = z.infer<typeof agencyLoginSchema>

export const agencyRegisterSchema = z.object({
  // Step 1: Agency Identity
  name: z
    .string()
    .min(1, "Agency / Department name is required")
    .min(3, "Name must be at least 3 characters"),
  region: z
    .string()
    .min(1, "Operational region / city is required")
    .min(2, "Region / City must be at least 2 characters"),
  phone_number: z
    .string()
    .min(1, "Emergency dispatch contact number is required")
    .min(6, "Please enter a valid phone number"),

  // Step 2: Station Location
  lat: z.coerce.number().refine((val) => val >= -90 && val <= 90, {
    message: "Latitude must be between -90 and 90",
  }),
  lng: z.coerce.number().refine((val) => val >= -180 && val <= 180, {
    message: "Longitude must be between -180 and 180",
  }),

  // Step 3: Access & Security Credentials
  email: z
    .string()
    .min(1, "Official email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Access password is required")
    .min(6, "Password must be at least 6 characters"),
})

export type AgencyRegisterFormData = z.infer<typeof agencyRegisterSchema>

export const step1Fields: (keyof AgencyRegisterFormData)[] = ["name", "region", "phone_number"]
export const step2Fields: (keyof AgencyRegisterFormData)[] = ["lat", "lng"]
export const step3Fields: (keyof AgencyRegisterFormData)[] = ["email", "password"]
