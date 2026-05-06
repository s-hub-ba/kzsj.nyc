"use client";

import { useState } from "react";
import Link from "next/link";

export type AdminTab = "overview" | "bookings" | "classes" | "payments" | "blog";

interface AdminNavProps {
  currentTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
}

export function AdminNav({ currentTab, onTabChange }: AdminNavProps) {
  const tabs: { id: AdminTab; label: string; icon: string }[] = [
    { id: "overview", label: "Pregled", icon: "📊" },
    { id: "bookings", label: "Prijave", icon: "📝" },
    { id: "classes", label: "Časovi", icon: "🎓" },
    { id: "payments", label: "Plaćanja", icon: "💳" },
    { id: "blog", label: "Blog", icon: "📰" },
  ];

  return (
    <nav className="border-b border-line bg-surface-2">
      <div className="flex max-w-6xl gap-2 overflow-x-auto px-4 md:px-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition ${
              currentTab === tab.id
                ? "border-accent text-accent"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
