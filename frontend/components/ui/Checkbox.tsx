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
          className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded 
            focus:ring-2 focus:ring-blue-500 cursor-pointer transition-all"
        />
      </div>
      <div className="ml-3 flex-1">
        <label htmlFor={id} className="text-sm font-medium text-gray-900 cursor-pointer">
          {label}
        </label>
        {description && (
          <p className="text-sm text-gray-500 mt-0.5">{description}</p>
        )}
      </div>
    </div>
  );
};
