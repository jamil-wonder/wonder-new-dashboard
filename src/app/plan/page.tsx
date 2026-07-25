"use client";

import SubscriptionCard from "../../components/plan/SubscriptionCard";
import { PaymentMethod, BillingHistory } from "../../components/plan/BillingComponents";

export default function PlanPage() {
  return (
    <div className="space-y-6">
      <SubscriptionCard />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PaymentMethod />
        <BillingHistory />
      </div>
    </div>
  );
}
