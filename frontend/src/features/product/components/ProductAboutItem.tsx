'use client';

import React from 'react';
import { Product } from '@/services/api';
import { ProductAccordionSection } from './ProductAccordionSection';

interface Props {
  product: Product;
}

export function ProductAboutItem({ product }: Props) {
  return (
    <div className="space-y-0">
      <ProductAccordionSection title="Description" defaultOpen={false}>
        <p className="leading-relaxed whitespace-pre-wrap">{product.description}</p>
      </ProductAccordionSection>

      {product.specifications && product.specifications.length > 0 && (
        <ProductAccordionSection title="Specifications" defaultOpen={false}>
          <ul className="list-none space-y-0 divide-y divide-gray-100">
            {product.specifications.map((spec, index) => (
              <li key={index} className="flex flex-col gap-1 py-3 first:pt-0">
                <span className="font-medium text-gray-800">{spec.name}</span>
                <span className="break-words text-gray-600">{spec.value}</span>
              </li>
            ))}
          </ul>
        </ProductAccordionSection>
      )}

      <ProductAccordionSection title="Product Details" defaultOpen={false}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Basic Information</h4>
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-500">SKU:</span>
                <span className="text-gray-800">{product.sku}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Category:</span>
                <span className="text-gray-800">{product.category}</span>
              </div>
              {product.subcategory && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Subcategory:</span>
                  <span className="text-gray-800">{product.subcategory}</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Availability</h4>
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-500">Stock:</span>
                <span className="text-gray-800">{product.stock} units</span>
              </div>

              {product.originalPrice != null &&
                product.originalPrice > 0 &&
                product.originalPrice <= 100 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Discount:</span>
                    <span className="text-gray-800">
                      {Math.round(Number(product.originalPrice))}%
                    </span>
                  </div>
                )}
            </div>
          </div>
        </div>
      </ProductAccordionSection>

      <ProductAccordionSection title="Tags" defaultOpen={false}>
        {product.tags && product.tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {product.tags.map((tag, index) => (
              <span
                key={`${tag}-${index}`}
                className="bg-gray-100 text-gray-700 border border-gray-200 px-2.5 py-1 rounded text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No tags for this product.</p>
        )}
      </ProductAccordionSection>
    </div>
  );
}
