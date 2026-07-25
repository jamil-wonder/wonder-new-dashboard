"use client";

import React, { useState, useCallback } from "react";
import ModelSwitcher from "../../components/query/ModelSwitcher";
import QueryFilterBar from "../../components/query/QueryFilterBar";
import QueryTable from "../../components/query/QueryTable";
import QueryChatModal from "../../components/query/QueryChatModal";
import AddPromptModal from "../../components/query/AddPromptModal";
import ScanProgressModal from "../../components/analyser/ScanProgressModal";
import { MOCK_QUERIES } from "../../constants/mockData";
import { SearchQueryItem } from "../../types/dashboard";
import { useToast } from "../../context/ToastContext";

export default function QueryPage() {
  const { showToast } = useToast();
  const [selectedModel, setSelectedModel] = useState("ChatGPT");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeStatus, setActiveStatus] = useState("all");
  const [queriesList, setQueriesList] = useState<SearchQueryItem[]>(MOCK_QUERIES);
  
  const [selectedQuery, setSelectedQuery] = useState<SearchQueryItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // Multi-dimensional filtering logic: Category AND Status
  const filteredQueries = queriesList.filter((q) => {
    // 1. Category Filter
    const matchesCategory = activeCategory === "all" || q.type === activeCategory;

    // 2. Status Filter
    const isMentioned = q.status === "Mentioned";
    let matchesStatus = true;
    if (activeStatus === "mentioned") {
      matchesStatus = isMentioned;
    } else if (activeStatus === "not-mentioned") {
      matchesStatus = !isMentioned;
    }

    return matchesCategory && matchesStatus;
  });

  const handleCopyAll = () => {
    const textList = queriesList
      .map((q, idx) => `${idx + 1}. [${q.label}] "${q.query}" - ${q.status}`)
      .join("\n");
    navigator.clipboard.writeText(textList).then(() => {
      showToast("All AI search prompts copied to clipboard!", "success");
    });
  };

  const handleAddPrompt = (
    queryText: string,
    category: "branded" | "non-branded" | "local-seo" | "broad-seo"
  ) => {
    let label = "Non-Branded";
    if (category === "branded") label = "Branded";
    else if (category === "local-seo") label = "Local SEO";
    else if (category === "broad-seo") label = "Broad SEO";

    const newQuery: SearchQueryItem = {
      id: queriesList.length + 1,
      type: category,
      label,
      query: queryText,
      status: "Mentioned",
      rank: 1,
      sources: ["meridian.co", "google.com"],
      score: "3/4",
    };

    setQueriesList([...queriesList, newQuery]);
    showToast("Search prompt added successfully!");
  };

  const handleStartScan = useCallback(() => {
    setIsScanning(true);
    showToast(`Starting prompts check for ${selectedModel}...`, "info");
  }, [showToast, selectedModel]);

  const handleScanComplete = useCallback(() => {
    setIsScanning(false);
    showToast(`AI prompts visibility check for ${selectedModel} complete!`, "success");
  }, [showToast, selectedModel]);

  return (
    <div className="space-y-5 relative">
      {/* Scan Progress Modal */}
      <ScanProgressModal
        isOpen={isScanning}
        onClose={() => setIsScanning(false)}
        onComplete={handleScanComplete}
      />

      <ModelSwitcher
        selectedModel={selectedModel}
        onSelectModel={setSelectedModel}
      />

      <div className={`bg-white border border-[#ece3d1] rounded-[18px] p-6 md:p-[28px_30px] shadow-[0_1px_2px_rgba(60,48,28,0.04)] transition-all duration-300 ${isScanning ? "opacity-75 blur-[1px]" : ""}`}>
        <QueryFilterBar
          selectedModel={selectedModel}
          activeCategory={activeCategory}
          activeStatus={activeStatus}
          onCategoryChange={setActiveCategory}
          onStatusChange={setActiveStatus}
          onCopyAll={handleCopyAll}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onRunAudit={handleStartScan}
        />

        {/* Table Header */}
        <div className="flex items-center px-3.5 pb-2.5 font-mono-spline text-[10px] font-semibold uppercase text-[#9b927f] border-b border-[#efe7d6]">
          <div className="w-[5%]">No.</div>
          <div className="flex-1 pl-2.5">Generated Search Query</div>
          <div className="w-[14%] text-center">Status</div>
          <div className="w-[10%] text-center">Rank</div>
          <div className="w-[22%] text-right">Cited Sources</div>
        </div>

        <QueryTable
          queries={filteredQueries}
          onSelectQuery={setSelectedQuery}
        />
      </div>

      <QueryChatModal
        query={selectedQuery}
        selectedModel={selectedModel}
        onClose={() => setSelectedQuery(null)}
      />

      <AddPromptModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddPrompt={handleAddPrompt}
      />
    </div>
  );
}
