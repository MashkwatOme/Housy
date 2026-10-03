/**
 * @file useMaintenance.js
 * @description Custom react hook to manage maintenance request state and interact with the maintenance api.
 */

import { useState, useCallback } from 'react';
import maintenanceApi from '../services/maintenance.api';

export const useMaintenance = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchMyRequests = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await maintenanceApi.getMyRequests();
            setRequests(data.requests || []);
        } catch (err) {
            setError(err.message || 'Failed to fetch maintenance requests');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchOwnerRequests = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await maintenanceApi.getOwnerRequests();
            setRequests(data.requests || []);
        } catch (err) {
            setError(err.message || 'Failed to fetch incoming maintenance requests');
        } finally {
            setLoading(false);
        }
    }, []);

    const createRequest = useCallback(async ({ agreementId, category, severity, description }) => {
        setLoading(true);
        setError(null);
        try {
            const created = await maintenanceApi.createRequest({ agreementId, category, severity, description });
            return created;
        } catch (err) {
            setError(err.message || 'Failed to submit maintenance request');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const updateStatus = useCallback(async (requestId, status) => {
        setError(null);
        try {
            const updated = await maintenanceApi.updateStatus(requestId, status);
            setRequests((prev) => prev.map((r) => (r.id === requestId ? updated : r)));
            return updated;
        } catch (err) {
            setError(err.message || 'Failed to update maintenance request status');
            throw err;
        }
    }, []);

    const fetchUnreadCount = useCallback(async () => {
        try {
            const data = await maintenanceApi.getUnreadNotificationCount();
            setUnreadCount(Number(data.unreadCount || 0));
            return Number(data.unreadCount || 0);
        } catch (err) {
            setError(err.message || 'Failed to fetch maintenance notifications');
            return 0;
        }
    }, []);

    const markNotificationsRead = useCallback(async () => {
        await maintenanceApi.markNotificationsRead();
        setUnreadCount(0);
        window.dispatchEvent(new CustomEvent('maintenance-notifications-read'));
    }, []);

    return {
        requests,
        loading,
        error,
        unreadCount,
        fetchMyRequests,
        fetchOwnerRequests,
        createRequest,
        updateStatus,
        fetchUnreadCount,
        markNotificationsRead
    };
};
