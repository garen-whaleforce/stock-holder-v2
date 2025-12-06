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
  duration = 2000,
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
      bg: 'bg-gradient-to-r from-emerald-400 to-teal-400',
      emoji: '✨',
    },
    error: {
      bg: 'bg-gradient-to-r from-rose-400 to-pink-400',
      emoji: '😢',
    },
    info: {
      bg: 'bg-gradient-to-r from-blue-400 to-indigo-400',
      emoji: '💡',
    },
  }[type];

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-95'
      }`}
    >
      <div
        className={`${styles.bg} text-white px-5 py-3 rounded-2xl shadow-lg flex items-center gap-2 font-medium`}
        style={{ boxShadow: '0 4px 20px -2px rgba(236, 72, 153, 0.3)' }}
      >
        <span className="text-lg">{styles.emoji}</span>
        <span>{message}</span>
      </div>
    </div>
  );
}
