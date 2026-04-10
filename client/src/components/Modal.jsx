import { useEffect } from 'react';

export default function Modal({ title, onClose, children, size = 'md' }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`bg-white rounded-3xl shadow-2xl shadow-slate-900/20 w-full ${sizes[size]} max-h-[90vh] overflow-y-auto border border-slate-100`}>
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-500 text-slate-400 transition-all duration-150 text-lg font-bold"
          >
            ×
          </button>
        </div>
        {/* Body */}
        <div className="px-7 py-6">{children}</div>
      </div>
    </div>
  );
}
