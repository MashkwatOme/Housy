import { useState, useCallback } from 'react';
import stayRequestApi from '../stayRequest.api';

export const useStayRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchMyRequests = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await stayRequestApi.getMyStayRequests();
            setRequests(data.requests || []);
        } catch (err) {
            setError(err.message || 'Failed to fetch your stay requests');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchOwnerRequests = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await stayRequestApi.getOwnerStayRequests();
            setRequests(data.requests || []);
        } catch (err) {
            setError(err.message || 'Failed to fetch incoming stay requests');
        } finally {
            setLoading(false);
        }
    }, []);

    const updateRequestStatus = useCallback(async (id, status) => {
        setLoading(true);
        setError(null);
        try {
            const result = await stayRequestApi.updateStayRequestStatus(id, status);
            // After successful update, we can update the request in local state
            setRequests(prev => 
                prev.map(req => req.id === id ? { ...req, status } : req)
            );
            return result;
        } catch (err) {
            setError(err.message || 'Failed to update stay request status');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const createRequest = useCallback(async (requestData) => {
        setLoading(true);
        setError(null);
        try {
            const result = await stayRequestApi.createStayRequest(requestData);
            return result;
        } catch (err) {
            setError(err.message || 'Failed to submit stay request');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        requests,
        loading,
        error,
        fetchMyRequests,
        fetchOwnerRequests,
        updateRequestStatus,
        createRequest
    };
};
