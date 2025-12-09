import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-white mb-2.5">
          {label}
        </label>
      )}
      <input
        className={`w-full px-4 py-3.5 bg-[#191B1F] border border-white/20 rounded-[1rem] text-sm font-medium text-white transition-all duration-200
          ${error 
            ? 'border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
            : 'hover:border-[#F1E388]/40 focus:border-[#F1E388] focus:ring-2 focus:ring-[#F1E388]/20'
          }
          focus:outline-none
          disabled:bg-[#191B1F]/50 disabled:cursor-not-allowed disabled:opacity-60
          placeholder:text-white/40
          ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-2 text-sm text-red-400 font-medium">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-2 text-sm text-white/50">{helperText}</p>
      )}
    </div>
  );
};
