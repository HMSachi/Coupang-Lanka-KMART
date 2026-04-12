import React from 'react';
import { LayoutGrid, Sparkles, Eye, Smile, Leaf, Wind } from 'lucide-react';

const CATEGORY_ICONS = {
  'All': <LayoutGrid size={16} />,
  'Face': <Sparkles size={16} />,
  'Eyes': <Eye size={16} />,
  'Lips': <Smile size={16} />,
  'Skincare': <Leaf size={16} />,
  'Fragrances': <Wind size={16} />
};

export default function CategoryTabs({ categories, activeCategory, setActiveCategory }) {
  return (
    <div className="category-scroll-container">
      <div className="pos-categories-premium">
        {categories.map(cat => (
          <button
            key={cat}
            className={`premium-cat-btn ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
            type="button"
          >
            {CATEGORY_ICONS[cat]}
            <span>{cat}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
