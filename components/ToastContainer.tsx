import React from 'react';
import Toast, { Toast as ToastType } from './Toast';

interface ToastContainerProps {
  toasts: ToastType[];
  onRemove: (id: string) => void;
  position?: 'top-center' | 'top-right' | 'top-left' | 'bottom-center' | 'bottom-right' | 'bottom-left';
}

const ToastContainer: React.FC<ToastContainerProps> = ({ 
  toasts, 
  onRemove,
  position = 'top-center'
}) => {
  const positionClasses = {
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  if (toasts.length === 0) return null;

  return (
    <div className={`fixed ${positionClasses[position]} z-[100] flex flex-col gap-2 pointer-events-none`}>
      {toasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast toast={toast} onClose={() => onRemove(toast.id)} />
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;

