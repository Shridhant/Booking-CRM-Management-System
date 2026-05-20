import { z } from "zod"

export const createEmployeeSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    bio: z.string().optional(),
    experience_years: z.number().int().min(0).max(50).optional(),
    branch_ids: z
        .array(z.string().uuid("Each branch_id must be a valid UUID"))
        .min(1, "At least one branch must be assigned"),
})

export const updateEmployeeSchema = z.object({
    name: z.string().min(2).optional(),
    bio: z.string().optional(),
    experience_years: z.number().int().min(0).max(50).optional(),
    is_active: z.boolean().optional(),
})

export const assignBranchesSchema = z.object({
    branch_ids: z
        .array(z.string().uuid("Each branch_id must be a valid UUID"))
        .min(1, "At least one branch_id is required"),
})

export type CreateEmployeeSchema = z.infer<typeof createEmployeeSchema>
export type UpdateEmployeeSchema = z.infer<typeof updateEmployeeSchema>
export type AssignBranchesSchema = z.infer<typeof assignBranchesSchema>