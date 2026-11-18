import { requireAdminPage } from '@/lib/auth';
import ProductForm from '@/components/admin/ProductForm';

export default async function NewProductPage() {
  await requireAdminPage();
  return <ProductForm />;
}
