import axios from 'axios';

// We use a raw axios instance here to prevent circular dependencies or interceptor loops
// since api.js relies on useTenantStore, and this service populates useTenantStore.
const tenantService = {
    fetchTenantConfig: async (subdomain) => {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
        try {
            const response = await axios.get(`${API_URL}/tenant/config?tenant=${subdomain}`);
            return response.data;
        } catch (error) {
            console.error("Failed to fetch tenant configuration:", error);
            throw error;
        }
    }
};

export default tenantService;
