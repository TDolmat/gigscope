import React from 'react';
import { Button } from './Button';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'default';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Potwierdź',
  cancelText = 'Anuluj',
  variant = 'default',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl p-5 sm:p-6 max-w-md w-full animate-in fade-in zoom-in duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-gray-600 transition-colors p-1"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="mb-5 sm:mb-6 pr-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
            {title}
          </h3>
          {description && (
            <p className="text-xs sm:text-sm text-gray-600">
              {description}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end">
          <Button
            variant="secondary"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            {cancelText}
          </Button>
          {onConfirm && (
            <Button
              variant={variant === 'danger' ? 'primary' : 'primary'}
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`w-full sm:w-auto ${variant === 'danger' ? 'bg-red-600 hover:bg-red-700' : ''}`}
            >
              {confirmText}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

