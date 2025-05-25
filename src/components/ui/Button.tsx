'use client';

import React from 'react';

interface ButtonProps {
  onClick?: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  icon?: React.ReactNode;
  loading?: boolean;
}

export default function Button({
  onClick,
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  type = 'button',
  className = '',
  icon,
  loading = false
}: ButtonProps) {
  const baseClasses = `
    relative overflow-hidden rounded-xl font-semibold transition-all duration-300 
    focus:outline-none focus:ring-4 focus:ring-opacity-30 inline-flex items-center justify-center
    transform hover:scale-[1.02] active:scale-[0.98] disabled:transform-none
    group cursor-pointer disabled:cursor-not-allowed
  `;
  
  const variantClasses = {
    primary: `
      bg-gradient-to-r from-[#6d38e0] to-[#198eb4] hover:from-[#5a2bc7] hover:to-[#1478a0]
      text-white shadow-lg hover:shadow-xl focus:ring-[#6d38e0]
      before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:to-transparent 
      before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300
    `,
    secondary: `
      bg-[#040642] hover:bg-[#0a0b5c] text-white shadow-md hover:shadow-lg 
      focus:ring-[#040642] border border-[#040642]/20
    `,
    outline: `
      border-2 border-[#6d38e0] bg-white hover:bg-[#6d38e0]/5 text-[#6d38e0] 
      hover:border-[#5a2bc7] focus:ring-[#6d38e0] backdrop-blur-sm
    `,
    danger: `
      bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700
      text-white shadow-md hover:shadow-lg focus:ring-red-500
    `,
    success: `
      bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700
      text-white shadow-md hover:shadow-lg focus:ring-emerald-500
    `,
    ghost: `
      text-[#040642] hover:bg-[#040642]/5 focus:ring-[#040642]/20
      backdrop-blur-sm
    `
  };
  
  const sizeClasses = {
    sm: 'text-sm px-4 py-2 min-h-[36px]',
    md: 'text-base px-6 py-3 min-h-[44px]',
    lg: 'text-lg px-8 py-4 min-h-[52px]'
  };
  
  const disabledClasses = disabled || loading ? 'opacity-60 cursor-not-allowed hover:scale-100' : '';
  const widthClasses = fullWidth ? 'w-full' : '';
  
  return (
    <button
      type={type}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${widthClasses} ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {/* Effet de brillance au hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000" />
      </div>
      
      {/* Contenu du bouton */}
      <div className="relative flex items-center justify-center">
        {loading && (
          <div className="mr-2 w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        {!loading && icon && <span className="mr-2 transition-transform group-hover:scale-110">{icon}</span>}
        <span className="relative z-10">{children}</span>
      </div>
    </button>
  );
}