"use client"
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  FiPlus, FiEdit, FiTrash2, FiEye, FiSearch, FiFilter, FiDownload, FiCheck, FiPackage, FiDollarSign, FiAlertCircle
} from 'react-icons/fi';
import { getSellerIdFromSession } from '@/features/dashboard/utils/sellerSession';
import {
  bulkUpdateProductStatus,
  deleteManagedProduct,
  getManagedProducts,
  getSellerStats,
} from '@/features/dashboard/api/productManagement';
import { dashboardQueryKeys } from '@/features/dashboard/queries/queryKeys';
import { resolveProductPrimaryImage } from '@/utils/productImageUrl';

interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  status: 'active' | 'inactive' | 'draft' | 'archived';
  images: string[];
  sku: string;
  createdAt: string;
}

interface ProductStats {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  draftProducts: number;
  totalStock: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  averagePrice: number;
  totalValue: number;
}

const ProductManagementView: React.FC = () => {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<ProductStats | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [filters, setFilters] = useState({ status: '', category: '', search: '', minPrice: '', maxPrice: '', inStock: '' });
  const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0, limit: 20 });
  const [showFilters, setShowFilters] = useState(false);
  const [bulkAction, setBulkAction] = useState('');
  const filtersKey = JSON.stringify(filters);

  const sellerId = getSellerIdFromSession();
  const { data: managedData, isLoading: loading, refetch: refetchProducts } = useQuery({
    queryKey: dashboardQueryKeys.seller.managedProducts(
      sellerId ?? '',
      pagination.current,
      pagination.limit,
      filtersKey,
    ),
    enabled: Boolean(sellerId),
    queryFn: async () => getManagedProducts({ sellerId: sellerId as string, pagination, filters }),
  });
  const { data: statsData, refetch: refetchStats } = useQuery({
    queryKey: dashboardQueryKeys.seller.managementStats(sellerId ?? ''),
    enabled: Boolean(sellerId),
    queryFn: getSellerStats,
  });
  useEffect(() => {
    if (!managedData) return;
    setProducts(managedData.products);
    const p = managedData.pagination;
    if (p) {
      setPagination(prev => ({
        ...prev,
        ...p,
        current: p.current ?? prev.current,
        pages: p.pages ?? prev.pages,
        total: p.total ?? prev.total,
        limit: p.limit ?? prev.limit,
      }));
    }
  }, [managedData]);
  useEffect(() => {
    if (!statsData) return;
    setStats({ totalProducts: statsData.productCount ?? 0, activeProducts: statsData.productCount ?? 0, inactiveProducts: 0, draftProducts: 0, totalStock: 0, lowStockProducts: 0, outOfStockProducts: 0, averagePrice: 0, totalValue: 0 });
  }, [statsData]);
  const bulkMutation = useMutation({
    mutationFn: bulkUpdateProductStatus,
  });
  const deleteMutation = useMutation({
    mutationFn: deleteManagedProduct,
  });

  const handleBulkAction = async () => {
    if (!bulkAction || selectedProducts.length === 0 || !sellerId) return;
    try {
      await bulkMutation.mutateAsync({ productIds: selectedProducts, status: bulkAction });
      setSelectedProducts([]);
      setBulkAction('');
      await Promise.all([refetchProducts(), refetchStats()]);
    } catch {}
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteMutation.mutateAsync(productId);
      await Promise.all([refetchProducts(), refetchStats()]);
    } catch {}
  };

  const handleExport = async () => {
    if (products.length === 0) return;
    const headers = ['Title', 'SKU', 'Category', 'Price', 'Stock', 'Status'];
    const rows = products.map(p => [(p.title || '').replace(/"/g, '""'), p.sku || '', p.category || '', p.price ?? '', p.stock ?? '', p.status || ''].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const toggleProductSelection = (productId: string) => setSelectedProducts(prev => prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]);
  const toggleAllProducts = () => setSelectedProducts(selectedProducts.length === products.length ? [] : products.map(p => p._id));

  if (!sellerId) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2><p className="text-gray-600">Please log in as a seller to access this page.</p></div></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4"><div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-gray-900">Product Management</h1><p className="text-gray-600">Manage your products, inventory, and pricing</p></div><div className="flex space-x-3"><button onClick={() => router.push('/seller/addProduct')} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors flex items-center space-x-2"><FiPlus className="w-4 h-4" /><span>Add Product</span></button><button onClick={handleExport} className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"><FiDownload className="w-4 h-4" /><span>Export</span></button></div></div></div></header>
      {stats ? <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"><motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-lg shadow p-6"><div className="flex items-center"><div className="p-2 bg-blue-100 rounded-lg"><FiPackage className="w-6 h-6 text-blue-600" /></div><div className="ml-4"><p className="text-sm font-medium text-gray-600">Total Products</p><p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p></div></div></motion.div><motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-lg shadow p-6"><div className="flex items-center"><div className="p-2 bg-green-100 rounded-lg"><FiCheck className="w-6 h-6 text-green-600" /></div><div className="ml-4"><p className="text-sm font-medium text-gray-600">Active Products</p><p className="text-2xl font-bold text-gray-900">{stats.activeProducts}</p></div></div></motion.div><motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-lg shadow p-6"><div className="flex items-center"><div className="p-2 bg-primary-100 rounded-lg"><FiAlertCircle className="w-6 h-6 text-primary" /></div><div className="ml-4"><p className="text-sm font-medium text-gray-600">Low Stock</p><p className="text-2xl font-bold text-gray-900">{stats.lowStockProducts}</p></div></div></motion.div><motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-lg shadow p-6"><div className="flex items-center"><div className="p-2 bg-primary-100 rounded-lg"><FiDollarSign className="w-6 h-6 text-primary" /></div><div className="ml-4"><p className="text-sm font-medium text-gray-600">Total Value</p><p className="text-2xl font-bold text-gray-900">${stats.totalValue?.toFixed(2) || '0'}</p></div></div></motion.div></div></div> : null}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4"><div className="bg-white rounded-lg shadow p-6"><div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0"><div className="flex-1 max-w-md"><div className="relative"><FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" /><input type="text" placeholder="Search products..." value={filters.search} onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" /></div></div><button onClick={() => setShowFilters(!showFilters)} className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"><FiFilter className="w-4 h-4" /><span>Filters</span></button></div>{showFilters ? <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 pt-4 border-t border-gray-200"><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"><select value={filters.status} onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"><option value="">All Status</option><option value="active">Active</option><option value="inactive">Inactive</option><option value="draft">Draft</option><option value="archived">Archived</option></select><select value={filters.category} onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"><option value="">All Categories</option><option value="Electronics">Electronics</option><option value="Fashion">Fashion</option><option value="Home">Home</option><option value="Beauty">Beauty</option><option value="Sports">Sports</option><option value="Books">Books</option><option value="Automotive">Automotive</option><option value="Health">Health</option><option value="Other">Other</option></select><input type="number" placeholder="Min Price" value={filters.minPrice} onChange={(e) => setFilters(prev => ({ ...prev, minPrice: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent" /><input type="number" placeholder="Max Price" value={filters.maxPrice} onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent" /></div></motion.div> : null}</div></div>
      {selectedProducts.length > 0 ? <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4"><div className="bg-blue-50 border border-blue-200 rounded-lg p-4"><div className="flex items-center justify-between"><div className="flex items-center space-x-4"><span className="text-sm text-blue-800">{selectedProducts.length} product(s) selected</span><select value={bulkAction} onChange={(e) => setBulkAction(e.target.value)} className="border border-blue-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"><option value="">Select Action</option><option value="active">Activate</option><option value="inactive">Deactivate</option><option value="draft">Move to Draft</option><option value="archived">Archive</option></select><button onClick={handleBulkAction} disabled={!bulkAction} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm">Apply</button></div><button onClick={() => setSelectedProducts([])} className="text-blue-600 hover:text-blue-800 text-sm">Clear Selection</button></div></div></div> : null}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4"><div className="bg-white rounded-lg shadow overflow-hidden">{loading ? <div className="p-8 text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div><p className="mt-4 text-gray-600">Loading products...</p></div> : <><div className="overflow-x-auto"><table className="min-w-full divide-y divide-gray-200"><thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><input type="checkbox" checked={selectedProducts.length === products.length && products.length > 0} onChange={toggleAllProducts} className="rounded border-gray-300 text-primary focus:ring-primary" /></th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th></tr></thead><tbody className="bg-white divide-y divide-gray-200">{products.map((product) => <tr key={product._id} className="hover:bg-gray-50"><td className="px-6 py-4 whitespace-nowrap"><input type="checkbox" checked={selectedProducts.includes(product._id)} onChange={() => toggleProductSelection(product._id)} className="rounded border-gray-300 text-primary focus:ring-primary" /></td><td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center"><div className="flex-shrink-0 h-10 w-10"><img className="h-10 w-10 rounded-lg object-cover" src={resolveProductPrimaryImage(product)} alt={product.title} /></div><div className="ml-4"><div className="text-sm font-medium text-gray-900">{product.title}</div><div className="text-sm text-gray-500">{product.sku}</div></div></div></td><td className="px-6 py-4 whitespace-nowrap"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{product.category}</span></td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${product.price}</td><td className="px-6 py-4 whitespace-nowrap"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.stock === 0 ? 'bg-red-100 text-red-800' : product.stock <= 10 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>{product.stock}</span></td><td className="px-6 py-4 whitespace-nowrap"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.status === 'active' ? 'bg-green-100 text-green-800' : product.status === 'inactive' ? 'bg-red-100 text-red-800' : product.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>{product.status}</span></td><td className="px-6 py-4 whitespace-nowrap text-sm font-medium"><div className="flex space-x-2"><button onClick={() => router.push(`/edit-product/${product._id}`)} className="text-blue-600 hover:text-blue-900"><FiEdit className="w-4 h-4" /></button><button onClick={() => router.push(`/product/${product._id}`)} className="text-green-600 hover:text-green-900"><FiEye className="w-4 h-4" /></button><button onClick={() => handleDeleteProduct(product._id)} className="text-red-600 hover:text-red-900"><FiTrash2 className="w-4 h-4" /></button></div></td></tr>)}</tbody></table></div>{pagination.pages > 1 ? <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6"><div className="flex-1 flex justify-between sm:hidden"><button onClick={() => setPagination(prev => ({ ...prev, current: prev.current - 1 }))} disabled={pagination.current === 1} className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Previous</button><button onClick={() => setPagination(prev => ({ ...prev, current: prev.current + 1 }))} disabled={pagination.current === pagination.pages} className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Next</button></div><div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between"><div><p className="text-sm text-gray-700">Showing <span className="font-medium">{((pagination.current - 1) * pagination.limit) + 1}</span> to <span className="font-medium">{Math.min(pagination.current * pagination.limit, pagination.total)}</span> of <span className="font-medium">{pagination.total}</span> results</p></div><div><nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">{Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => <button key={page} onClick={() => setPagination(prev => ({ ...prev, current: page }))} className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${page === pagination.current ? 'z-10 bg-primary-50 border-primary text-primary' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`}>{page}</button>)}</nav></div></div></div> : null}</>}</div></div>
    </div>
  );
};

export default ProductManagementView;

