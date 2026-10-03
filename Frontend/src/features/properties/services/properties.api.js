const API_URL = '/api/properties';

const propertiesApi = {
    createProperty: async (propertyData) => {
        console.log(propertyData.amenities)
        try {
            // Because we include files, we must wrap propertyData in FormData
            // If the user already sends an object with files array, we encode it here.
            const formData = new FormData();
            
            Object.entries(propertyData).forEach(([key, value]) => {
                if (key === 'files' && Array.isArray(value)) {
                    value.forEach(file => formData.append('property_images', file));
                } else if (key === 'amenities' && Array.isArray(value)) {
                    formData.append(key, JSON.stringify(value));
                } else if (key === 'walkthrough_video' && value instanceof File) {
                    formData.append('walkthrough_video', value);
                } else if (key === 'walkthrough_markers' && Array.isArray(value)) {
                    formData.append(key, JSON.stringify(value));
                } else if (key === 'tour_config' && Array.isArray(value)) {
                    formData.append(key, JSON.stringify(value));
                } else if (key === 'existing_walkthrough' || key === 'existing_images' || key === 'removed_images' || key === 'remove_walkthrough_video') {
                    // UI-only fields are not part of property creation.
                } else if (key === 'local_area') {
                    formData.append('area', value);
                } else if (key === 'area') {
                    // Map frontend 'area' (property size, sqft) to DB column 'property_size_sqft'
                    if (value !== null && value !== '') formData.append('property_size_sqft', value);
                } else if (value !== null && value !== '') {
                    formData.append(key, value);
                }
            });

            const response = await fetch(API_URL, {
                method: 'POST',
                body: formData // No Content-Type header so browser can set boundary automatically
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to create property');
            return data;
        } catch (error) {
            throw error;
        }
    },

    getOwnerProperties: async () => {
        try {
            const response = await fetch(`${API_URL}/my-properties`, {
                method: 'GET'
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to fetch properties');
            return data;
        } catch (error) {
            throw error;
        }
    },

    getAllProperties: async (filters = {}) => {
        try {
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    if (Array.isArray(value)) {
                        params.append(key, JSON.stringify(value));
                    } else {
                        params.append(key, value);
                    }
                }
            });

            const queryString = params.toString();
            const url = queryString ? `/api/properties-filter?${queryString}` : '/api/properties-filter';

            const response = await fetch(url, {
                method: 'GET'
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to fetch properties');
            return data;
        } catch (error) {
            throw error;
        }
    },

    getPropertyById: async (id) => {
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'GET'
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to fetch property details');
            return data;
        } catch (error) {
            throw error;
        }
    },

    editProperty: async (id, propertyData) => {
        try {
            const formData = new FormData();
            
            Object.entries(propertyData).forEach(([key, value]) => {
                if (key === 'files' && Array.isArray(value)) {
                    value.forEach(file => {
                        if (file instanceof File) {
                            formData.append('property_images', file);
                        }
                    });
                } else if (key === 'amenities' && Array.isArray(value)) {
                    formData.append(key, JSON.stringify(value));
                } else if (key === 'removed_images' && Array.isArray(value)) {
                    formData.append(key, JSON.stringify(value));
                } else if (key === 'walkthrough_video' && value instanceof File) {
                    formData.append('walkthrough_video', value);
                } else if (key === 'walkthrough_markers' && Array.isArray(value)) {
                    formData.append(key, JSON.stringify(value));
                } else if (key === 'tour_config' && Array.isArray(value)) {
                    formData.append(key, JSON.stringify(value));
                } else if (key === 'existing_walkthrough' || key === 'existing_images') {
                    // UI-only fields are not persisted directly.
                } else if (key === 'local_area') {
                    formData.append('area', value);
                } else if (key === 'area') {
                    if (value !== null && value !== '') formData.append('property_size_sqft', value);
                } else if (value !== null && value !== '') {
                    formData.append(key, value);
                }
            });

            const response = await fetch(`${API_URL}/${id}`, {
                method: 'PATCH',
                body: formData
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to update property');
            return data;
        } catch (error) {
            throw error;
        }
    },

    deleteProperty: async (id) => {
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to delete property');
            return data;
        } catch (error) {
            throw error;
        }
    },

    getAmenities: async () => {
        try {
            const response = await fetch('/api/properties-filter/amenities', {
                method: 'GET'
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to fetch amenities');
            return data.amenities || [];
        } catch (error) {
            throw error;
        }
    }
};

export default propertiesApi;
