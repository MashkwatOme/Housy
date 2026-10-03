/**
 * @file usePayments.js
 * @description Custom react hook to manage payment states and interact with payments api.
 */

import { useState, useCallback } from 'react';
import paymentsApi from '../services/payments.api';

export const usePayments = () => {
    const [payments, setPayments] = useState([]);
    const [dues, setDues] = useState([]);
    const [properties, setProperties] = useState([]);
    const [stats, setStats] = useState({
        totalRevenue: 0,
        monthlyRevenue: 0,
        pendingCount: 0,
        failedCount: 0
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchMyPayments = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await paymentsApi.getMyPayments();
            setPayments(data.payments || []);
            setDues(data.dues || []);
        } catch (err) {
            setError(err.message || 'Failed to fetch payments and dues');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchOwnerPayments = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await paymentsApi.getOwnerPayments();
            setPayments(data.payments || []);
            setProperties(data.properties || []);
            setStats(data.stats || {
                totalRevenue: 0,
                monthlyRevenue: 0,
                pendingCount: 0,
                failedCount: 0
            });
        } catch (err) {
            setError(err.message || 'Failed to fetch owner payments dashboard');
        } finally {
            setLoading(false);
        }
    }, []);

    const createCheckoutSession = useCallback(async (agreementId, paymentMonth) => {
        setLoading(true);
        setError(null);
        try {
            const result = await paymentsApi.createCheckoutSession(agreementId, paymentMonth);
            return result;
        } catch (err) {
            setError(err.message || 'Failed to create checkout session');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const createBkashPayment = useCallback(async (agreementId, paymentMonth) => {
        setLoading(true);
        setError(null);
        try {
            const result = await paymentsApi.createBkashPayment(agreementId, paymentMonth);
            return result;
        } catch (err) {
            setError(err.message || 'Failed to initialize bKash payment');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const executeBkashPayment = useCallback(async (paymentId) => {
        setLoading(true);
        setError(null);
        try {
            const result = await paymentsApi.executeBkashPayment(paymentId);
            return result;
        } catch (err) {
            setError(err.message || 'Failed to execute bKash payment');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchPaymentDetails = useCallback(async (paymentId) => {
        setLoading(true);
        setError(null);
        try {
            const result = await paymentsApi.getPaymentDetails(paymentId);
            return result;
        } catch (err) {
            setError(err.message || 'Failed to fetch transaction details');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const recordCashPayment = useCallback(async (agreementId, paymentMonth) => {
        setLoading(true);
        setError(null);
        try {
            const result = await paymentsApi.recordCashPayment(agreementId, paymentMonth);
            return result;
        } catch (err) {
            setError(err.message || 'Failed to record cash payment');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchUnreadCount = useCallback(async () => {
        try {
            const data = await paymentsApi.getUnreadNotificationCount();
            setUnreadCount(Number(data.unreadCount || 0));
            return Number(data.unreadCount || 0);
        } catch (err) {
            setError(err.message || 'Failed to fetch payment notifications');
            return 0;
        }
    }, []);

    const markNotificationsRead = useCallback(async () => {
        await paymentsApi.markNotificationsRead();
        setUnreadCount(0);
        window.dispatchEvent(new CustomEvent('payment-notifications-read'));
    }, []);

    return {
        payments,
        dues,
        properties,
        stats,
        loading,
        error,
        unreadCount,
        fetchMyPayments,
        fetchOwnerPayments,
        createCheckoutSession,
        createBkashPayment,
        executeBkashPayment,
        fetchPaymentDetails,
        recordCashPayment,
        fetchUnreadCount,
        markNotificationsRead
    };
};
