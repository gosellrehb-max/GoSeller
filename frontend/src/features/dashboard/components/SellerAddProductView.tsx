"use client"
import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  ProductFormHelpPanel,
  ProductFormHelpTrigger,
} from '@/features/product/components/ProductFormHelpCallout';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  FiPackage,
  FiImage,
  FiArrowRight,
  FiPlus,
  FiX,
  FiInfo
} from 'react-icons/fi';
import { type ProductData as ApiProductData } from '@/services/api';
import {
  createSellerProduct,
  getSellerCategories,
} from '@/features/dashboard/api/sellerProducts';
import { getSellerProfileById } from '@/features/dashboard/api/sellerProfile';
import { dashboardQueryKeys } from '@/features/dashboard/queries/queryKeys';
import { getSellerIdFromSession } from '@/features/dashboard/utils/sellerSession';
import { isSellerProfileCompleteForSelling } from '@/features/dashboard/utils/sellerProfileCompletion';
import { CATEGORIES } from '@/config/categories';
import { normalizeVariantOptions } from '@/utils/productVariants';
import { MAX_DETAILED_PRODUCT_TITLE_LENGTH } from '@/utils/productDetailedTitle';

interface ProductData {
  detailedProductTitle: string;
  description: string;
  price: number;
  discountPercent: number;
  stock: number;
  category: string;
  subcategory: string;
  sku: string;
  images: File[];
  tags: string[];
  isActive: boolean;
  shippingInfo: { shippingClass: string };
  variants: ProductVariant[];
  specifications: ProductSpecification[];
  tieredPricing?: {
    dealerPrice: number;
    wholesalerPrice: number;
    storePrice: number;
    retailPrice: number;
  };
  inventory?: {
    availableStock: number;
    reservedStock: number;
    minimumStockLevel: number;
    reorderPoint: number;
    supplierInfo: {
      name: string;
      contact: string;
      leadTime: number;
    };
  };
}

interface ProductVariant {
  id: string;
  name: string;
  options: string[];
  values: string[];
}

interface ProductSpecification {
  name: string;
  value: string;
}

function emptyZero(n: number): '' | number {
  return n === 0 ? '' : n;
}

const SellerAddProductView: React.FC = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  const [isCompanySeller, setIsCompanySeller] = useState(false);

  const sellerId = getSellerIdFromSession();

  const { data: sellerProfile } = useQuery({
    queryKey: dashboardQueryKeys.seller.profile(sellerId ?? ''),
    enabled: Boolean(sellerId),
    queryFn: async () => getSellerProfileById(sellerId ?? ''),
  });
  const canAddProduct = isSellerProfileCompleteForSelling(sellerProfile ?? null);

  useEffect(() => {
    if (sellerProfile) {
      setIsCompanySeller((sellerProfile.sellerCategory || 'Shopkeeper') === 'Company');
    }
  }, [sellerProfile]);

  const [productData, setProductData] = useState<ProductData>({
    detailedProductTitle: '',
    description: '',
    price: 0,
    discountPercent: 0,
    stock: 0,
    category: '',
    subcategory: '',
    sku: '',
    images: [],
    tags: [],
    isActive: true,
    shippingInfo: { shippingClass: 'standard' },
    variants: [],
    specifications: [],
    tieredPricing: { dealerPrice: 0, wholesalerPrice: 0, storePrice: 0, retailPrice: 0 },
    inventory: {
      availableStock: 0,
      reservedStock: 0,
      minimumStockLevel: 0,
      reorderPoint: 0,
      supplierInfo: { name: '', contact: '', leadTime: 0 }
    }
  });

  const [newVariantName, setNewVariantName] = useState('');
  const [newVariantOptionsText, setNewVariantOptionsText] = useState('');
  const [variantHelpOpen, setVariantHelpOpen] = useState(true);
  const [specHelpOpen, setSpecHelpOpen] = useState(true);
  const [newSpecification, setNewSpecification] = useState<ProductSpecification>({ name: '', value: '' });
  const [tagDraftError, setTagDraftError] = useState('');
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (currentStep === 4) {
      setVariantHelpOpen(true);
      setSpecHelpOpen(true);
    }
  }, [currentStep]);

  const { data: categories = [...CATEGORIES] } = useQuery({
    queryKey: dashboardQueryKeys.seller.categories,
    queryFn: async () => {
      const list = await getSellerCategories();
      return list && Array.isArray(list) && list.length > 0 ? list : [...CATEGORIES];
    },
  });
  const createMutation = useMutation({
    mutationFn: async (payload: ApiProductData) => createSellerProduct(payload),
  });

  const handleInputChange = (field: keyof ProductData, value: any) => setProductData(prev => ({ ...prev, [field]: value }));
  const handleImageUpload = (files: FileList | null) => {
    if (!files) return;
    const fileArray = Array.from(files);
    setProductData(prev => ({ ...prev, images: [...prev.images, ...fileArray].slice(0, 5) }));
  };
  const removeImage = (index: number) => setProductData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  const addTag = () => {
    if (newTag.trim() && !productData.tags.includes(newTag.trim())) {
      setProductData(prev => ({ ...prev, tags: [...prev.tags, newTag.trim()] }));
      setNewTag('');
      setTagDraftError('');
    }
  };
  const removeTag = (tag: string) => setProductData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  const addVariant = () => {
    const name = newVariantName.trim();
    const options = normalizeVariantOptions(newVariantOptionsText);
    if (name && options.length > 0) {
      setProductData(prev => ({ ...prev, variants: [...prev.variants, { id: Date.now().toString(), name, options, values: [] }] }));
      setNewVariantName('');
      setNewVariantOptionsText('');
    }
  };
  const removeVariant = (id: string) => setProductData(prev => ({ ...prev, variants: prev.variants.filter(v => v.id !== id) }));
  const addSpecification = () => {
    const specName = newSpecification.name.trim();
    const specValue = newSpecification.value.trim();
    if (specName && specValue) {
      setProductData(prev => ({ ...prev, specifications: [...prev.specifications, { name: specName, value: specValue }] }));
      setNewSpecification({ name: '', value: '' });
    }
  };
  const removeSpecification = (index: number) => setProductData(prev => ({ ...prev, specifications: prev.specifications.filter((_, i) => i !== index) }));

  const hasUnsavedVariantDraft = () => newVariantName.trim() !== '' || newVariantOptionsText.trim() !== '';
  const hasUnsavedSpecDraft = () => newSpecification.name.trim() !== '' || newSpecification.value.trim() !== '';

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!productData.detailedProductTitle.trim() || !productData.description.trim() || !productData.category.trim() || !productData.sku.trim()) {
        alert('Please complete required fields.');
        return;
      }
    }
    if (currentStep === 2 && newTag.trim() !== '') {
      setTagDraftError('Click the + button to add this tag, or clear the field.');
      return;
    }
    setTagDraftError('');
    if (currentStep === 3) {
      if (productData.images.length === 0) {
        alert('Please upload at least one product image.');
        return;
      }
      const MAX_FILE_SIZE = 5 * 1024 * 1024;
      if (productData.images.some(file => file.size > MAX_FILE_SIZE)) {
        alert(`One or more files are too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB per image.`);
        return;
      }
    }
    if (currentStep === 4 && (hasUnsavedVariantDraft() || hasUnsavedSpecDraft())) {
      alert('Use “Add Variant” or “Add Specification” to save what you typed, or clear those fields before continuing.');
      return;
    }
    setCurrentStep(prev => prev + 1);
  };

  const handleSubmit = async () => {
    if (!sellerId) {
      router.push('/seller/settings?onboarding=1');
      return;
    }
    if (newTag.trim() !== '') {
      setTagDraftError('Click the + button to add this tag, or clear the field.');
      setCurrentStep(2);
      return;
    }
    if (!productData.detailedProductTitle.trim() || !productData.description.trim() || !productData.category.trim() || !productData.sku.trim()) {
      alert('Please complete required fields.');
      setCurrentStep(1);
      return;
    }
    if (hasUnsavedVariantDraft() || hasUnsavedSpecDraft()) {
      alert('Use “Add Variant” or “Add Specification” to save what you typed, or clear those fields before publishing.');
      setCurrentStep(4);
      return;
    }
    if (productData.images.length === 0) {
      alert('Please add at least one product image before publishing.');
      setCurrentStep(3);
      return;
    }

    setIsSubmitting(true);
    try {
      const listingTitle = productData.detailedProductTitle.trim();
      const response = await createMutation.mutateAsync({
        title: listingTitle,
        description: productData.description,
        detailedTitle: listingTitle,
        price: productData.price,
        originalPrice: productData.discountPercent,
        stock: productData.stock,
        category: productData.category,
        subcategory: productData.subcategory,
        sku: productData.sku,
        sellerId,
        isActive: productData.isActive,
        images: productData.images,
        tags: productData.tags,
        specifications: productData.specifications,
        variants: productData.variants,
      });
      setSuccessData(response?.product ?? response);
      setIsSuccess(true);
    } catch (error: any) {
      alert(error.response?.data?.error?.message || error.response?.data?.message || 'Failed to create product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessOK = () => router.push('/seller');
  const steps = [
    { number: 1, title: 'Basic Information' },
    { number: 2, title: 'Pricing & Inventory' },
    { number: 3, title: 'Images & Media' },
    { number: 4, title: 'Variants & Specs' },
    { number: 5, title: 'Review & Publish' }
  ];

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="flex items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="max-w-md w-full text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }} className="mx-auto w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mb-6">
              <FiPackage className="w-10 h-10 text-white" />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Product Created Successfully</h2>
              <p className="text-gray-600 mb-6">Your product has been saved to your store.</p>
              {successData ? <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6"><h3 className="font-semibold text-green-800 mb-2">Product Details</h3><div className="text-sm text-green-700 space-y-1"><p><span className="font-medium">Title:</span> {successData.title}</p><p><span className="font-medium">Price:</span> PKR {successData.price}</p><p><span className="font-medium">Category:</span> {successData.category}</p><p><span className="font-medium">Status:</span> {successData.status}</p></div></div> : null}
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSuccessOK} className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 px-6 rounded-lg font-medium hover:from-green-600 hover:to-emerald-600 transition-all duration-200 flex items-center justify-center space-x-2"><span>OK</span><FiArrowRight className="w-5 h-5" /></motion.button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (sellerId && sellerProfile && !canAddProduct) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-2">
                <FiPackage className="w-6 h-6 text-primary" />
                <span className="text-xl font-bold text-gray-900">Add Product</span>
              </div>
              <button onClick={() => router.push('/seller')} className="text-gray-600 hover:text-gray-900">
                Back to Dashboard
              </button>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-emerald-900">
            <h2 className="text-lg font-semibold">Complete your store setup first</h2>
            <p className="mt-2 text-sm">
              Complete your seller profile in{' '}
              <button
                type="button"
                onClick={() => router.push('/seller/settings?onboarding=1')}
                className="font-semibold underline underline-offset-2"
              >
                Settings
              </button>{' '}
              to start selling smoothly.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2"><FiPackage className="w-6 h-6 text-primary" /><span className="text-xl font-bold text-gray-900">Add Product</span></div>
            <button onClick={() => router.push('/seller')} className="text-gray-600 hover:text-gray-900">Back to Dashboard</button>
          </div>
        </div>
      </header>

      <div className={`mx-auto px-4 sm:px-6 lg:px-8 py-8 ${currentStep === 4 ? 'max-w-6xl' : 'max-w-4xl'}`}>
        <div className="mb-8 w-full max-w-3xl mx-auto px-1"><div className="flex items-center w-full">{steps.map((step, index) => <React.Fragment key={step.number}><div className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-300 ${currentStep >= step.number ? 'border-[#00966D] bg-[#00966D] text-white' : 'border-gray-300 bg-white text-gray-500'}`}>{currentStep > step.number ? <FiPackage className="h-5 w-5" aria-hidden /> : <span className="text-sm font-semibold">{step.number}</span>}</div>{index < steps.length - 1 ? <div className={`mx-1.5 sm:mx-3 h-1 min-w-[1.25rem] flex-1 self-center rounded-full transition-colors duration-500 ease-out ${currentStep > step.number ? 'bg-[#00966D]' : 'bg-gray-200'}`} /> : null}</React.Fragment>)}</div></div>

        <motion.div key={currentStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} className={currentStep === 4 ? 'w-full' : 'bg-white rounded-lg shadow-md p-8'}>
          {/* Keeping structure and behavior while minimizing migration risk */}
          <div className="space-y-6">
            {currentStep === 1 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-2">Detailed Product Title *</label><textarea value={productData.detailedProductTitle} onChange={(e) => handleInputChange('detailedProductTitle', e.target.value.slice(0, MAX_DETAILED_PRODUCT_TITLE_LENGTH))} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary" /><p className="mt-1 text-xs text-gray-500">max {MAX_DETAILED_PRODUCT_TITLE_LENGTH} chars</p></div>
                <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-2">Description *</label><textarea value={productData.description} onChange={(e) => handleInputChange('description', e.target.value)} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Category *</label><select value={productData.category} onChange={(e) => handleInputChange('category', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"><option value="">Select category</option>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">SKU * <FiInfo className="w-4 h-4 text-gray-400" /></label><input type="text" value={productData.sku} onChange={(e) => handleInputChange('sku', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary" /></div>
              </div>
            ) : null}

            {currentStep === 2 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Original Price *</label><input type="number" min={0} step="0.01" value={emptyZero(productData.price)} onChange={(e) => handleInputChange('price', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Discount %</label><input type="number" min={0} max={100} step="0.01" value={emptyZero(productData.discountPercent)} onChange={(e) => handleInputChange('discountPercent', e.target.value === '' ? 0 : Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Stock *</label><input type="number" min={0} value={emptyZero(productData.stock)} onChange={(e) => handleInputChange('stock', e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Tags</label><div className="flex"><input type="text" value={newTag} onChange={(e) => { setNewTag(e.target.value); setTagDraftError(''); }} className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg" /><button type="button" onClick={addTag} className="px-4 py-2 bg-primary text-white rounded-r-lg hover:bg-primary-600"><FiPlus className="w-4 h-4" /></button></div>{tagDraftError ? <p className="text-sm text-red-600 mt-2">{tagDraftError}</p> : null}<div className="flex flex-wrap gap-2 mt-2">{productData.tags.map((tag, index) => <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">{tag}<button onClick={() => removeTag(tag)} className="ml-1 text-primary hover:text-primary-800"><FiX className="w-3 h-3" /></button></span>)}</div></div>
              </div>
            ) : null}

            {currentStep === 3 ? (
              <div className="space-y-6">
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Product photos *</label><div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center"><FiImage className="w-8 h-8 text-gray-400 mx-auto mb-2" /><input type="file" multiple accept="image/*" onChange={(e) => handleImageUpload(e.target.files)} className="hidden" id="productImages" /><label htmlFor="productImages" className="cursor-pointer"><span className="text-primary font-medium">Choose images</span></label></div></div>
                {productData.images.length > 0 ? <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{productData.images.map((file, index) => <div key={index} className="relative"><img src={URL.createObjectURL(file)} alt={`Product ${index + 1}`} className="w-full h-32 object-cover rounded-lg" /><button onClick={() => removeImage(index)} className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"><FiX className="w-4 h-4" /></button></div>)}</div> : null}
              </div>
            ) : null}

            {currentStep === 4 ? (
              <div className="space-y-8">
                <div>
                  <div className="mb-3 flex items-center gap-2"><h3 className="text-lg font-medium text-gray-900">Product Variants</h3><ProductFormHelpTrigger expanded={variantHelpOpen} onToggle={() => setVariantHelpOpen((o) => !o)} srLabel="Variant tips" /></div>
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
                    <div className="lg:pt-1">
                      {variantHelpOpen ? <ProductFormHelpPanel side="left" panelId="variant-help-panel" titleId="variant-help-title" cardTitle="How variants work" onClose={() => setVariantHelpOpen(false)} closeLabel="Close variant tips"><p>Add variant name and comma-separated options, then click Add Variant.</p></ProductFormHelpPanel> : null}
                    </div>
                    <div>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <input type="text" value={newVariantName} onChange={(e) => setNewVariantName(e.target.value.replace(/,/g, ''))} className="rounded-lg border border-gray-300 px-3 py-2" placeholder="Size" />
                        <input type="text" value={newVariantOptionsText} onChange={(e) => setNewVariantOptionsText(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2" placeholder="Small, Medium, Large" />
                        <button type="button" onClick={addVariant} className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary-600">Add Variant</button>
                      </div>
                      {productData.variants.length > 0 ? <div className="space-y-2 mt-4">{productData.variants.map((variant) => <div key={variant.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-3"><div><span className="font-medium">{variant.name}:</span><span className="ml-2 text-gray-600">{variant.options.join(', ')}</span></div><button type="button" onClick={() => removeVariant(variant.id)} className="text-red-500 hover:text-red-700"><FiX className="h-4 w-4" /></button></div>)}</div> : null}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="mb-3 flex items-center gap-2"><h3 className="text-lg font-medium text-gray-900">Product Specifications</h3><ProductFormHelpTrigger expanded={specHelpOpen} onToggle={() => setSpecHelpOpen((o) => !o)} srLabel="Specification tips" /></div>
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
                    <div className="lg:pt-1">
                      {specHelpOpen ? <ProductFormHelpPanel side="left" panelId="spec-help-panel" titleId="spec-help-title" cardTitle="How specifications work" onClose={() => setSpecHelpOpen(false)} closeLabel="Close specification tips"><p>Add one fact per row, then click Add Specification.</p></ProductFormHelpPanel> : null}
                    </div>
                    <div>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <input type="text" value={newSpecification.name} onChange={(e) => setNewSpecification((prev) => ({ ...prev, name: e.target.value.replace(/,/g, '') }))} className="rounded-lg border border-gray-300 px-3 py-2" placeholder="Fabric" />
                        <input type="text" value={newSpecification.value} onChange={(e) => setNewSpecification((prev) => ({ ...prev, value: e.target.value.replace(/,/g, '') }))} className="rounded-lg border border-gray-300 px-3 py-2" placeholder="100% cotton" />
                        <button type="button" onClick={addSpecification} className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary-600">Add Specification</button>
                      </div>
                      {productData.specifications.length > 0 ? <div className="space-y-2 mt-4">{productData.specifications.map((spec, index) => <div key={index} className="flex items-center justify-between rounded-lg bg-gray-50 p-3"><div><span className="font-medium">{spec.name}:</span><span className="ml-2 text-gray-600">{spec.value}</span></div><button type="button" onClick={() => removeSpecification(index)} className="text-red-500 hover:text-red-700"><FiX className="h-4 w-4" /></button></div>)}</div> : null}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {currentStep === 5 ? (
              <div className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-lg"><h3 className="text-lg font-medium text-gray-900 mb-4">Product Summary</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="md:col-span-2"><p className="text-sm text-gray-600">Detailed Product Title</p><p className="font-medium text-sm leading-snug">{productData.detailedProductTitle}</p></div><div><p className="text-sm text-gray-600">Category</p><p className="font-medium">{productData.category}</p></div><div><p className="text-sm text-gray-600">Price</p><p className="font-medium">PKR {productData.price}</p></div><div><p className="text-sm text-gray-600">Stock</p><p className="font-medium">{productData.stock}</p></div><div><p className="text-sm text-gray-600">SKU</p><p className="font-medium">{productData.sku}</p></div></div></div>
              </div>
            ) : null}
          </div>

          <div className="flex justify-between mt-8">
            <button onClick={() => setCurrentStep(currentStep - 1)} disabled={currentStep === 1} className={`px-6 py-2 rounded-lg border ${currentStep === 1 ? 'border-gray-300 text-gray-400 cursor-not-allowed' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>Previous</button>
            {currentStep < 5 ? (
              <button type="button" onClick={handleNextStep} className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center">Next<FiArrowRight className="ml-2" /></button>
            ) : (
              <button onClick={handleSubmit} disabled={isSubmitting} className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center disabled:opacity-50">{isSubmitting ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>Creating Product...</> : <><FiPackage className="mr-2" />Create Product</>}</button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SellerAddProductView;

