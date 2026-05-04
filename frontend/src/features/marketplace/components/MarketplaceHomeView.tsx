'use client';

import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import MarketplaceHomeContentView from '@/features/marketplace/components/home/MarketplaceHomeView';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { CATEGORIES, CATEGORY_TO_SLUG_MAPPING } from '@/config/categories';

export default function MarketplaceHomeView() {
  interface DummyProduct {
    _id: string;
    name: string;
    price: number;
    originalPrice?: number;
    rating: number;
    reviews: number;
    stock: number;
    images: string[];
    category: string;
    isBestSeller?: boolean;
  }

  const [showCategoriesDropdown, setShowCategoriesDropdown] = useState(false);
  const { user } = useAuth();
  const { addToCart, isProductInCart } = useCart();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getProductImage = (_productName: string, _category: string) => '/images/GoSellrIcon.png';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCategoriesDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const categoryIcons: Record<string, string> = {
    Electronics: '📱', Fashion: '👕', Home: '🏠', Beauty: '💄', Sports: '⚽',
    Books: '📚', Automotive: '🚗', Health: '🏥', Grocery: '🛒', Other: '📦',
  };

  const categoryColors: Record<string, string> = {
    Electronics: 'bg-blue-500', Fashion: 'bg-pink-500', Home: 'bg-green-500', Beauty: 'bg-purple-500',
    Sports: 'bg-[#00B207]', Books: 'bg-indigo-500', Automotive: 'bg-gray-500', Health: 'bg-red-500',
    Grocery: 'bg-yellow-500', Other: 'bg-teal-500',
  };

  const gosellerCategories = CATEGORIES.map((category, index) => ({
    id: (index + 1).toString(),
    name: category,
    icon: categoryIcons[category] || '📦',
    color: categoryColors[category] || 'bg-gray-500',
    slug: CATEGORY_TO_SLUG_MAPPING[category as keyof typeof CATEGORY_TO_SLUG_MAPPING],
    bestSellers: [1, 2, 3, 4].map((num) => ({
      _id: `${index + num}`,
      name: `${category} Product ${num}`,
      price: [29.99, 49.99, 79.99, 19.99][num - 1],
      originalPrice: [39.99, 59.99, 99.99, 24.99][num - 1],
      rating: [4.5, 4.3, 4.7, 4.2][num - 1],
      reviews: [123, 89, 156, 67][num - 1],
      stock: [50, 30, 25, 100][num - 1],
      images: [getProductImage(`${category} Product ${num}`, category)],
      category,
      isBestSeller: true,
    })),
  }));

  const handleAddToCart = async (product: DummyProduct) => {
    try {
      await addToCart(
        {
          id: product._id,
          title: product.name,
          description: product.name,
          price: product.price,
          originalPrice: product.originalPrice,
          images: product.images,
          category: product.category,
          sku: product._id,
          stock: product.stock,
          tags: [product.category],
          specifications: [],
          variants: [],
          sellerId: { id: 'dummy-seller', name: 'Dummy Store', shopName: 'Dummy Store', location: 'Unknown', verified: false },
          status: 'approved',
          isActive: true,
          views: 0,
          sales: 0,
          rating: { average: product.rating, count: product.reviews },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        1,
      );
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };

  return (
    <MarketplaceHomeContentView
      showCategoriesDropdown={showCategoriesDropdown}
      setShowCategoriesDropdown={setShowCategoriesDropdown}
      dropdownRef={dropdownRef}
      gosellerCategories={gosellerCategories}
      getProductImage={getProductImage}
      handleAddToCart={handleAddToCart}
      isProductInCart={isProductInCart}
      hideShoppingCatalog={user?.role === 'seller'}
      onAddDeliveryAddress={() =>
        toast('Set your delivery location at checkout, or sign in and update your saved address in account settings.')
      }
    />
  );
}

