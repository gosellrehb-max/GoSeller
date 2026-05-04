import AdminShell from '@/components/AdminShell';
import FeaturedProductsManager from '@/features/products/components/FeaturedProductsManager';

export default function ProductsPage() {
  return (
    <AdminShell>
      <FeaturedProductsManager />
    </AdminShell>
  );
}
