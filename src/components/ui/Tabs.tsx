'use client';

import React, { useState } from 'react';

interface Tab {
  id: string;
  label: React.ReactNode;
  content: React.ReactNode;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTabId?: string;
  onChange?: (tabId: string) => void;
  className?: string;
  variant?: 'default' | 'pills' | 'underline';
}

export default function Tabs({
  tabs,
  defaultTabId,
  onChange,
  className = '',
  variant = 'default'
}: TabsProps) {
  const [activeTabId, setActiveTabId] = useState(defaultTabId || (tabs.length > 0 ? tabs[0].id : ''));
  
  const activeTab = tabs.find(tab => tab.id === activeTabId) || tabs[0];
  
  const handleTabClick = (tabId: string) => {
    setActiveTabId(tabId);
    if (onChange) {
      onChange(tabId);
    }
  };
  
  const getTabStyles = (isActive: boolean, variant: string) => {
    switch (variant) {
      case 'pills':
        return isActive
          ? 'bg-blue-600 text-white rounded-full'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full';
      case 'underline':
        return isActive
          ? 'border-b-2 border-blue-600 text-blue-600'
          : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent';
      default:
        return isActive
          ? 'border-b-2 border-blue-600 text-blue-600'
          : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent';
    }
  };
  
  return (
    <div className={className}>
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-4" aria-label="Tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`px-3 py-2 font-medium text-sm ${getTabStyles(activeTabId === tab.id, variant)} flex items-center transition-colors duration-200 focus:outline-none`}
              aria-current={activeTabId === tab.id ? 'page' : undefined}
            >
              {tab.icon && <span className="mr-2">{tab.icon}</span>}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="py-4">
        {activeTab.content}
      </div>
    </div>
  );
}