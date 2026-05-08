// app/user/match/page.tsx

import { redirect } from "next/navigation";
import { hasActiveTenantMembershipAction } from "@/app/actions/tenant";
import { UserMatchClient } from "./UserMatchClient";

export default async function UserMatchPage() {
    const result = await hasActiveTenantMembershipAction();

    // If the user does not have an active tenant membership, redirect them to the user dashboard
    if (!result.hasMembership) {
        redirect("/user");
    }

    return <UserMatchClient />;
}
