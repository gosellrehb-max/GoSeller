'use client';

import { useState, useEffect } from 'react';

export type TabType = 'about' | 'reviews';

interface Tab {
  id: TabType;
  label: string;
  content: React.ReactNode;
}

interface Props {
  tabs: Tab[];
  defaultTab?: TabType;
}

export function ProductTabs({ tabs, defaultTab = 'about' }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>(defaultTab);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as TabType;
      if (tabs.some(t => t.id === hash)) {
        setActiveTab(hash);
      }
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [tabs]);

  const activeTabContent = tabs.find((tab) => tab.id === activeTab)?.content;

  return (
    <div id="reviews-section" className="mt-12 border-t border-gray-200">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 gap-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            id={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              window.location.hash = tab.id;
            }}
            className={`px-4 py-3 text-sm font-medium transition-colors relative ${
              activeTab === tab.id
                ? 'text-gray-900 border-b-2 border-b-primary -mb-px'
                : 'text-gray-600 hover:text-gray-900 border-b-2 border-b-transparent'
            }`}
            aria-selected={activeTab === tab.id}
            role="tab"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="py-6" role="tabpanel">
        {activeTabContent}
      </div>
    </div>
  );
}
