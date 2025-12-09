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
          className="w-5 h-5 text-[#F1E388] bg-[#191B1F] border-white/20 rounded-lg 
            focus:ring-2 focus:ring-[#F1E388]/50 cursor-pointer transition-all
            hover:border-[#F1E388]/50 accent-[#F1E388]"
        />
      </div>
      <div className="ml-3 flex-1">
        <label htmlFor={id} className="text-base font-bold text-white cursor-pointer hover:text-[#F1E388] transition-colors">
          {label}
        </label>
        {description && (
          <p className="text-sm text-white/50 mt-1 font-medium">{description}</p>
        )}
      </div>
    </div>
  );
};
