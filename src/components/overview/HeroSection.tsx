"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { OverviewData } from "../../hooks/useOverviewData";

function ScoreRing({ score, delta }: { score: number; delta: number | null }) {
  const r = 33;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;

  return (
    <div className="relative w-[56px] h-[56px] sm:w-[80px] sm:h-[80px] shrink-0">
      <svg width="80" height="80" viewBox="0 0 80 80" className="w-full h-full">
        <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="8" />
        {score > 0 && (
          <circle
            cx="40" cy="40" r={r} fill="none" stroke="#a8d860" strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${fill} ${circ}`}
            transform="rotate(-90 40 40)"
          />
        )}
      </svg>
      {score > 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          {delta === null || delta === 0 ? (
            <Minus className="w-6 h-6 text-[#a8d860]" />
          ) : delta > 0 ? (
            <TrendingUp className="w-6 h-6 text-[#a8d860]" />
          ) : (
            <TrendingDown className="w-6 h-6 text-[#e08a6f]" />
          )}
        </div>
      )}
    </div>
  );
}

function ChangeRow({ icon, bg, color, title, sub }: { icon: string; bg: string; color: string; title: string; sub: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center shrink-0 font-bold text-[14px]"
        style={{ background: bg, color }}>
        {icon}
      </div>
      <div>
        <div className="text-[14px] font-bold text-[#23211b]">{title}</div>
        <div className="text-[12.5px] text-[#8a8273]">{sub}</div>
      </div>
    </div>
  );
}

// Points can come from a real ISO timestamp (both manual scans and the
// Sunday scheduler write one when the score is saved) or, on the rare
// fallback path, a bare week_id like "2026-W32" with no real timestamp —
// this must never render as "Invalid Date" for that case.
function formatPointTimestamp(ts: string, weekId?: string): string {
  if (ts) {
    const d = new Date(ts);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    }
  }
  return weekId ? `Week ${weekId}` : "Unknown date";
}

function shortAxisDate(ts: string, weekId?: string): string {
  if (ts) {
    const d = new Date(ts);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    }
  }
  return weekId ? weekId.replace(/^\d{4}-/, "") : "";
}

function TrendDot(props: any) {
  const { cx, cy, index, payload } = props;
  const isLatest = index === payload.__lastIndex;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={isLatest ? 5.5 : 3.5}
      fill={isLatest ? "#1e7d4f" : "#fff"}
      stroke="#1e7d4f"
      strokeWidth={2}
    />
  );
}

// Plot-area geometry — kept as named constants because they're used TWICE:
// once as the actual margin/width values handed to recharts below, and
// again to position the custom hover-tracking div so it lines up exactly
// with where recharts draws the plot, without needing to measure the DOM.
const PLOT_LEFT = 26; // matches YAxis width
const PLOT_RIGHT = 24; // matches AreaChart margin.right
const PLOT_TOP = 8; // matches AreaChart margin.top
const PLOT_BOTTOM = 30; // space recharts reserves for the XAxis line + date labels

// recharts v3's own Tooltip/hover wiring does not fire on this chart (verified:
// the correct element — recharts-surface — sits under the cursor, so nothing
// is blocking it; recharts' internal mouse-tracking simply isn't triggering).
// Rather than keep fighting that, hover is handled directly here with plain
// onMouseMove math over the same plot rectangle recharts renders into (see
// PLOT_* constants above) — recharts still draws the line/axes/grid, this
// only replaces the broken interactive layer.
function TrendChart({ points }: { points: { score: number; timestamp: string; week_id?: string }[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (points.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-[12px] text-[#a8b8a0] text-center px-2">
        Run the Analyzer to build your scan history trend.
      </div>
    );
  }

  const n = points.length;
  const lastIndex = n - 1;
  const chartData = points.map((p, i) => ({
    score: p.score,
    date: shortAxisDate(p.timestamp, p.week_id),
    fullDate: formatPointTimestamp(p.timestamp, p.week_id),
    __lastIndex: lastIndex,
    __i: i,
  }));

  const scores = points.map(p => p.score);
  const minS = Math.max(0, Math.floor((Math.min(...scores) - 5) / 5) * 5);
  const maxS = Math.min(100, Math.ceil((Math.max(...scores) + 5) / 5) * 5);
  // recharts' own auto-generated ticks land on whatever the domain divides
  // into (e.g. 57/64/71) — explicit, round-5 ticks read far more cleanly.
  const midS = Math.round((minS + maxS) / 2 / 5) * 5;
  const yTicks = midS > minS && midS < maxS ? [minS, midS, maxS] : [minS, maxS];
  const range = maxS - minS || 1;

  const toXPct = (i: number) => (n <= 1 ? 50 : (i / (n - 1)) * 100);
  const toYPct = (score: number) => 100 - ((score - minS) / range) * 100;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width <= 0) return;
    const relX = (e.clientX - rect.left) / rect.width;
    const idx = Math.round(relX * (n - 1));
    setHoverIndex(Math.max(0, Math.min(n - 1, idx)));
  };

  const hovered = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div className="relative w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: PLOT_TOP, right: PLOT_RIGHT, bottom: 0, left: 0 }} accessibilityLayer={false}>
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1e7d4f" stopOpacity={0.22} />
              <stop offset="100%" stopColor="#1e7d4f" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid horizontal vertical={false} stroke="#e5ddd0" strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            // Force every date to show only while they still comfortably fit
            // — this chart sits in a ~400px column, so the threshold is
            // lower than it would be for a full-width chart. Past that,
            // fall back to recharts' own overlap-safe thinning instead of
            // jamming every label in illegibly.
            interval={points.length <= 6 ? 0 : "preserveStartEnd"}
            axisLine={{ stroke: "#e5ddd0" }}
            tickLine={false}
            tick={{ fontSize: 11, fontWeight: 600, fill: "#8a8273" }}
            dy={8}
          />
          <YAxis
            domain={[minS, maxS]}
            ticks={yTicks}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#b3a98f" }}
            width={PLOT_LEFT}
            tickMargin={2}
            allowDecimals={false}
          />
          <Area
            type="monotone"
            dataKey="score"
            stroke="#1e7d4f"
            strokeWidth={2.5}
            fill="url(#trendFill)"
            dot={<TrendDot />}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Custom hover layer — spans exactly the plot rectangle recharts
          draws into (see PLOT_* constants), independent of recharts'
          own broken interaction wiring. */}
      <div
        className="absolute cursor-crosshair"
        style={{ left: PLOT_LEFT, right: PLOT_RIGHT, top: PLOT_TOP, bottom: PLOT_BOTTOM }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIndex(null)}
      >
        {hovered && (
          <>
            {/* Vertical guide line at the hovered point */}
            <div
              className="absolute top-0 bottom-0 w-px bg-[#d9cbaf]"
              style={{ left: `${toXPct(hoverIndex!)}%`, borderLeft: "1px dashed #d9cbaf" }}
            />
            {/* Highlighted dot at the hovered point */}
            <div
              className="absolute w-3 h-3 rounded-full bg-[#1e7d4f] border-2 border-white shadow-sm -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{ left: `${toXPct(hoverIndex!)}%`, top: `${toYPct(hovered.score)}%` }}
            />
            {/* Tooltip */}
            <div
              className="absolute -translate-x-1/2 pointer-events-none bg-[#15463b] text-white rounded-lg shadow-lg px-3 py-2 leading-tight whitespace-nowrap z-10"
              style={{
                left: `${toXPct(hoverIndex!)}%`,
                top: `${toYPct(hovered.score)}%`,
                marginTop: "-46px",
              }}
            >
              <div className="num font-spectral font-bold text-[17px]">{hovered.score}</div>
              <div className="text-[10.5px] text-[#a8c4ae] mt-0.5">{formatPointTimestamp(hovered.timestamp, hovered.week_id)}</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Softer, less saturated than a typical alert palette on purpose — these
// sit next to each other constantly on the page users see most, so they
// need to read clearly as "good" vs "needs attention" without shouting.
const GOOD = { bg: "#eaf6f0", color: "#2f8a5b" };
const BAD = { bg: "#fdefec", color: "#c06749" };
const PENDING = { bg: "#f5f0e6", color: "#9b8f74" };

type ChangeCandidate = {
  sentiment: "good" | "bad";
  metric: "rank" | "mentions" | "audit";
  priority: number; // higher = more important signal, wins the limited slots first
  icon: string;
  title: string;
  sub: string;
};

type ChangeItem = { icon: string; bg: string; color: string; title: string; sub: string; metric: "rank" | "mentions" | "audit" };

export default function HeroSection({ data }: { data: OverviewData }) {
  const { score, grade, visibilityText, previousScore, scanPoints, competitors, userRank, nearestAboveName, nearestAboveGap, modelMentions, totalQueries, auditAreas } = data;

  const delta = previousScore !== null ? score - previousScore : null;
  const locText = data.location ? ` in ${data.location}` : "";

  // Every metric that has real data contributes one candidate insight,
  // tagged honestly as good or bad based on where it actually stands — never
  // forced. Rank is the headline signal (highest priority); AI mentions and
  // audit areas each contribute both their weakest and strongest read where
  // data exists, so there's always a genuine "needs work" and a genuine
  // "doing well" candidate to draw from once real data exists.
  const candidates: ChangeCandidate[] = [];

  if (competitors.length > 0) {
    const userComp = competitors.find(c => c.isUser);
    const userScore = userComp ? userComp.score : score;
    if (userRank > 1) {
      const aheadComp = competitors[userRank - 2]; // Competitor directly above (higher score)
      const gap = aheadComp ? aheadComp.score - userScore : null;
      candidates.push({
        sentiment: "bad", metric: "rank", priority: 3, icon: "▼",
        title: aheadComp ? `Behind ${aheadComp.name}` : "Room to grow",
        sub: `Ranked ${data.userRankOrdinal}${locText}${gap !== null && gap > 0 ? ` · ${gap} pts behind #${userRank - 1}` : ""}`,
      });
    } else {
      candidates.push({
        sentiment: "good", metric: "rank", priority: 3, icon: "▲",
        title: "Market Leader",
        sub: `Ranked 1st${locText} · Top visibility score (${userScore}/100)`,
      });
    }
  }

  if (totalQueries > 0 && modelMentions.length > 0) {
    const sortedModels = [...modelMentions].sort((a, b) => a.mentioned - b.mentioned);
    const weakestModel = sortedModels[0];
    const strongestModel = sortedModels[sortedModels.length - 1];
    if (weakestModel) {
      candidates.push({
        sentiment: "bad", metric: "mentions", priority: 2, icon: "▼",
        title: `${weakestModel.model} mentions you least`,
        sub: `Appearing in only ${weakestModel.mentioned} of ${totalQueries} audited queries`,
      });
    }
    if (strongestModel) {
      candidates.push({
        sentiment: "good", metric: "mentions", priority: 2, icon: "▲",
        title: `${strongestModel.model} mention strength`,
        sub: `Appearing in ${strongestModel.mentioned} of ${totalQueries} audited queries`,
      });
    }
  }

  if (auditAreas.length > 0) {
    const sortedAreas = [...auditAreas].sort((a, b) => a.score - b.score);
    const weakestArea = sortedAreas[0];
    const strongestArea = sortedAreas[sortedAreas.length - 1];
    candidates.push({
      sentiment: "bad", metric: "audit", priority: 1, icon: "▼",
      title: `Improve: ${weakestArea.label}`,
      sub: `Scored ${weakestArea.score}/100 — lowest of 6 audit areas`,
    });
    candidates.push({
      sentiment: "good", metric: "audit", priority: 1, icon: "▲",
      title: `Strong: ${strongestArea.label}`,
      sub: `Scored ${strongestArea.score}/100`,
    });
  }

  const badPicks = candidates.filter(c => c.sentiment === "bad").sort((a, b) => b.priority - a.priority).slice(0, 2);
  const goodPicks = candidates.filter(c => c.sentiment === "good").sort((a, b) => b.priority - a.priority).slice(0, 1);

  let changes: ChangeItem[] = [
    ...badPicks.map(c => ({ ...c, ...BAD })),
    ...goodPicks.map(c => ({ ...c, ...GOOD })),
  ];

  // Fill any remaining slots with an honest "nothing run yet" card for
  // whichever metric genuinely has no data — never a fabricated red or
  // green to force the count, only ever for a metric not already shown.
  const usedMetrics = new Set(changes.map(c => c.metric));
  const pending: ChangeItem[] = [];
  if (competitors.length === 0 && !usedMetrics.has("rank")) {
    pending.push({ ...PENDING, metric: "rank", icon: "○", title: "Market position", sub: `Run Query to compute rank${locText}` });
  }
  if (totalQueries === 0 && !usedMetrics.has("mentions")) {
    pending.push({ ...PENDING, metric: "mentions", icon: "○", title: "AI Search engine mentions", sub: "Run Query tab to audit mentions across ChatGPT, Claude, Perplexity & Gemini" });
  }
  if (auditAreas.length === 0 && !usedMetrics.has("audit")) {
    pending.push({ ...PENDING, metric: "audit", icon: "○", title: "Visibility index", sub: "Run Analyzer to compute category breakdown" });
  }
  changes = [...changes, ...pending].slice(0, 3);

  // Stable display order — rank, then mentions, then audit — so a card's
  // position always maps to the same kind of insight; only its color and
  // content change with the real data.
  const metricOrder: Record<ChangeItem["metric"], number> = { rank: 0, mentions: 1, audit: 2 };
  changes.sort((a, b) => metricOrder[a.metric] - metricOrder[b.metric]);

  // Low-signal state: a real scan ran (score > 0) but almost nothing came
  // back from it — every audit area scored under 15/100, which in practice
  // means the crawler was blocked, hit a JS-heavy site with no readable
  // markup, or the page was otherwise unreadable, not that the business is
  // genuinely doing badly everywhere at once (a real crawl normally shows
  // more variance across the six areas than this). Distinct from "first
  // visit" (no scan at all) and from a real good/tough week (which needs
  // actual signal to judge against).
  const isLowSignal = score > 0 && auditAreas.length > 0 && auditAreas.every((a) => a.score < 15);

  // Headline text
  const headline = isLowSignal
    ? "We couldn't read everything on your site."
    : score > 0
    ? `You're ranked ${userRank === 1 ? "1st" : userRank === 2 ? "2nd" : `${userRank}th`}.`
    : "Run your first scan.";
  const subtext = isLowSignal
    ? "Our crawler could only pull a thin signal from your site — this score may not reflect your real visibility yet. Try re-running the scan, or check that your site isn't blocking crawlers."
    : nearestAboveName && nearestAboveGap !== null
    ? `You're just ${nearestAboveGap} points behind ${nearestAboveName}. A focused week could close the gap.`
    : score > 0
    ? `Your Wonderscore is ${score}/100 — ${visibilityText.toLowerCase()}.`
    : "Open the Analyzer tab to crawl your site and get your score.";

  const ringFill = score;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[248px_minmax(0,1fr)_400px] gap-[22px] items-stretch">

      {/* ── Score Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#15463b] rounded-[16px] p-[24px_24px_22px] text-[#eaf3ee] flex flex-col justify-between"
      >
        <div>
          <div className="font-mono-spline text-[10px] tracking-[0.16em] uppercase text-[#86b89f]">
            Your Wonder Score
          </div>

          <div className="flex items-center justify-between gap-2 mt-3.5">
            <div className="flex items-baseline gap-0.5">
              <span className="num font-spectral font-semibold text-[48px] sm:text-[72px] leading-none text-white">
                {score > 0 ? score : "—"}
              </span>
              <span className="num font-spectral text-[13px] sm:text-[17px] text-[#7fae97]">/100</span>
            </div>
            <ScoreRing score={ringFill} delta={delta} />
          </div>

          {delta !== null && (
            <div className="mt-2">
              <span className="num inline-flex items-center gap-1 text-[12px] font-bold text-[#3a2e08] bg-[#f0d878] px-3 py-1 rounded-full">
                {delta > 0 ? "▲" : delta < 0 ? "▼" : "→"} {Math.abs(delta)} points vs last scan
              </span>
            </div>
          )}
          {score === 0 && (
            <div className="mt-2">
              <span className="inline-flex items-center gap-1 text-[12px] font-medium text-[#a8c4ae] bg-white/10 px-3 py-1 rounded-full">
                No scan yet
              </span>
            </div>
          )}
        </div>

        <div className="border-t border-white/15 pt-3.5 mt-4">
          <div className="font-mono-spline text-[10px] tracking-[0.14em] uppercase text-[#86b89f]">
            {score > 0 ? `Grade ${grade}` : "Grade —"}
          </div>
          <div className="font-spectral text-[22px] font-medium text-white mt-1">
            {score > 0 ? visibilityText : "Not yet scanned"}
          </div>
        </div>
      </motion.div>

      {/* ── Changes Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex flex-col justify-center px-1 py-1"
      >
        <h1 className="font-spectral text-[32px] font-medium tracking-tight leading-tight text-[#23211b]">
          {headline}
        </h1>
        <p className="text-[14.5px] text-[#6f6757] mt-2.5 leading-relaxed max-w-[380px]">
          {subtext}
        </p>

        <div className="flex flex-col gap-3.5 mt-5">
          {changes.slice(0, 3).map((c, i) => (
            <ChangeRow key={i} {...c} />
          ))}
        </div>
      </motion.div>

      {/* ── Scan History Trend Chart — back beside the Score/Changes
          cards. Fixed pixel height (not flex-1/min-height): this card
          sits in a CSS Grid with items-stretch, which gives it a
          definite stretched height, but recharts' ResponsiveContainer
          needs an unambiguous measured height to render at all — an
          explicit height guarantees that regardless of how the grid
          resolves everything else. */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white border border-[#ece3d1] rounded-[14px] p-[20px_22px_16px] flex flex-col"
      >
        <div className="flex items-start justify-between mb-1">
          <div className="font-mono-spline text-[10px] tracking-[0.14em] uppercase text-[#9b927f]">
            Scan history trend
          </div>
          {score > 0 && (
            <div className="num font-spectral text-[30px] font-semibold text-[#1e7d4f] leading-none">{score}</div>
          )}
        </div>
        <div style={{ height: 180 }}>
          <TrendChart points={scanPoints} />
        </div>
        {scanPoints.length > 0 && (
          <div className="text-[11px] text-[#b3a98f] mt-4">
            {scanPoints.length} scan{scanPoints.length !== 1 ? "s" : ""} recorded
            {" · "}Last analysed {formatPointTimestamp(scanPoints[scanPoints.length - 1].timestamp, scanPoints[scanPoints.length - 1].week_id)}
          </div>
        )}
      </motion.div>

    </div>
  );
}
