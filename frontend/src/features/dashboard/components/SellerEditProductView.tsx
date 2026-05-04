'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useParams, usePathname } from 'next/navigation';
import { withReturnUrl } from '@/features/auth/utils/returnUrl';
import { useMutation, useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiUpload, FiX, FiCheck, FiInfo } from 'react-icons/fi';
import { type ProductData as ApiProductData } from '@/services/api';
import {
  getSellerCategories,
  getSellerProductById,
  updateSellerProduct,
} from '@/features/dashboard/api/sellerProducts';
import { uploadDashboardImage } from '@/features/dashboard/api/upload';
import { dashboardQueryKeys } from '@/features/dashboard/queries/queryKeys';
import { getSellerIdFromSession } from '@/features/dashboard/utils/sellerSession';
import { productImageUrl } from '@/utils/productImageUrl';
import { CATEGORIES } from '@/config/categories';
import { normalizeProductVariants, normalizeVariantOptions } from '@/utils/productVariants';
import { MAX_DETAILED_PRODUCT_TITLE_LENGTH } from '@/utils/productDetailedTitle';

function emptyZero(n: number): '' | number {
  return n === 0 ? '' : n;
}

interface ProductData {
  detailedProductTitle: string;
  description: string;
  price: number;
  discountPercent: number;
  stock: number;
  category: string;
  subcategory?: string;
  sellerId: string;
  sku: string;
  tags?: string[];
  specifications?: Array<{ name: string; value: string }>;
  variants?: Array<{ name: string; options: string[] }>;
  images?: File[];
}

const SellerEditProductView: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const [productId, setProductId] = useState<string>('');
  const [sellerId, setSellerId] = useState<string>('');
  const [isReady, setIsReady] = useState(false);
  const [formData, setFormData] = useState<ProductData>({
    detailedProductTitle: '', description: '', price: 0, discountPercent: 0, stock: 0, category: '', subcategory: '', sellerId: '', sku: '', tags: [], specifications: [], variants: [], images: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [specInput, setSpecInput] = useState({ name: '', value: '' });
  const [newVariantName, setNewVariantName] = useState('');
  const [newVariantOptionsText, setNewVariantOptionsText] = useState('');

  useEffect(() => { const id = getSellerIdFromSession(); if (id) setSellerId(id); }, []);

  useEffect(() => {
    const fromParams = (typeof params?.id === 'string' && params.id) || (typeof params?.productId === 'string' && params.productId) || '';
    if (fromParams) return void setProductId(fromParams);
    const pathSegments = window.location.pathname.split('/').filter(Boolean);
    const idx = pathSegments.indexOf('edit-product');
    if (idx >= 0 && pathSegments[idx + 1]) setProductId(pathSegments[idx + 1]);
  }, [params]);

  useEffect(() => {
    if (!isReady) {
      const redirectTimer = setTimeout(() => {
        alert('Unable to load product information. Please try again from the dashboard.');
        router.push('/seller');
      }, 8000);
      return () => clearTimeout(redirectTimer);
    }
  }, [isReady, router]);

  useEffect(() => { if (sellerId) setFormData(prev => ({ ...prev, sellerId })); }, [sellerId]);

  useEffect(() => {
    if (!productId) return;
    const effectiveSellerId = sellerId || getSellerIdFromSession();
    if (!effectiveSellerId) {
      router.push('/seller/settings?onboarding=1');
      return;
    }
    if (effectiveSellerId !== sellerId) setSellerId(effectiveSellerId);
    setIsReady(true);
  }, [productId, sellerId, router]);

  const { data: categories = [...CATEGORIES] } = useQuery({
    queryKey: dashboardQueryKeys.seller.categories,
    queryFn: async () => {
      const list = await getSellerCategories();
      return list && Array.isArray(list) && list.length > 0 ? list : [...CATEGORIES];
    },
  });

  const { data: loadedProduct, error: productError } = useQuery({
    queryKey: dashboardQueryKeys.seller.product(productId),
    enabled: Boolean(productId) && isReady,
    queryFn: async () => getSellerProductById(productId),
  });

  useEffect(() => {
    if (!loadedProduct) return;
    const productData = loadedProduct as any;
    let finalSellerId = sellerId || getSellerIdFromSession() || '';
    if (productData.sellerId) {
      if (typeof productData.sellerId === 'object' && productData.sellerId.id) finalSellerId = productData.sellerId.id;
      else if (typeof productData.sellerId === 'string') finalSellerId = productData.sellerId;
    }
    const rawTags = productData.tags;
    const tagsList = Array.isArray(rawTags) ? rawTags.map((t: unknown) => String(t).trim()).filter(Boolean) : [];
    const dt = String((productData as { detailedTitle?: string }).detailedTitle ?? '').trim();
    const ti = String(productData.title ?? '').trim();
    setFormData({
      detailedProductTitle: dt || ti,
      description: productData.description,
      price: productData.price,
      discountPercent: Math.min(100, Math.max(0, Number(productData.originalPrice) || 0)),
      stock: productData.stock,
      category: productData.category,
      subcategory: productData.subcategory,
      sellerId: finalSellerId,
      sku: productData.sku ?? '',
      tags: tagsList,
      specifications: Array.isArray(productData.specifications) ? productData.specifications : [],
      variants: normalizeProductVariants(productData.variants),
      images: []
    });
    setExistingImages(Array.isArray(productData.images) ? productData.images.map((u: unknown) => String(u)) : []);
  }, [loadedProduct, sellerId]);

  useEffect(() => {
    if (!productError) return;
    const error = productError as any;
    if (error?.response?.status === 401) {
      alert('Your session has expired. Please sign in again.');
      router.push(withReturnUrl('/login/seller', pathname));
      return;
    }
    alert('Failed to load product data. Please try again.');
    router.push('/seller');
  }, [productError, router]);

  const updateMutation = useMutation({
    mutationFn: async (payload: Omit<Partial<ApiProductData>, 'images'> & { images: string[] }) =>
      updateSellerProduct(productId, payload),
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'price' || name === 'stock' ? parseFloat(value) || 0 : value }));
  };
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => setNewImages(prev => [...prev, ...Array.from(e.target.files || [])]);
  const removeNewImage = (index: number) => setNewImages(prev => prev.filter((_, i) => i !== index));
  const removeExistingImage = (index: number) => setExistingImages(prev => prev.filter((_, i) => i !== index));
  const addTag = () => { if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) { setFormData(prev => ({ ...prev, tags: [...(prev.tags || []), tagInput.trim()] })); setTagInput(''); } };
  const removeTag = (tagToRemove: string) => setFormData(prev => ({ ...prev, tags: prev.tags?.filter(tag => tag !== tagToRemove) || [] }));
  const addSpecification = () => {
    const specName = specInput.name.trim(); const specValue = specInput.value.trim();
    if (specName && specValue) { setFormData(prev => ({ ...prev, specifications: [...(prev.specifications || []), { name: specName, value: specValue }] })); setSpecInput({ name: '', value: '' }); }
  };
  const removeSpecification = (index: number) => setFormData(prev => ({ ...prev, specifications: prev.specifications?.filter((_, i) => i !== index) || [] }));
  const addVariant = () => {
    const name = newVariantName.trim(); const options = normalizeVariantOptions(newVariantOptionsText);
    if (name && options.length > 0) { setFormData(prev => ({ ...prev, variants: [...(prev.variants || []), { name, options }] })); setNewVariantName(''); setNewVariantOptionsText(''); }
  };
  const removeVariant = (index: number) => setFormData(prev => ({ ...prev, variants: prev.variants?.filter((_, i) => i !== index) || [] }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveSellerId = sellerId || getSellerIdFromSession();
    if (!effectiveSellerId) {
      router.push('/seller/settings?onboarding=1');
      return;
    }
    setIsLoading(true);
    try {
      const { sellerId: _, discountPercent, detailedProductTitle, images: _formImages, ...rest } = formData;
      const listingTitle = detailedProductTitle.trim();
      if (!listingTitle) {
        alert('Detailed Product Title is required.');
        setIsLoading(false);
        return;
      }

      const uploadedUrls: string[] = [];
      for (const file of newImages) {
        const { url } = await uploadDashboardImage(file);
        uploadedUrls.push(url);
      }
      const imageUrls = [...existingImages, ...uploadedUrls];
      const updateBody: Omit<Partial<ApiProductData>, 'images'> & { images: string[] } = {
        ...rest, title: listingTitle, detailedTitle: listingTitle, originalPrice: discountPercent, images: imageUrls
      };
      const response = await updateMutation.mutateAsync(updateBody);
      setIsSuccess(true);
      setSuccessData(response.product);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error?.message || 'Failed to update product. Please try again.';
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><FiCheck className="w-8 h-8 text-green-600" /></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Updated Successfully!</h2>
            <p className="text-gray-600 mb-6">Your product "{successData?.title}" has been updated and is now live in your store.</p>
            <button onClick={() => router.push('/seller')} className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors w-full">OK</button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {!isReady ? <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 mb-4"><div className="flex items-center"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>Loading product information...</div></div> : null}
      <div className="border-b bg-white shadow-sm"><div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8"><button type="button" onClick={() => router.push('/seller/products')} className="flex shrink-0 items-center text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"><FiArrowLeft className="mr-2 h-5 w-5" />Products</button><h1 className="truncate text-center text-lg font-semibold text-gray-900 sm:text-xl">Edit product</h1><span className="w-[5.5rem] shrink-0 sm:w-24" aria-hidden /></div></div>
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.form initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmit} className="min-w-0 rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="grid min-w-0 grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-10">
            <div className="min-w-0 space-y-6 lg:col-span-7">
              <h3 className="border-b border-gray-200 pb-2 text-base font-semibold text-gray-900">Basic information</h3>
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Detailed Product Title *</label><textarea value={formData.detailedProductTitle} onChange={(e) => setFormData((prev) => ({ ...prev, detailedProductTitle: e.target.value.slice(0, MAX_DETAILED_PRODUCT_TITLE_LENGTH) }))} rows={3} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Description *</label><textarea name="description" value={formData.description} onChange={handleInputChange} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary" required /></div>
              <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-2">Price *</label><input type="number" name="price" value={formData.price} onChange={handleInputChange} step="0.01" min="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary" required /></div><div><label className="block text-sm font-medium text-gray-700 mb-2">Discount (%)</label><input type="number" min={0} max={100} step={0.01} value={emptyZero(formData.discountPercent)} onChange={(e) => { const t = e.target.value; if (t === '') return setFormData((prev) => ({ ...prev, discountPercent: 0 })); const raw = parseFloat(t); if (!Number.isFinite(raw)) return; setFormData((prev) => ({ ...prev, discountPercent: Math.min(100, Math.max(0, raw)) })); }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary" /></div></div>
              <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-2">Stock Quantity *</label><input type="number" name="stock" value={formData.stock} onChange={handleInputChange} min="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary" required /></div><div><label className="block text-sm font-medium text-gray-700 mb-2">Category *</label><select name="category" value={formData.category} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary" required><option value="">Select Category</option>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select></div></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">SKU * <FiInfo className="w-4 h-4 text-gray-400" /></label><input type="text" name="sku" value={formData.sku} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary" required /></div>
            </div>

            <div className="min-w-0 space-y-8 lg:col-span-5">
              <h3 className="border-b border-gray-200 pb-2 text-base font-semibold text-gray-900">Variants, specs &amp; media</h3>
              <div><label className="mb-2 block text-sm font-medium text-gray-700">Variants</label><div className="mb-2 flex min-w-0 flex-col gap-2"><input type="text" value={newVariantName} onChange={(e) => setNewVariantName(e.target.value.replace(/,/g, ''))} placeholder="Size" className="min-w-0 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:ring-2 focus:ring-primary" /><input type="text" value={newVariantOptionsText} onChange={(e) => setNewVariantOptionsText(e.target.value)} placeholder="Small, Medium, Large" className="min-w-0 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:ring-2 focus:ring-primary" /><button type="button" onClick={addVariant} className="w-full shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 sm:w-auto sm:self-start">Add variant</button></div>{(formData.variants?.length ?? 0) > 0 ? <ul className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3">{formData.variants!.map((v, index) => <li key={`${v.name}-${index}`} className="flex items-center justify-between gap-2 text-sm"><span><span className="font-medium text-gray-900">{v.name}:</span> <span className="text-gray-600">{(v.options || []).join(', ')}</span></span><button type="button" onClick={() => removeVariant(index)} className="shrink-0 text-red-600 hover:text-red-800"><FiX className="h-4 w-4" /></button></li>)}</ul> : null}</div>
              <div><label className="mb-2 block text-sm font-medium text-gray-700">Specifications</label><div className="mb-2 flex min-w-0 flex-col gap-2"><input type="text" value={specInput.name} onChange={(e) => setSpecInput((s) => ({ ...s, name: e.target.value }))} placeholder="Name" className="min-w-0 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:ring-2 focus:ring-primary" /><input type="text" value={specInput.value} onChange={(e) => setSpecInput((s) => ({ ...s, value: e.target.value }))} placeholder="Value" className="min-w-0 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:ring-2 focus:ring-primary" /><button type="button" onClick={addSpecification} className="w-full shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 sm:w-auto sm:self-start">Add</button></div>{(formData.specifications?.length ?? 0) > 0 ? <ul className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3">{formData.specifications!.map((spec, index) => <li key={`${spec.name}-${index}`} className="flex items-center justify-between gap-2 text-sm"><span><span className="font-medium text-gray-900">{spec.name}:</span> <span className="text-gray-600">{spec.value}</span></span><button type="button" onClick={() => removeSpecification(index)} className="shrink-0 text-red-600 hover:text-red-800"><FiX className="h-4 w-4" /></button></li>)}</ul> : null}</div>
              <div><label className="mb-2 block text-sm font-medium text-gray-700">Tags</label><div className="mb-2 flex min-w-0 gap-2"><input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="Add a tag" className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:ring-2 focus:ring-primary" /><button type="button" onClick={addTag} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600">Add</button></div><div className="flex min-h-[2.5rem] flex-wrap gap-2 rounded-lg border border-dashed border-gray-200 bg-gray-50 p-3">{(formData.tags?.length ?? 0) === 0 ? <span className="text-sm text-gray-400">No tags</span> : formData.tags!.map((tag, index) => <span key={`${tag}-${index}`} className="flex items-center bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">{tag}<button type="button" onClick={() => removeTag(tag)} className="ml-2 text-orange-600 hover:text-orange-800"><FiX className="w-3 h-3" /></button></span>)}</div></div>
              <div><label className="mb-2 block text-sm font-medium text-gray-700">Images</label>{existingImages.length > 0 ? <div className="mb-4"><p className="mb-2 text-xs font-medium text-gray-500">Current</p><div className="grid grid-cols-3 gap-2 sm:grid-cols-4">{existingImages.map((image, index) => <div key={index} className="relative"><img src={productImageUrl(image)} alt={`Product ${index + 1}`} className="w-full h-24 object-cover rounded-lg" /><button type="button" onClick={() => removeExistingImage(index)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"><FiX className="w-3 h-3" /></button></div>)}</div></div> : null}<div className="rounded-lg border-2 border-dashed border-gray-300 p-4 text-center"><FiUpload className="mx-auto mb-2 h-8 w-8 text-gray-400" /><input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" id="image-upload" /><label htmlFor="image-upload" className="cursor-pointer font-medium text-primary hover:text-primary-700">Upload images</label><p className="mt-1 text-xs text-gray-500">PNG, JPG — up to 5MB each</p></div>{newImages.length > 0 ? <div className="mt-4"><p className="mb-2 text-xs font-medium text-gray-500">New</p><div className="grid grid-cols-3 gap-2 sm:grid-cols-4">{newImages.map((file, index) => <div key={index} className="relative"><img src={URL.createObjectURL(file)} alt={`New ${index + 1}`} className="w-full h-24 object-cover rounded-lg" /><button type="button" onClick={() => removeNewImage(index)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"><FiX className="w-3 h-3" /></button></div>)}</div></div> : null}</div>
            </div>
          </div>

          <div className="mt-10 flex flex-col-reverse gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:justify-end sm:gap-4">
            <button type="button" onClick={() => router.push('/seller/products')} className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={isLoading} className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50">{isLoading ? 'Updating…' : 'Update product'}</button>
          </div>
        </motion.form>
      </div>
    </div>
  );
};

export default SellerEditProductView;

