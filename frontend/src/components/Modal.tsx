import React, { useEffect } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export default function Modal({ open, onClose, title, children, footer }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 guo-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="guo-card w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ borderRadius: 2 }}
      >
        {/* 标题区 */}
        <div className="px-6 py-4 flex items-center justify-between relative" style={{
          borderBottom: '1px solid var(--color-sandalwood)',
        }}>
          <h3 className="guo-title text-lg" style={{ letterSpacing: '0.15em' }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            aria-label="关闭"
            className="w-7 h-7 flex items-center justify-center text-xl transition-colors"
            style={{ color: 'var(--color-sandalwood)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-vermilion)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-sandalwood)')}
          >
            ×
          </button>
          {/* 装饰：标题下的花纹 */}
          <div className="absolute bottom-0 left-6 right-6 h-px" style={{
            background: 'linear-gradient(90deg, transparent 0%, var(--color-golden) 50%, transparent 100%)',
            opacity: 0.5,
          }} />
        </div>

        {/* 内容区 */}
        <div className="px-6 py-5 overflow-y-auto flex-1">
          {children}
        </div>

        {/* 底部按钮区 */}
        {footer && (
          <div className="px-6 py-3 flex justify-end gap-3 relative" style={{
            borderTop: '1px dashed rgba(107, 68, 35, 0.3)',
            backgroundColor: 'rgba(232, 220, 196, 0.3)',
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
