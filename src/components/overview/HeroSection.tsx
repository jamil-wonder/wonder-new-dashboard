"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
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

function TrendChart({ points }: { points: { score: number; timestamp: string; week_id?: string }[] }) {
  const latest = points.length > 0 ? points[points.length - 1].score : 0;
  const hasData = points.length >= 1;

  if (!hasData) {
    return (
      <div className="flex-1 flex items-center justify-center text-[12px] text-[#a8b8a0] text-center px-2">
        Run the Analyzer to build your weekly trend history.
      </div>
    );
  }

  const w = 400, h = 200, padL = 38, padR = 6, padT = 20, padB = 20;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;
  const scores = points.map(p => p.score);
  const minS = Math.max(0, Math.min(...scores) - 5);
  const maxS = Math.min(100, Math.max(...scores) + 5);
  const range = maxS - minS || 1;

  const toX = (i: number) => padL + (i / (points.length - 1)) * plotW;
  const toY = (s: number) => padT + plotH - ((s - minS) / range) * plotH;

  const pts = points.map((p, i) => `${toX(i)},${toY(p.score)}`).join(" ");
  const polyPts = pts + ` ${toX(points.length - 1)},${padT + plotH} ${padL},${padT + plotH}`;

  const ticks = [minS, Math.round((minS + maxS) / 2), maxS];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="none">
      {ticks.map(t => (
        <g key={t}>
          <line x1={padL} y1={toY(t)} x2={w - padR} y2={toY(t)} stroke="#efe7d6" strokeWidth="1" />
          <text x={padL - 4} y={toY(t) + 4} textAnchor="end" fontSize="9" fill="#b3a98f">{t}</text>
        </g>
      ))}
      <polygon points={polyPts} fill="rgba(30,125,79,0.08)" />
      <polyline points={pts} fill="none" stroke="#1e7d4f" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={toX(i)} cy={toY(p.score)} r={i === points.length - 1 ? 5 : 3.2}
          fill={i === points.length - 1 ? "#1e7d4f" : "#fff"} stroke="#1e7d4f" strokeWidth="2">
          <title>{`${formatPointTimestamp(p.timestamp, p.week_id)} — score ${p.score}`}</title>
        </circle>
      ))}
    </svg>
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

  // Headline text
  const headline = score > 0 ? `You're ranked ${userRank === 1 ? "1st" : userRank === 2 ? "2nd" : `${userRank}th`}.` : "Run your first scan.";
  const subtext = nearestAboveName && nearestAboveGap !== null
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

      {/* ── Scan History Trend Chart ── */}
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
        <div className="flex-1 min-h-[140px]">
          <TrendChart points={scanPoints} />
        </div>
        {scanPoints.length > 0 && (
          <div className="text-[10px] text-[#b3a98f] mt-1">
            {scanPoints.length} scan{scanPoints.length !== 1 ? "s" : ""} recorded
            {" · "}Last analysed {formatPointTimestamp(scanPoints[scanPoints.length - 1].timestamp, scanPoints[scanPoints.length - 1].week_id)}
          </div>
        )}
      </motion.div>

    </div>
  );
}
