'use client';

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  variant?: 'default' | 'glass' | 'gradient' | 'minimal';
  interactive?: boolean;
  withGlow?: boolean;
}

export default function Card({
  children,
  title,
  footer,
  className = '',
  contentClassName = '',
  variant = 'default',
  interactive = false,
  withGlow = false
}: CardProps) {
  const baseClasses = `
    relative overflow-hidden rounded-2xl transition-all duration-500
    ${interactive ? 'hover:scale-[1.02] cursor-pointer group' : ''}
  `;
  
  const variantClasses = {
    default: `
      bg-white/95 backdrop-blur-xl shadow-xl hover:shadow-2xl
      border border-white/20
      ${withGlow ? 'shadow-[0_0_40px_rgba(109,56,224,0.15)]' : ''}
    `,
    glass: `
      bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl
      border border-white/20 shadow-2xl
      ${withGlow ? 'shadow-[0_0_60px_rgba(109,56,224,0.2)]' : ''}
    `,
    gradient: `
      bg-gradient-to-br from-[#6d38e0]/5 to-[#198eb4]/5 backdrop-blur-xl
      border border-gradient-to-r border-[#6d38e0]/20 shadow-xl hover:shadow-2xl
      ${withGlow ? 'shadow-[0_0_40px_rgba(109,56,224,0.15)]' : ''}
    `,
    minimal: `
      bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl
      border-0 rounded-3xl
    `
  };
  
  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {/* Effet de brillance pour les cartes interactives */}
      {interactive && (
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000" />
        </div>
      )}
      
      {/* En-tête avec animation */}
      {title && (
        <div className="relative px-8 py-6 border-b border-white/10">
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#6d38e0]/30 to-transparent" />
          {typeof title === 'string' ? (
            <h3 className="text-xl font-bold bg-gradient-to-r from-[#040642] to-[#6d38e0] bg-clip-text text-transparent">
              {title}
            </h3>
          ) : (
            title
          )}
        </div>
      )}
      
      {/* Contenu principal */}
      <div className={`relative px-8 py-6 ${contentClassName}`}>
        {children}
      </div>
      
      {/* Pied de page */}
      {footer && (
        <div className="relative px-8 py-4 bg-gradient-to-r from-white/5 to-white/10 border-t border-white/10">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#6d38e0]/30 to-transparent" />
          {footer}
        </div>
      )}
      
      {/* Particules flottantes pour l'effet premium */}
      {withGlow && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-4 left-4 w-2 h-2 bg-[#6d38e0]/20 rounded-full animate-pulse" />
          <div className="absolute top-8 right-8 w-1 h-1 bg-[#198eb4]/30 rounded-full animate-ping" />
          <div className="absolute bottom-6 left-8 w-1.5 h-1.5 bg-[#6d38e0]/15 rounded-full animate-pulse delay-500" />
        </div>
      )}
    </div>
  );
}