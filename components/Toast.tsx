import React, { useEffect, useState } from 'react';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  icon?: React.ReactNode;
}

interface ToastProps {
  toast: Toast;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Fade in
    setTimeout(() => setIsVisible(true), 10);

    // Auto close
    const duration = toast.duration ?? 3000;
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.duration, onClose]);

  const typeStyles = {
    info: 'bg-blue-600/95 border-blue-400 text-blue-50',
    success: 'bg-green-600/95 border-green-400 text-green-50',
    warning: 'bg-yellow-600/95 border-yellow-400 text-yellow-50',
    error: 'bg-red-600/95 border-red-400 text-red-50',
  };

  const defaultIcons = {
    info: <Info size={18} />,
    success: <CheckCircle size={18} />,
    warning: <AlertTriangle size={18} />,
    error: <AlertCircle size={18} />,
  };

  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-3 rounded-xl border-2 shadow-2xl
        backdrop-blur-md min-w-[280px] max-w-[400px]
        transition-all duration-300 ease-out
        ${typeStyles[toast.type]}
        ${isVisible && !isExiting ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-95'}
      `}
    >
      <div className="flex-shrink-0">
        {toast.icon || defaultIcons[toast.type]}
      </div>
      <div className="flex-1 font-medium text-sm leading-tight">
        {toast.message}
      </div>
      <button
        onClick={() => {
          setIsExiting(true);
          setTimeout(onClose, 300);
        }}
        className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default Toast;

