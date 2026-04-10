import React from 'react';

const Toast = ({ msg, show }) => (
  <div
    className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] bg-gray-900/90 backdrop-blur text-white text-sm font-bold px-6 py-3 rounded-full shadow-2xl border border-white/10 transition-all duration-300 ${
      show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
    }`}
  >
    {msg}
  </div>
);

export default Toast;
