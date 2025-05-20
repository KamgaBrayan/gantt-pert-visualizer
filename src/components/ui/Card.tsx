'use client';

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  elevation?: 'flat' | 'low' | 'medium' | 'high';
  withBorder?: boolean;
}

export default function Card({
  children,
  title,
  footer,
  className = '',
  contentClassName = '',
  elevation = 'medium',
  withBorder = false
}: CardProps) {
  const elevationClasses = {
    flat: '',
    low: 'shadow-sm',
    medium: 'shadow-md',
    high: 'shadow-lg'
  };
  
  const borderClasses = withBorder ? 'border border-gray-200' : '';
  
  return (
    <div 
      className={`bg-white rounded-lg ${elevationClasses[elevation]} ${borderClasses} overflow-hidden ${className}`}
    >
      {title && (
        <div className="px-6 py-4 border-b border-gray-200">
          {typeof title === 'string' ? (
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          ) : (
            title
          )}
        </div>
      )}
      
      <div className={`px-6 py-4 ${contentClassName}`}>
        {children}
      </div>
      
      {footer && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          {footer}
        </div>
      )}
    </div>
  );
}