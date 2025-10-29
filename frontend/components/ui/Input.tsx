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
        <label className="block text-sm font-semibold text-gray-900 mb-2.5">
          {label}
        </label>
      )}
      <input
        className={`w-full px-4 py-3 bg-white border-2 rounded-xl text-sm transition-all duration-200 shadow-sm
          ${error 
            ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100' 
            : 'border-gray-200 focus:border-violet-400 focus:ring-4 focus:ring-violet-100'
          }
          focus:outline-none hover:border-gray-300
          disabled:bg-gray-50 disabled:cursor-not-allowed
          ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-2 text-sm text-red-600 font-medium">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-2 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};
