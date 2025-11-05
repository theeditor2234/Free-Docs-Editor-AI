
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-white/75 dark:bg-slate-900/75 backdrop-blur-lg sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-4">
            <img src="/logo.png" alt="Free Docs Editor AI logo" className="h-12" />
            <span className="text-2xl font-bold text-slate-900 dark:text-white">Free Docs Editor AI</span>
          </div>
          {/* Future navigation links can go here */}
        </div>
      </div>
    </header>
  );
};

export default Header;
