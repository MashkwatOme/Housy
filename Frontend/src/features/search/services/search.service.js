import axios from 'axios';

// Ensure the base URL is properly configured. Assuming standard Vite config or relative path
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const searchProperties = async (query, sessionId) => {
    try {
        const response = await axios.post(`${API_URL}/search`, {
            query,
            sessionId
        });
        
        // Handle successful response
        if (response.data && response.data.success) {
            return {
                properties: response.data.properties || [],
                nearbyPlaces: response.data.nearbyPlaces || [],
                categoryType: response.data.categoryType || null,
            };
        }

        return { properties: [], nearbyPlaces: [], categoryType: null };
    } catch (error) {
        console.error('Error fetching search properties:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch search results. Please try again.');
    }
};
