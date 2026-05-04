// Shared categories configuration that matches the backend
export const CATEGORIES = [
  'Grocery',
  'Electronics', 
  'Fashion',
  'Home',
  'Beauty',
  'Sports',
  'Books',
  'Automotive',
  'Health',
  'Other'
] as const;

export type Category = typeof CATEGORIES[number];

// Category mapping for URL slugs
export const CATEGORY_SLUG_MAPPING: Record<string, Category> = {
  'grocery': 'Grocery',
  'electronics': 'Electronics',
  'fashion': 'Fashion', 
  'home': 'Home',
  'beauty': 'Beauty',
  'sports': 'Sports',
  'books': 'Books',
  'automotive': 'Automotive',
  'health': 'Health',
  'other': 'Other'
};

// Reverse mapping for getting slug from category
export const CATEGORY_TO_SLUG_MAPPING: Record<Category, string> = {
  'Grocery': 'grocery',
  'Electronics': 'electronics',
  'Fashion': 'fashion',
  'Home': 'home',
  'Beauty': 'beauty',
  'Sports': 'sports',
  'Books': 'books',
  'Automotive': 'automotive',
  'Health': 'health',
  'Other': 'other'
};

// Category descriptions for display
export const CATEGORY_DESCRIPTIONS: Record<Category, string> = {
  'Grocery': 'Fresh food and household essentials',
  'Electronics': 'Latest gadgets and electronic devices',
  'Fashion': 'Trendy clothing and accessories',
  'Home': 'Everything for your home and kitchen',
  'Beauty': 'Cosmetics and personal care products',
  'Sports': 'Sports equipment and outdoor gear',
  'Books': 'Books, magazines, and educational materials',
  'Automotive': 'Car parts and automotive accessories',
  'Health': 'Health and wellness products',
  'Other': 'Miscellaneous products and services'
}

/** Sub-headings for the All Categories mega menu (links use parent category URL). */
export const CATEGORY_SUBMENU: Record<string, readonly string[]> = {
  grocery: [
    'All Grocery',
    'Fresh & produce',
    'Pantry staples',
    'Beverages',
    'Frozen',
    'Snacks',
    'Household essentials',
  ],
  electronics: [
    'All Electronics',
    'TV & home theater',
    'Computers & tablets',
    'Cell phones',
    'Audio',
    'Cameras',
    'Wearable tech',
  ],
  fashion: ['All Fashion', 'Men', 'Women', 'Kids', 'Shoes', 'Accessories', 'Jewelry'],
  home: ['All Home', 'Furniture', 'Kitchen', 'Bedding', 'Bath', 'Decor', 'Storage'],
  beauty: ['All Beauty', 'Skincare', 'Makeup', 'Hair care', 'Fragrance', 'Personal care'],
  sports: ['All Sports', 'Exercise & fitness', 'Outdoor recreation', 'Team sports', 'Fan shop', 'Camping'],
  books: ['All Books', 'Fiction', 'Non-fiction', 'Kids & teens', 'Textbooks', 'Magazines'],
  automotive: ['All Automotive', 'Parts & accessories', 'Interior', 'Exterior', 'Oils & fluids', 'Tires'],
  health: ['All Health', 'Wellness', 'Vitamins', 'Medical supplies', 'Personal care', 'First aid'],
  other: ['All in category', 'Trending', 'Deals', 'New arrivals'],
} 