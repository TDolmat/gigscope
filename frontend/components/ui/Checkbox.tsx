import React from 'react';

interface CheckboxProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  id,
  label,
  checked,
  onChange,
  description
}) => {
  return (
    <div className="flex items-start">
      <div className="flex items-center h-5">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="w-5 h-5 text-blue-600 bg-white border-gray-300 rounded-lg 
            focus:ring-4 focus:ring-blue-100 cursor-pointer transition-all shadow-sm
            hover:border-blue-400"
        />
      </div>
      <div className="ml-3 flex-1">
        <label htmlFor={id} className="text-base font-bold text-slate-800 cursor-pointer hover:text-blue-600 transition-colors">
          {label}
        </label>
        {description && (
          <p className="text-sm text-gray-600 mt-1 font-medium">{description}</p>
        )}
      </div>
    </div>
  );
};
