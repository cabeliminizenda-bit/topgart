import { requireAdminPage } from '@/lib/auth';
import { getBrands } from '@/actions/admin';
import BrandCreateForm from '@/components/admin/BrandCreateForm';
import BrandTable from '@/components/admin/BrandTable';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Marken verwalten | Top Gartengeräte Admin',
};

export default async function BrandsPage() {
  await requireAdminPage();
  const brands = await getBrands();

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Marken verwalten</h1>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Neue Marke hinzufügen</h2>
        <BrandCreateForm />
      </div>

      <BrandTable brands={brands as any} />
    </div>
  );
}
