import { useState, useCallback } from 'react';
import agreementApi from '../services/agreement.api';

export const useAgreement = () => {
    const [agreements, setAgreements] = useState([]);
    const [currentAgreement, setCurrentAgreement] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch lists
    const fetchAgreements = useCallback(async (role) => {
        setLoading(true);
        setError(null);
        try {
            let data;
            if (role === 'owner') {
                data = await agreementApi.getOwnerAgreements();
            } else {
                data = await agreementApi.getMyAgreements();
            }
            setAgreements(data.drafts || data.agreements || []);
        } catch (err) {
            setError(err.message || 'Failed to load agreements');
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch single
    const fetchAgreementById = useCallback(async (id) => {
        setLoading(true);
        setError(null);
        try {
            const data = await agreementApi.getAgreementById(id);
            setCurrentAgreement(data.draft || data);
            return data.draft || data;
        } catch (err) {
            setError(err.message || 'Failed to load agreement details');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // Update draft in database
    const updateAgreement = useCallback(async (id, updateData) => {
        setLoading(true);
        setError(null);
        try {
            const data = await agreementApi.updateAgreementDraft(id, updateData);
            // Refresh details in local state
            setCurrentAgreement(prev => prev ? { ...prev, ...updateData, draft_version: (prev.draft_version || 1) + 1 } : null);
            return data;
        } catch (err) {
            setError(err.message || 'Failed to update agreement');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // Send for signature in database
    const sendForSignature = useCallback(async (id) => {
        setLoading(true);
        setError(null);
        try {
            const data = await agreementApi.sendForSignature(id);
            // Update local state status
            setCurrentAgreement(prev => prev ? { ...prev, status: 'pending_signature' } : null);
            return data;
        } catch (err) {
            setError(err.message || 'Failed to send agreement for signature');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // Sign agreement and refresh details
    const signAgreement = useCallback(async (id, signatureUrl) => {
        setLoading(true);
        setError(null);
        try {
            const data = await agreementApi.signAgreement(id, signatureUrl);
            // Re-fetch to get updated signature fields and status from DB
            const updated = await agreementApi.getAgreementById(id);
            setCurrentAgreement(updated.draft || updated);
            return data;
        } catch (err) {
            setError(err.message || 'Failed to sign agreement');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // Download the final signed agreement as a PDF blob.
    // Note: deliberately does NOT touch the shared `error` state above —
    // that state drives the page-level "failed to load" screen, and a
    // download failure should surface as a toast, not blank the whole page.
    const downloadAgreementPdf = useCallback(async (id) => {
        return agreementApi.downloadAgreementPdf(id);
    }, []);

    return {
        agreements,
        currentAgreement,
        setCurrentAgreement,
        loading,
        error,
        fetchAgreements,
        fetchAgreementById,
        updateAgreement,
        sendForSignature,
        signAgreement,
        downloadAgreementPdf
    };
};
