// components/SubscriptionServer.tsx
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { getClerkSubscriptionPlans, ClerkPlan } from "@/lib/clerk/plan";
import SubscriptionClient from "@/components/SubscriptionClient";

export async function Subscription() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) redirect("/sign-in");

  const activePlanKey = (user.publicMetadata?.plan as string) || "basic";

  let plans: ClerkPlan[] = [];

  try {
    plans = await getClerkSubscriptionPlans();
    plans.sort((a, b) => a.monthlyPriceINR - b.monthlyPriceINR);
  } catch (err: any) {
    console.error("Error loading plans:", err);
  }

  return (
    <SubscriptionClient
      initialPlans={plans}
      activePlanKey={activePlanKey}
      userId={userId}
    />
  );
}