export type ApplicationStatus = "pending" | "approved" | "rejected";

export interface TenantApplication {
    id: string;
    applicantId: string;
    orgName: string;
    requestedSlug: string;
    description?: string | null;
    status: ApplicationStatus;
    reviewedBy?: string | null;
    reviewedAt?: string | null;
    rejectionNote?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateTenantApplicationData {
    orgName: string;
    requestedSlug: string;
    description?: string;
}

export interface ReviewTenantApplicationData {
    status: ApplicationStatus;
    rejectionNote?: string;
}
