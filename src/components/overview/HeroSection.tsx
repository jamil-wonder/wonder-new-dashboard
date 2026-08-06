"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { OverviewData } from "../../hooks/useOverviewData";

function ScoreRing({ score, delta }: { score: number; delta: number | null }) {
  const r = 33;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;

  return (
    <div className="relative w-[80px] h-[80px] shrink-0">
      <svg width="80" height="80" viewBox="0 0 80 80">
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

function TrendChart({ points }: { points: { score: number; timestamp: string; week_id?: string }[] }) {
  const latest = points.length > 0 ? points[points.length - 1].score : 0;
  const hasData = points.length >= 1;

  if (!hasData) {
    return (
      <div className="flex-1 flex items-center justify-center text-[12px] text-[#a8b8a0] text-center px-2">
        Run the Analyser to build your weekly trend history.
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
          fill={i === points.length - 1 ? "#1e7d4f" : "#fff"} stroke="#1e7d4f" strokeWidth="2" />
      ))}
    </svg>
  );
}

export default function HeroSection({ data }: { data: OverviewData }) {
  const { score, grade, visibilityText, previousScore, scanPoints, competitors, userRank, nearestAboveName, nearestAboveGap, modelMentions, totalQueries } = data;

  const delta = previousScore !== null ? score - previousScore : null;

  // Build dynamic card items from live data
  const changes: { icon: string; bg: string; color: string; title: string; sub: string }[] = [];

  const locText = data.location ? ` in ${data.location}` : "";

  // 1. Competitor / Rank Card
  if (competitors.length > 0) {
    const userComp = competitors.find(c => c.isUser);
    const userScore = userComp ? userComp.score : score;

    if (userRank > 1) {
      const aheadComp = competitors[userRank - 2]; // Competitor directly above (higher score)
      const gap = aheadComp ? aheadComp.score - userScore : null;
      changes.push({
        icon: "▼",
        bg: "#fbeee6",
        color: "#b1442a",
        title: aheadComp ? `Behind ${aheadComp.name}` : `Room to grow`,
        sub: `Ranked ${data.userRankOrdinal}${locText}${gap !== null && gap > 0 ? ` · ${gap} pts behind #${userRank - 1}` : ""}`,
      });
    } else {
      changes.push({
        icon: "▲",
        bg: "#e7f4ea",
        color: "#1e7d4f",
        title: "Market Leader",
        sub: `Ranked 1st${locText} · Top visibility score (${userScore}/100)`,
      });
    }
  } else {
    changes.push({
      icon: "▲",
      bg: "#e7f4ea",
      color: "#1e7d4f",
      title: "Market position",
      sub: `Run Analyser to compute rank${locText}`,
    });
  }

  // 2. AI Engine Mentions Card (Live from Queries)
  const totalMentionedQueries = totalQueries > 0
    ? modelMentions.reduce((max, m) => Math.max(max, m.mentioned), 0)
    : 0;

  const topModel = [...modelMentions].sort((a, b) => b.mentioned - a.mentioned)[0];

  if (totalQueries > 0) {
    changes.push({
      icon: "▲",
      bg: "#e7f4ea",
      color: "#1e7d4f",
      title: topModel && topModel.mentioned > 0 ? `${topModel.model} mention` : "AI Query mentions",
      sub: `Appearing in ${totalMentionedQueries} of ${totalQueries} audited search queries`,
    });
  } else {
    changes.push({
      icon: "▲",
      bg: "#e7f4ea",
      color: "#1e7d4f",
      title: "AI Search engine mentions",
      sub: `Run Query tab to audit mentions across ChatGPT, Claude, Perplexity & Gemini`,
    });
  }

  // 3. New Competitor or Trend / Insight Card
  const trailingComp = competitors.length > 1 ? competitors[competitors.length - 1] : null;
  if (trailingComp && !trailingComp.isUser && trailingComp.score <= score) {
    const leadGap = score - trailingComp.score;
    changes.push({
      icon: "▲",
      bg: "#e7f4ea",
      color: "#1e7d4f",
      title: `Ahead of ${trailingComp.name}`,
      sub: `${leadGap} pt${leadGap === 1 ? "" : "s"} ahead · ranked last of ${competitors.length}${locText}`,
    });
  } else {
    changes.push({
      icon: "▲",
      bg: "#e7f4ea",
      color: "#1e7d4f",
      title: "Visibility index",
      sub: score > 0 ? `Scored ${score}/100 across 6 audit categories` : `Run Analyser to compute category breakdown`,
    });
  }

  // Headline text
  let headline = score > 0 ? `You're ranked ${userRank === 1 ? "1st" : userRank === 2 ? "2nd" : `${userRank}th`}.` : "Run your first scan.";
  let subtext = nearestAboveName && nearestAboveGap !== null
    ? `You're just ${nearestAboveGap} points behind ${nearestAboveName}. A focused week could close the gap.`
    : score > 0
    ? `Your Wonderscore is ${score}/100 — ${visibilityText.toLowerCase()}.`
    : "Open the Analyser tab to crawl your site and get your score.";

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
              <span className="num font-spectral font-semibold text-[72px] leading-none text-white">
                {score > 0 ? score : "—"}
              </span>
              <span className="num font-spectral text-[17px] text-[#7fae97]">/100</span>
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
          </div>
        )}
      </motion.div>

    </div>
  );
}
