/**
 * @file maintenance.api.js
 * @description Frontend API wrapper for maintenance request functionality.
 */

const API_URL = '/api/maintenance';

const maintenanceApi = {
    createRequest: async ({ agreementId, category, severity, description }) => {
        const response = await fetch(`${API_URL}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ agreementId, category, severity, description })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to submit maintenance request');
        return data;
    },

    getMyRequests: async () => {
        const response = await fetch(`${API_URL}/tenant`, {
            method: 'GET'
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch maintenance requests');
        return data;
    },

    getOwnerRequests: async () => {
        const response = await fetch(`${API_URL}/owner`, {
            method: 'GET'
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch incoming maintenance requests');
        return data;
    },

    updateStatus: async (requestId, status) => {
        const response = await fetch(`${API_URL}/${requestId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to update maintenance request status');
        return data;
    },

    getUnreadNotificationCount: async () => {
        const response = await fetch(`${API_URL}/owner/unread-count`, {
            method: 'GET'
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch maintenance notifications');
        return data;
    },

    markNotificationsRead: async () => {
        const response = await fetch(`${API_URL}/owner/mark-read`, {
            method: 'PATCH'
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to mark maintenance notifications as read');
        return data;
    }
};

export default maintenanceApi;
