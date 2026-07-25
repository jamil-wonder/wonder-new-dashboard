"use client";

import Image from "next/image";

export default function IntegrationsPanel() {
  const list = [
    {
      title: "Google Search Console",
      type: "Analytics",
      iconPath: "/icons/sidebar/analytics.svg",
      connected: true,
      desc: "Track search console clicks, impressions, and ranking slots directly.",
      action: "Connected",
      brandColor: "#4285f4",
      bgColor: "#eef4fe",
    },
    {
      title: "Google Analytics 4",
      type: "Analytics",
      iconPath: "/icons/sidebar/analyse.svg",
      connected: true,
      desc: "Measure traffic sources, customer engagement, and onsite visibility.",
      action: "Connected",
      brandColor: "#f25c05",
      bgColor: "#fef1eb",
    },
    {
      title: "WordPress",
      type: "CMS",
      iconPath: "/icons/sidebar/blogs.svg",
      connected: false,
      desc: "Automatically push generated Sunday blog drafts directly to your blog.",
      action: "Coming soon",
      brandColor: "#21759b",
      bgColor: "#ebf4f8",
    },
    {
      title: "Webflow",
      type: "CMS",
      iconPath: "/icons/sidebar/browser.svg",
      connected: false,
      desc: "Sync humanized blog articles to Webflow CMS collections in 1-click.",
      action: "Coming soon",
      brandColor: "#4353ff",
      bgColor: "#ebeeef",
    },
    {
      title: "Shopify",
      type: "CMS",
      iconPath: "/icons/sidebar/business.svg",
      connected: false,
      desc: "Publish optimized weekly suggestions directly to your Shopify store.",
      action: "Coming soon",
      brandColor: "#96bf48",
      bgColor: "#f4f8eb",
    },
    {
      title: "Developer API",
      type: "Developer",
      iconPath: "/icons/sidebar/integrate.svg",
      connected: false,
      desc: "Connect custom scripts, widgets, and CRM platforms via raw API tokens.",
      action: "Coming soon",
      brandColor: "#5c6f84",
      bgColor: "#f0f2f5",
    },
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {list.map((item) => (
          <div key={item.title} className="bg-white border border-[#ece3d1] rounded-[18px] p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border border-[#efe7d6] p-1.5"
                  style={{ backgroundColor: item.bgColor }}
                >
                  <Image
                    src={item.iconPath}
                    width={18}
                    height={18}
                    alt={item.title}
                    style={{
                      filter: `brightness(0) saturate(100%) invert(35%) sepia(90%) saturate(300%)`,
                    }}
                    className="w-[18px] h-[18px]"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-[14px] text-[#23211b] truncate">{item.title}</h4>
                  <p className="font-mono-spline text-[9px] uppercase tracking-wider text-[#9b927f] mt-0.5">{item.type}</p>
                </div>
                {item.connected && (
                  <span className="text-[10px] font-bold text-[#1e7d4f] bg-[#dcefe2] px-2.5 py-0.5 rounded-full uppercase whitespace-nowrap">
                    Active
                  </span>
                )}
              </div>
              <p className="text-[12.5px] leading-relaxed text-[#6f6757] mt-3.5 min-h-[40px]">
                {item.desc}
              </p>
            </div>

            <div className="mt-4 pt-3.5 border-t border-[#efe7d6]">
              {item.connected ? (
                <span className="text-[12.5px] font-semibold text-[#1e7d4f]">Connected</span>
              ) : (
                <button
                  disabled
                  className="w-full text-center text-[12px] font-semibold text-[#8a8273] bg-[#fdfcf8] border border-[#ece3d1] py-2 rounded-lg cursor-not-allowed"
                >
                  Coming soon
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
