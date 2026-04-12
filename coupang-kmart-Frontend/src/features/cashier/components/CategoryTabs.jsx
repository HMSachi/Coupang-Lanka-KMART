import React from 'react';

export default function CategoryTabs({ categories, activeCategory, setActiveCategory }) {
  return (
    <div className="pos-categories-wrapper">
      <div className="pos-categories">
        {categories.map(cat => (
          <button 
            key={cat} 
            className={`cat-btn ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
            type="button"
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
}
