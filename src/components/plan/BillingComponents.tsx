"use client";

import { CreditCard, Download } from "lucide-react";

export function PaymentMethod() {
  return (
    <div className="bg-white border border-[#ece3d1] rounded-[18px] p-6 shadow-[0_1px_2px_rgba(60,48,28,0.04)]">
      <div className="font-mono-spline text-[10px] tracking-[0.14em] uppercase text-[#9b927f] mb-3">
        Payment Method
      </div>
      <div className="flex items-center justify-between p-4 bg-[#fdfcf8] border border-[#ece3d1] rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-7 bg-[#15463b] rounded text-white flex items-center justify-center font-bold text-[12px]">
            VISA
          </div>
          <div>
            <div className="text-[14px] font-bold text-[#23211b]">Visa ending in 4242</div>
            <div className="text-[12px] text-[#9b927f]">Expires 12/2028</div>
          </div>
        </div>
        <button
          onClick={() => alert("Payment method update opened")}
          className="ob text-[12.5px] font-semibold text-[#15463b] bg-white border border-[#d8cfbd] px-3.5 py-1.5 rounded-lg"
        >
          Update card
        </button>
      </div>
    </div>
  );
}

export function BillingHistory() {
  const invoices = [
    { date: "01 Jul 2026", amount: "£99.00", status: "Paid", invoiceNo: "INV-2026-07" },
    { date: "01 Jun 2026", amount: "£99.00", status: "Paid", invoiceNo: "INV-2026-06" },
    { date: "01 May 2026", amount: "£99.00", status: "Paid", invoiceNo: "INV-2026-05" },
  ];

  return (
    <div className="bg-white border border-[#ece3d1] rounded-[18px] p-6 shadow-[0_1px_2px_rgba(60,48,28,0.04)]">
      <div className="font-mono-spline text-[10px] tracking-[0.14em] uppercase text-[#9b927f] mb-4">
        Billing &amp; Invoice History
      </div>
      <div className="divide-y divide-[#efe7d6]">
        {invoices.map((inv) => (
          <div key={inv.invoiceNo} className="py-3 flex items-center justify-between">
            <div>
              <div className="text-[14px] font-bold text-[#23211b]">{inv.invoiceNo}</div>
              <div className="text-[12px] text-[#9b927f]">{inv.date}</div>
            </div>
            <div className="flex items-center gap-4">
              <span className="num text-[14px] font-bold text-[#15463b]">{inv.amount}</span>
              <span className="text-[11px] font-bold text-[#1e7d4f] bg-[#dcefe2] px-2 py-0.5 rounded">
                {inv.status}
              </span>
              <button
                onClick={() => alert(`Downloading invoice ${inv.invoiceNo}`)}
                className="p-1.5 text-[#8a8273] hover:text-[#15463b]"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
