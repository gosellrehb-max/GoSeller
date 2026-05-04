"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  FiPackage, FiEdit, FiTrash2, FiEye, FiShield, FiSearch, FiXCircle, FiPlus, FiAlertCircle
} from 'react-icons/fi';
import { getSellerProducts, deleteSellerProduct } from '@/features/dashboard/api/sellerProducts';
import { getCurrentSellerProfile } from '@/features/dashboard/api/sellerSettings';
import { dashboardQueryKeys } from '@/features/dashboard/queries/queryKeys';
import { getSellerIdFromSession } from '@/features/dashboard/utils/sellerSession';
import { isSellerProfileCompleteForSelling } from '@/features/dashboard/utils/sellerProfileCompletion';
import { productImageUrl, normalizeProductImages, resolveProductPrimaryImage } from '@/utils/productImageUrl';
import { productCardListingHeadline } from '@/utils/productDetailedTitle';
import { useAuth } from '@/contexts/AuthContext';
import SellerDashboardShell from '@/features/dashboard/components/SellerDashboardShell';

interface Product {
  _id?: string; id?: string; title: string; description: string; detailedTitle?: string; price: number; originalPrice?: number;
  stock: number; category: string; subcategory?: string; sku?: string; images: string[]; tags?: string[];
  specifications?: Array<{ name: string; value: string }>; variants?: Array<{ name: string; options: string[] }>;
  status: string; createdAt: string; sales: number; rating: { average: number; count: number }; isActive: boolean;
}

export default function SellerProductsView() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showProfileReminder, setShowProfileReminder] = useState(true);
  const queryClient = useQueryClient();

  const getProductId = (product: Product): string => product._id || (product as { id?: string }).id || '';

  useEffect(() => {
    if (authLoading) return;
    const hasSellerRole = user?.role === 'seller' || user?.roles?.includes('seller');
    const id = getSellerIdFromSession() || (user?.id ? String(user.id) : null);
    if (!hasSellerRole || !id) return void router.push('/seller/settings?onboarding=1');
    localStorage.setItem('activeAccount', 'seller');
    setSellerId(id);
    setIsLoading(false);
  }, [authLoading, router, user]);
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: dashboardQueryKeys.seller.products(sellerId ?? ''),
    enabled: Boolean(sellerId),
    queryFn: async () => {
      const items = await getSellerProducts(sellerId ?? '');
      return (items || []).map((p: Product) => ({ ...p, images: normalizeProductImages(p.images) }));
    },
  });
  const { data: sellerProfile = null } = useQuery({
    queryKey: dashboardQueryKeys.seller.storeProfile,
    enabled: Boolean(sellerId),
    queryFn: getCurrentSellerProfile,
  });
  const canAddProduct = isSellerProfileCompleteForSelling(sellerProfile);
  const deleteMutation = useMutation({
    mutationFn: deleteSellerProduct,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.seller.products(sellerId ?? '') });
    },
  });

  const handleViewProduct = (product: Product) => { setSelectedProduct(product); setShowViewModal(true); };
  const handleEditProduct = (product: Product) => { if (!sellerId) return void router.push('/seller/settings?onboarding=1'); const productId = getProductId(product); if (productId) router.push(`/seller/edit-product/${productId}`); };
  const handleDeleteProduct = (product: Product) => { setSelectedProduct(product); setShowDeleteModal(true); };
  const confirmDeleteProduct = async () => {
    if (!selectedProduct) return;
    setIsDeleting(true);
    try {
      const productId = getProductId(selectedProduct);
      await deleteMutation.mutateAsync(productId);
      setShowDeleteModal(false);
      setSelectedProduct(null);
    } catch {
      alert('Failed to delete product. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredProducts = products.filter((product) => {
    const q = searchTerm.toLowerCase();
    const dt = (product.detailedTitle ?? '').toLowerCase();
    const matchesSearch = product.title.toLowerCase().includes(q) || product.description.toLowerCase().includes(q) || dt.includes(q);
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  const categories = ['all', ...Array.from(new Set(products.map((p) => p.category)))];
  const getStatusColor = (status: string) => status === 'verified' ? 'text-green-600 bg-green-100' : status === 'pending' ? 'text-yellow-600 bg-yellow-100' : status === 'rejected' ? 'text-red-600 bg-red-100' : 'text-gray-600 bg-gray-100';
  if (isLoading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" /><p className="mt-4 text-gray-600">Loading...</p></div></div>;
  if (!sellerId) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><FiShield className="w-16 h-16 text-red-500 mx-auto mb-4" /><h2 className="text-xl font-bold text-gray-900 mb-2">Authentication Required</h2><p className="text-gray-600 mb-6">Please sign in to access your products</p><Link href="/login/seller" className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-600">Sign In</Link></div></div>;

  return (
    <>
      <SellerDashboardShell>
        <div className="flex min-h-full flex-col rounded-lg bg-white p-4 shadow-md sm:p-6">
          {!canAddProduct && showProfileReminder && (
            <div className="mb-6 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 sm:px-6 flex items-start sm:items-center gap-3">
              <FiAlertCircle className="w-5 h-5 text-amber-600 mt-0.5 sm:mt-0 flex-shrink-0" />
              <p className="text-sm text-amber-800">
                Please complete your seller profile to start selling smoothly.{' '}
                <Link href="/seller/settings?onboarding=1" className="font-semibold underline hover:text-amber-900 transition-colors">
                  Complete Profile
                </Link>
              </p>
            </div>
          )}
          <div className="mb-4 flex shrink-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <h1 className="text-xl font-bold text-gray-900">Your Products</h1>
            <button
              type="button"
              disabled={!canAddProduct}
              onClick={() => {
                if (!canAddProduct) return;
                router.push('/seller/addProduct');
              }}
              className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors sm:w-auto ${
                canAddProduct ? 'bg-primary hover:bg-primary/90' : 'cursor-not-allowed bg-gray-300'
              }`}
              title={!canAddProduct ? 'Complete Settings first to enable adding products.' : undefined}
            >
              <FiPlus className="h-4 w-4" />
              Add new product
            </button>
          </div>

          <div className="mb-4 flex shrink-0 flex-col gap-4 md:flex-row md:items-center">
            <div className="flex-1">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-transparent focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-primary md:w-auto"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>

          {productsLoading ? (
            <div className="flex min-h-0 flex-1 items-center justify-center">
              <div className="text-center">
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
                <p className="mt-4 text-gray-600">Loading products...</p>
              </div>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="flex min-h-0 flex-1 overflow-auto">
              <div className="grid w-full grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
                {filteredProducts.map((product) => (
                  <div key={getProductId(product)} className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                    <div className="relative aspect-[4/3] border-b border-gray-100 bg-gray-100">
                      <img src={resolveProductPrimaryImage(product)} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <h3 className="mb-0.5 line-clamp-3 text-sm font-semibold leading-snug text-gray-900">{productCardListingHeadline(product)}</h3>
                      {product.sku ? <p className="mb-2 text-sm text-gray-500">SKU: {product.sku}</p> : null}
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="rounded-md bg-gray-200 px-2.5 py-1 text-xs font-medium text-gray-800">{product.category}</span>
                        <span className="text-lg font-bold text-gray-900">${Number(product.price).toFixed(2)}</span>
                      </div>
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <span className="text-sm text-gray-500">{product.stock} units</span>
                        <span className={`text-sm font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </div>
                      <div className="mb-3 flex items-center justify-between">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(product.status)}`}>{product.status}</span>
                      </div>
                      <div className="mt-auto grid grid-cols-1 gap-2 sm:grid-cols-3">
                        <button onClick={() => handleViewProduct(product)} className="flex items-center justify-center space-x-1 rounded bg-blue-500 px-3 py-2 text-sm text-white hover:bg-blue-600">
                          <FiEye className="h-4 w-4" />
                          <span>View</span>
                        </button>
                        <button onClick={() => handleEditProduct(product)} className="flex items-center justify-center space-x-1 rounded bg-primary px-3 py-2 text-sm text-white hover:bg-primary-600">
                          <FiEdit className="h-4 w-4" />
                          <span>Edit</span>
                        </button>
                        <button onClick={() => handleDeleteProduct(product)} className="flex items-center justify-center space-x-1 rounded bg-red-500 px-3 py-2 text-sm text-white hover:bg-red-600">
                          <FiTrash2 className="h-4 w-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 items-center justify-center">
              <div className="py-12 text-center">
                <FiPackage className="mx-auto mb-4 h-16 w-16 text-gray-400" />
                <h3 className="mb-2 text-lg font-medium text-gray-900">No products found</h3>
                <p className="mb-6 text-gray-600">{searchTerm || selectedCategory !== 'all' ? 'Try adjusting your search or filters' : 'Start by adding your first product'}</p>
                <button
                  type="button"
                  disabled={!canAddProduct}
                  onClick={() => {
                    if (!canAddProduct) return;
                    router.push('/seller/addProduct');
                  }}
                  className={`rounded-lg px-6 py-2 text-white ${
                    canAddProduct ? 'bg-primary hover:bg-primary-600' : 'cursor-not-allowed bg-gray-300'
                  }`}
                  title={!canAddProduct ? 'Complete Settings first to enable adding products.' : undefined}
                >
                  Add Product
                </button>
              </div>
            </div>
          )}
        </div>
      </SellerDashboardShell>

      {showViewModal && selectedProduct ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4"><div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-xl"><div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-4 py-4 sm:px-6"><h2 className="text-lg font-bold text-gray-900 sm:text-xl">Product details</h2><button type="button" onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600" aria-label="Close"><FiXCircle className="h-6 w-6" /></button></div><div className="space-y-6 p-4 sm:p-6">{normalizeProductImages(selectedProduct.images).length > 0 ? <div><p className="mb-2 text-sm font-medium text-gray-700">Photos</p><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{normalizeProductImages(selectedProduct.images).map((src, i) => <div key={i} className="aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-100"><img src={productImageUrl(src)} alt="" className="h-full w-full object-cover" /></div>)}</div></div> : null}<div><label className="block text-sm font-medium text-gray-700">Title</label><p className="mt-1 break-words text-gray-900">{selectedProduct.title}</p></div>{selectedProduct.sku ? <div><label className="block text-sm font-medium text-gray-700">SKU</label><p className="mt-1 break-words text-gray-600">{selectedProduct.sku}</p></div> : null}<div><label className="block text-sm font-medium text-gray-700">Description</label><p className="mt-1 whitespace-pre-wrap break-words text-gray-900">{selectedProduct.description}</p></div><div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><div><label className="block text-sm font-medium text-gray-700">Price</label><p className="mt-1 font-semibold text-gray-900">PKR {Number(selectedProduct.price).toFixed(2)}</p></div>{selectedProduct.originalPrice != null && selectedProduct.originalPrice > 0 && selectedProduct.originalPrice <= 100 ? <div><label className="block text-sm font-medium text-gray-700">Discount</label><p className="mt-1 text-gray-900">{Math.round(Number(selectedProduct.originalPrice))}%</p></div> : null}<div><label className="block text-sm font-medium text-gray-700">Stock</label><p className="mt-1 text-gray-900">{selectedProduct.stock} units</p></div><div><label className="block text-sm font-medium text-gray-700">Category</label><p className="mt-1 break-words text-gray-900">{selectedProduct.category}</p></div>{selectedProduct.subcategory ? <div><label className="block text-sm font-medium text-gray-700">Subcategory</label><p className="mt-1 break-words text-gray-900">{selectedProduct.subcategory}</p></div> : null}<div><label className="block text-sm font-medium text-gray-700">Status</label><p className="mt-1 text-gray-900">{selectedProduct.status}</p></div><div><label className="block text-sm font-medium text-gray-700">Sales</label><p className="mt-1 text-gray-900">{selectedProduct.sales ?? 0}</p></div><div><label className="block text-sm font-medium text-gray-700">Availability</label><p className={`mt-1 font-medium ${selectedProduct.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>{selectedProduct.stock > 0 ? 'In stock' : 'Out of stock'}</p></div></div>{selectedProduct.tags && selectedProduct.tags.length > 0 ? <div><label className="mb-2 block text-sm font-medium text-gray-700">Tags</label><div className="flex flex-wrap gap-2">{selectedProduct.tags.map((tag, i) => <span key={`${tag}-${i}`} className="rounded-full bg-emerald-50 px-3 py-1 text-sm text-emerald-900">{tag}</span>)}</div></div> : null}{selectedProduct.specifications && selectedProduct.specifications.length > 0 ? <div><label className="mb-2 block text-sm font-medium text-gray-700">Specifications</label><ul className="divide-y divide-gray-100 rounded-lg border">{selectedProduct.specifications.map((s, i) => <li key={i} className="flex flex-col gap-1 px-3 py-3 text-sm"><span className="font-medium text-gray-800">{s.name}</span><span className="break-words text-gray-600">{s.value}</span></li>)}</ul></div> : null}{selectedProduct.variants && selectedProduct.variants.length > 0 ? <div><label className="mb-2 block text-sm font-medium text-gray-700">Variants</label><ul className="space-y-2">{selectedProduct.variants.map((v, i) => <li key={i} className="text-sm text-gray-800"><span className="font-semibold">{v.name}:</span> {(v.options || []).join(', ')}</li>)}</ul></div> : null}</div></div></div> : null}
      {showDeleteModal && selectedProduct ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><div className="mx-4 w-full max-w-md rounded-lg bg-white p-5 sm:p-6"><div className="text-center"><FiTrash2 className="mx-auto mb-4 h-12 w-12 text-red-500" /><h2 className="mb-2 text-xl font-bold text-gray-900">Delete Product</h2><p className="mb-6 text-gray-600">Are you sure you want to delete &quot;{selectedProduct.title}&quot;? This action cannot be undone.</p><div className="flex flex-col gap-3 sm:flex-row sm:space-x-4 sm:gap-0"><button onClick={() => setShowDeleteModal(false)} className="flex-1 rounded-lg bg-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-400">Cancel</button><button onClick={confirmDeleteProduct} disabled={isDeleting} className="flex-1 rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600 disabled:opacity-50">{isDeleting ? 'Deleting...' : 'Delete'}</button></div></div></div></div> : null}
    </>
  );
}

