"use client";

function Skel({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-[#e9e3d7] ${className}`} />;
}

function PanelSkeleton({ tone = "white" }: { tone?: "white" | "cream" | "green" | "pink" | "purple" }) {
  const bg =
    tone === "green" ? "bg-[#15463b]" :
    tone === "cream" ? "bg-[#faf3e2]" :
    tone === "pink" ? "bg-[#fdeef1]" :
    tone === "purple" ? "bg-[#efe9fb]" :
    "bg-white";
  const border =
    tone === "green" ? "border-[#15463b]" :
    tone === "cream" ? "border-[#efe3c8]" :
    tone === "pink" ? "border-[#f6d9e0]" :
    tone === "purple" ? "border-[#e2d8f5]" :
    "border-[#ece3d1]";
  const line = tone === "green" ? "bg-white/15" : "bg-[#e9e3d7]";

  return (
    <div className={`${bg} border ${border} rounded-[14px] p-5 md:p-[22px_24px]`}>
      <Skel className={`h-3 w-24 ${line}`} />
      <Skel className={`mt-3 h-6 w-40 ${line}`} />
      <div className="mt-5 space-y-3">
        <Skel className={`h-10 w-full ${line}`} />
        <Skel className={`h-10 w-[92%] ${line}`} />
        <Skel className={`h-10 w-[86%] ${line}`} />
      </div>
    </div>
  );
}

export default function OverviewSkeleton() {
  return (
    <div className="space-y-5 pb-10">
      <div className="grid grid-cols-1 lg:grid-cols-[248px_minmax(0,1fr)_400px] gap-[22px] items-stretch">
        <div className="bg-[#15463b] rounded-[16px] p-6 min-h-[260px]">
          <Skel className="h-3 w-28 bg-white/15" />
          <Skel className="mt-5 h-16 w-36 bg-white/15" />
          <Skel className="mt-7 h-12 w-full bg-white/15" />
        </div>
        <div className="flex flex-col justify-center min-h-[260px]">
          <Skel className="h-9 w-[70%]" />
          <Skel className="mt-4 h-4 w-[55%]" />
          <div className="mt-6 space-y-4">
            <Skel className="h-9 w-[72%]" />
            <Skel className="h-9 w-[68%]" />
            <Skel className="h-9 w-[60%]" />
          </div>
        </div>
        <PanelSkeleton />
      </div>

      <div className="bg-[#efe9fb] border border-[#e2d8f5] rounded-[18px] p-6 md:p-[30px_32px]">
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1">
            <Skel className="h-3 w-32 bg-[#ddd2f0]" />
            <Skel className="mt-3 h-8 w-[54%] bg-[#ddd2f0]" />
            <Skel className="mt-5 h-4 w-[62%] bg-[#ddd2f0]" />
          </div>
          <Skel className="hidden md:block h-20 w-56 bg-[#ddd2f0]" />
        </div>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5">
          {[0, 1, 2, 3].map((item) => (
            <PanelSkeleton key={item} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <PanelSkeleton tone="cream" />
        <PanelSkeleton />
        <PanelSkeleton tone="cream" />
      </div>

      <PanelSkeleton tone="green" />

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr_0.92fr] gap-4">
        <PanelSkeleton tone="pink" />
        <PanelSkeleton tone="cream" />
        <PanelSkeleton tone="purple" />
      </div>
    </div>
  );
}
