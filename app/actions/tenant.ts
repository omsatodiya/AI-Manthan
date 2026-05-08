// app/actions/tenant.ts

"use server";

import { getDb } from "@/lib/database";
import { getCurrentUserAction } from "./auth";

export async function hasActiveTenantMembershipAction() {
    try {
        const currentUser = await getCurrentUserAction();

        if (!currentUser) {
            return {
                success: false,
                hasMembership: false,
            };
        }

        const db = await getDb();

        const memberships =
            await db.getTenantMembersByUser(
                currentUser.id
            );

        const hasActiveMembership =
            memberships?.some(
                (member) =>
                    member.status === "active"
            ) ?? false;

        return {
            success: true,
            hasMembership: hasActiveMembership,
        };
    } catch (error) {
        console.error(
            "hasActiveTenantMembershipAction",
            error
        );

        return {
            success: false,
            hasMembership: false,
        };
    }
}