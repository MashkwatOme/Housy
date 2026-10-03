/**
 * @file payments.api.js
 * @description Frontend API wrapper for payments functionality.
 */

const API_URL = '/api/payments';

const paymentsApi = {
    createCheckoutSession: async (agreementId, paymentMonth) => {
        try {
            const response = await fetch(`${API_URL}/create-checkout-session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agreementId, paymentMonth })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to create Stripe checkout session');
            return data;
        } catch (error) {
            throw error;
        }
    },

    createBkashPayment: async (agreementId, paymentMonth) => {
        try {
            const response = await fetch(`${API_URL}/bkash/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agreementId, paymentMonth })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to create bKash checkout session');
            return data;
        } catch (error) {
            throw error;
        }
    },

    executeBkashPayment: async (paymentId) => {
        try {
            const response = await fetch(`${API_URL}/bkash/execute`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paymentId })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to execute bKash payment');
            return data;
        } catch (error) {
            throw error;
        }
    },

    getMyPayments: async () => {
        try {
            const response = await fetch(`${API_URL}/my-payments`, {
                method: 'GET'
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to fetch payments and dues');
            return data;
        } catch (error) {
            throw error;
        }
    },

    getOwnerPayments: async () => {
        try {
            const response = await fetch(`${API_URL}/owner`, {
                method: 'GET'
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to fetch owner payments dashboard');
            return data;
        } catch (error) {
            throw error;
        }
    },

    getPaymentDetails: async (paymentId) => {
        try {
            const response = await fetch(`${API_URL}/${paymentId}`, {
                method: 'GET'
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to fetch transaction details');
            return data;
        } catch (error) {
            throw error;
        }
    },

    recordCashPayment: async (agreementId, paymentMonth) => {
        try {
            const response = await fetch(`${API_URL}/record-cash`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agreementId, paymentMonth })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to record cash payment');
            return data;
        } catch (error) {
            throw error;
        }
    },

    getUnreadNotificationCount: async () => {
        try {
            const response = await fetch(`${API_URL}/owner/unread-count`, {
                method: 'GET'
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to fetch payment notifications');
            return data;
        } catch (error) {
            throw error;
        }
    },

    markNotificationsRead: async () => {
        try {
            const response = await fetch(`${API_URL}/owner/mark-read`, {
                method: 'PATCH'
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to mark payment notifications as read');
            return data;
        } catch (error) {
            throw error;
        }
    }
};

export default paymentsApi;
