import React from 'react';
import { LayoutGrid, UtensilsCrossed, Smile, Package, Coffee, Droplets, ShoppingBag, Layers } from 'lucide-react';

const CATEGORY_ICONS = {
  'All': <LayoutGrid size={15} />,
  'Noodles': <UtensilsCrossed size={15} />,
  'Soft Toys': <Smile size={15} />,
  'Korean Rice Dishes': <UtensilsCrossed size={15} />,
  'Ramen': <Coffee size={15} />,
  'Drinks': <Droplets size={15} />,
  'Shampoo': <ShoppingBag size={15} />,
  'Snacks': <Package size={15} />,
  'Beauty': <Layers size={15} />,
};

const DEFAULT_ICON = <Package size={15} />;

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
            {CATEGORY_ICONS[cat] ?? DEFAULT_ICON}
            <span>{cat}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
