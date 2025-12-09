import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'font-semibold rounded-[1rem] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center active:scale-[0.98] cursor-pointer';
  
  const variants = {
    // Primary: Brand yellow with dark text + glow
    primary: 'bg-[#F1E388] text-[#191B1F] hover:bg-[#E5D77C] hover:brightness-105 shadow-[0_0_30px_rgba(241,227,136,0.4)] hover:shadow-[0_0_40px_rgba(241,227,136,0.55)]',
    // Secondary: Light gray with dark text  
    secondary: 'bg-[#E5E7EB] text-[#191B1F] hover:bg-[#D1D5DB]',
    // Outline: Transparent with brand border
    outline: 'border-2 border-[#F1E388]/50 text-[#F1E388] hover:border-[#F1E388] hover:bg-[#F1E388]/10',
    // Ghost: Transparent with subtle hover
    ghost: 'text-white/70 hover:text-white hover:bg-white/10'
  };
  
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-8 py-4 text-base'
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2.5 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>{children}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};
