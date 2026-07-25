"use client";

export default function AnalyserHeader() {
  return (
    <div className="bg-white border border-[#ece3d1] rounded-[18px] p-6 md:p-[30px_32px] shadow-[0_1px_2px_rgba(60,48,28,0.04)] mb-6">
      <div className="flex justify-between items-start flex-wrap gap-5 border-b border-[#ece3d1] pb-5 mb-6">
        <div>
          <h1 className="font-spectral text-[28px] font-semibold text-[#15463b]">
            AI Visibility Analyser
          </h1>
          <p className="text-[14px] text-[#6f6757] mt-1">
            Scrape sitemaps, verify metadata, schemas, entity consistency, and crawl permission rules.
          </p>
        </div>
        <button className="pb bg-[#15463b] text-white text-[13.5px] font-semibold px-5 py-2.5 rounded-lg border-none">
          Re-run sitemap crawl
        </button>
      </div>

      {/* Config Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-[#fdfcf8] border border-[#ece3d1] p-4 rounded-xl">
          <div className="font-mono-spline text-[9.5px] tracking-wider uppercase text-[#8a8273]">
            Domain name
          </div>
          <div className="text-[15px] font-bold text-[#23211b] mt-1.5">
            meridian.co
          </div>
        </div>
        <div className="bg-[#fdfcf8] border border-[#ece3d1] p-4 rounded-xl">
          <div className="font-mono-spline text-[9.5px] tracking-wider uppercase text-[#8a8273]">
            Business category
          </div>
          <div className="text-[15px] font-bold text-[#23211b] mt-1.5">
            Professional Services
          </div>
        </div>
        <div className="bg-[#fdfcf8] border border-[#ece3d1] p-4 rounded-xl">
          <div className="font-mono-spline text-[9.5px] tracking-wider uppercase text-[#8a8273]">
            Primary location
          </div>
          <div className="text-[15px] font-bold text-[#23211b] mt-1.5">
            Bristol, UK
          </div>
        </div>
      </div>
    </div>
  );
}
