'use client';

import React, { useState } from 'react';

interface Tab {
  id: string;
  label: React.ReactNode;
  content: React.ReactNode;
  icon?: React.ReactNode;
  badge?: string | number;
}

interface TabsProps {
  tabs: Tab[];
  defaultTabId?: string;
  onChange?: (tabId: string) => void;
  className?: string;
  variant?: 'modern' | 'pills' | 'underline' | 'floating';
}

export default function Tabs({
  tabs,
  defaultTabId,
  onChange,
  className = '',
  variant = 'modern'
}: TabsProps) {
  const [activeTabId, setActiveTabId] = useState(defaultTabId || (tabs.length > 0 ? tabs[0].id : ''));
  
  const activeTab = tabs.find(tab => tab.id === activeTabId) || tabs[0];
  const activeIndex = tabs.findIndex(tab => tab.id === activeTabId);
  
  const handleTabClick = (tabId: string) => {
    setActiveTabId(tabId);
    if (onChange) {
      onChange(tabId);
    }
  };
  
  const getTabStyles = (isActive: boolean, variant: string) => {
    const baseStyles = "relative transition-all duration-300 font-medium focus:outline-none group";
    
    switch (variant) {
      case 'modern':
        return `${baseStyles} ${
          isActive
            ? 'text-[#6d38e0] bg-[#6d38e0]/10 backdrop-blur-sm'
            : 'text-[#040642]/70 hover:text-[#6d38e0] hover:bg-[#6d38e0]/5'
        } px-6 py-3 rounded-xl border border-transparent ${
          isActive ? 'border-[#6d38e0]/20 shadow-lg shadow-[#6d38e0]/10' : 'hover:border-[#6d38e0]/10'
        }`;
      case 'pills':
        return `${baseStyles} ${
          isActive
            ? 'bg-gradient-to-r from-[#6d38e0] to-[#198eb4] text-white shadow-lg'
            : 'text-[#040642]/70 hover:text-[#040642] hover:bg-[#040642]/5'
        } px-6 py-3 rounded-full`;
      case 'floating':
        return `${baseStyles} ${
          isActive
            ? 'text-[#6d38e0] bg-white shadow-xl border border-[#6d38e0]/20'
            : 'text-[#040642]/70 hover:text-[#040642] hover:bg-white/50 hover:shadow-md'
        } px-6 py-3 rounded-2xl backdrop-blur-xl`;
      default:
        return `${baseStyles} ${
          isActive
            ? 'text-[#6d38e0] border-b-2 border-[#6d38e0]'
            : 'text-[#040642]/70 hover:text-[#6d38e0] border-b-2 border-transparent hover:border-[#6d38e0]/30'
        } px-4 py-3`;
    }
  };
  
  return (
    <div className={`relative ${className}`}>
      {/* Navigation des onglets */}
      <div className={`relative ${
        variant === 'floating' 
          ? 'bg-[#6d38e0]/5 p-2 rounded-3xl backdrop-blur-xl border border-white/20' 
          : variant === 'modern'
          ? 'bg-white/50 p-1 rounded-2xl backdrop-blur-sm border border-white/20'
          : ''
      }`}>
        <nav className={`flex ${variant === 'underline' ? 'border-b border-[#040642]/10' : 'gap-2'}`}>
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`${getTabStyles(activeTabId === tab.id, variant)} flex items-center justify-center text-sm transform hover:scale-[1.02] active:scale-[0.98]`}
              aria-current={activeTabId === tab.id ? 'page' : undefined}
            >
              {/* Effet de brillance */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden rounded-xl">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000" />
              </div>
              
              <div className="relative flex items-center">
                {tab.icon && (
                  <span className="mr-2 transition-transform group-hover:scale-110">
                    {tab.icon}
                  </span>
                )}
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-[#198eb4] text-white rounded-full min-w-[20px] flex items-center justify-center animate-pulse">
                    {tab.badge}
                  </span>
                )}
              </div>
            </button>
          ))}
        </nav>
        
        {/* Indicateur animé pour certains variants */}
        {(variant === 'modern' || variant === 'floating') && (
          <div
            className="absolute bottom-1 h-1 bg-gradient-to-r from-[#6d38e0] to-[#198eb4] rounded-full transition-all duration-500 ease-out"
            style={{
              left: `${(activeIndex * (100 / tabs.length)) + 2}%`,
              width: `${(100 / tabs.length) - 4}%`,
              transform: 'translateX(0)'
            }}
          />
        )}
      </div>
      
      {/* Contenu des onglets avec animation */}
      <div className="relative mt-6 overflow-hidden">
        <div 
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {tabs.map((tab, index) => (
            <div 
              key={tab.id} 
              className="w-full flex-shrink-0"
              style={{ opacity: index === activeIndex ? 1 : 0.3 }}
            >
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {tab.content}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}