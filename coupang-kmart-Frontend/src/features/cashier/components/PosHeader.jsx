import React from 'react';
import { Search, LogOut } from 'lucide-react';

export default function PosHeader({ searchQuery, setSearchQuery, onLogout }) {
  return (
    <header className="pos-header">
      <div className="pos-search-box">
        <Search size={20} className="icon-search" />
        <input 
          type="text" 
          placeholder="Search cosmetics or scan barcode..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoFocus
        />
      </div>

      <button className="logout-btn-top" onClick={onLogout} type="button">
        <LogOut size={18} /> Exit POS
      </button>
    </header>
  );
}
