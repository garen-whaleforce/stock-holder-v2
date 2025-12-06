'use client';

import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  show: boolean;
  onClose: () => void;
  duration?: number;
  type?: 'success' | 'error' | 'info';
}

export default function Toast({
  message,
  show,
  onClose,
  duration = 3000,
  type = 'success',
}: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onClose, 300);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  if (!show && !visible) return null;

  const styles = {
    success: {
      gradient: 'linear-gradient(135deg, #34d399 0%, #10b981 50%, #059669 100%)',
      shadow: '0 10px 40px -10px rgba(16, 185, 129, 0.6)',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
    error: {
      gradient: 'linear-gradient(135deg, #fb7185 0%, #ef4444 50%, #dc2626 100%)',
      shadow: '0 10px 40px -10px rgba(239, 68, 68, 0.6)',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
    },
    info: {
      gradient: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 50%, #6366f1 100%)',
      shadow: '0 10px 40px -10px rgba(139, 92, 246, 0.6)',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  }[type];

  return (
    <div
      className={`fixed bottom-5 right-5 z-50 transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'
      }`}
    >
      <div
        className="text-white px-5 py-3.5 rounded-xl flex items-center gap-3 font-semibold backdrop-blur-sm"
        style={{
          background: styles.gradient,
          boxShadow: styles.shadow,
        }}
      >
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
          {styles.icon}
        </div>
        <span className="text-sm">{message}</span>
      </div>
    </div>
  );
}
