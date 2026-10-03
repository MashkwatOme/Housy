const API_URL = '/api/agreements';

const agreementApi = {
    getMyAgreements: async () => {
        try {
            const response = await fetch(`${API_URL}/my`, {
                method: 'GET'
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to fetch your agreements');
            return data;
        } catch (error) {
            throw error;
        }
    },

    getOwnerAgreements: async () => {
        try {
            const response = await fetch(`${API_URL}/owner`, {
                method: 'GET'
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to fetch owner agreements');
            return data;
        } catch (error) {
            throw error;
        }
    },

    getAgreementById: async (id) => {
        try {
            const response = await fetch(`${API_URL}/drafts/${id}`, {
                method: 'GET'
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to fetch agreement details');
            return data;
        } catch (error) {
            throw error;
        }
    },

    updateAgreementDraft: async (id, draftData) => {
        try {
            const response = await fetch(`${API_URL}/drafts/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(draftData)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to update agreement draft');
            return data;
        } catch (error) {
            throw error;
        }
    },

    sendForSignature: async (id) => {
        try {
            const response = await fetch(`${API_URL}/${id}/send-signature`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to send agreement for signature');
            return data;
        } catch (error) {
            throw error;
        }
    },

    signAgreement: async (id, signatureUrl) => {
        try {
            const response = await fetch(`${API_URL}/${id}/sign`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ signatureUrl })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to sign agreement');
            return data;
        } catch (error) {
            throw error;
        }
    },

    downloadAgreementPdf: async (id) => {
        const response = await fetch(`${API_URL}/${id}/pdf`, {
            method: 'GET'
        });
        if (!response.ok) {
            let message = 'Failed to download agreement PDF';
            try {
                const data = await response.json();
                message = data.message || message;
            } catch (e) {
                // response wasn't JSON, keep default message
            }
            throw new Error(message);
        }
        return response.blob();
    }
};

export default agreementApi;
