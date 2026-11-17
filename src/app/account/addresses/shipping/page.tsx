'use client';

import { useTranslations } from 'next-intl';

export default function EditShippingAddressPage() {
  const t = useTranslations('AccountAddresses');

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 md:p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-8">{t('shipping_address_title')}</h2>
      
      <form className="space-y-6 max-w-3xl">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('first_name')} <span className="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('last_name')} <span className="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('company_name')}
          </label>
          <input 
            type="text" 
            className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('country_region')} <span className="text-red-500">*</span>
          </label>
          <select 
            className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#107b46] focus:border-[#107b46] bg-white text-gray-700"
            required
            defaultValue="DE"
          >
            <option value="">{t('select_country')}</option>
            <option value="DE">Deutschland</option>
            <option value="AT">Österreich</option>
            <option value="CH">Schweiz</option>
            <option value="FR">Frankreich</option>
            <option value="BE">Belgien</option>
            <option value="LU">Luxemburg</option>
            <option value="NL">Niederlande</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('address_1')} <span className="text-red-500">*</span>
          </label>
          <input 
            type="text" 
            placeholder={t('address_1')}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 mb-3"
            required
          />
          <input 
            type="text" 
            placeholder={t('address_2')}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('postal_code')} <span className="text-red-500">*</span>
          </label>
          <input 
            type="text" 
            placeholder={t('postal_code')}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('city')} <span className="text-red-500">*</span>
          </label>
          <input 
            type="text" 
            placeholder={t('city')}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('phone')} <span className="text-red-500">*</span>
          </label>
          <input 
            type="tel" 
            className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
            required
          />
        </div>

        <div className="pt-4">
          <button 
            type="button"
            className="bg-[#107b46] hover:bg-[#0d6338] text-white font-medium py-3 px-6 rounded-md transition-colors shadow-sm"
          >
            {t('save_address')}
          </button>
        </div>
        
      </form>
    </div>
  );
}
