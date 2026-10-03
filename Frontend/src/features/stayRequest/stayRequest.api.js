const API_URL = '/api/stay-request';

const stayRequestApi = {
    createStayRequest: async (requestData) => {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to create stay request');
            return data;
        } catch (error) {
            throw error;
        }
    },

    getMyStayRequests: async () => {
        try {
            const response = await fetch(`${API_URL}/my`, {
                method: 'GET'
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to fetch stay requests');
            return data;
        } catch (error) {
            throw error;
        }
    },

    getOwnerStayRequests: async () => {
        try {
            const response = await fetch(`${API_URL}/owner`, {
                method: 'GET'
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to fetch owner stay requests');
            return data;
        } catch (error) {
            throw error;
        }
    },

    updateStayRequestStatus: async (id, status) => {
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to update stay request status');
            return data;
        } catch (error) {
            throw error;
        }
    }
};

export default stayRequestApi;
