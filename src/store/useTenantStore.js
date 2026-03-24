import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useTenantStore = create(
    persist(
        (set) => ({
            tenantId: 'hotel1', // Fallback default
            hotelName: 'Soluxe ERP',
            primaryColor: '#7B1113',
            logoUrl: null,
            isLoading: true,
            
            setTenantConfig: (config) => set({
                tenantId: config.dbKey || 'hotel1',
                hotelName: config.hotelName || 'Soluxe ERP',
                primaryColor: config.primaryColor || '#7B1113',
                logoUrl: config.logoUrl || null,
                isLoading: false
            }),
            
            setLoading: (loading) => set({ isLoading: loading }),
            
            clearTenant: () => set({ 
                tenantId: 'hotel1', 
                hotelName: 'Soluxe ERP', 
                primaryColor: '#7B1113', 
                logoUrl: null,
                isLoading: false 
            })
        }),
        {
            name: 'tenant-storage',
        }
    )
);

export default useTenantStore;
