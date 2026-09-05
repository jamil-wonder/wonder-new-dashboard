"use client";

import { CreditCard } from "lucide-react";

export function PaymentMethod() {
  return (
    <div className="bg-white border border-[#ece3d1] rounded-[18px] p-6 shadow-[0_1px_2px_rgba(60,48,28,0.04)]">
      <div className="font-mono-spline text-[10px] tracking-[0.14em] uppercase text-[#9b927f] mb-3">
        Payment Method
      </div>
      <div className="flex flex-col items-center justify-center gap-2 p-6 bg-[#fdfcf8] border border-dashed border-[#d8cfbd] rounded-xl text-center">
        <CreditCard className="w-5 h-5 text-[#9b927f]" />
        <div className="text-[13px] font-semibold text-[#6f6757]">No payment method on file</div>
        <div className="text-[12px] text-[#9b927f]">
          You&apos;ll be able to add a card once paid plans open up.
        </div>
      </div>
    </div>
  );
}

export function BillingHistory() {
  return (
    <div className="bg-white border border-[#ece3d1] rounded-[18px] p-6 shadow-[0_1px_2px_rgba(60,48,28,0.04)]">
      <div className="font-mono-spline text-[10px] tracking-[0.14em] uppercase text-[#9b927f] mb-4">
        Billing &amp; Invoice History
      </div>
      <div className="flex flex-col items-center justify-center gap-1 py-6 text-center">
        <div className="text-[13px] font-semibold text-[#6f6757]">No invoices yet</div>
        <div className="text-[12px] text-[#9b927f]">
          Nothing has been charged to this account.
        </div>
      </div>
    </div>
  );
}
