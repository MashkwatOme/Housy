import { useState, useCallback } from 'react';
import { getPendingUsersApi, approveUserApi, rejectUserApi } from '../service/admin.api';
import toast from 'react-hot-toast';

export const useAdmin = () => {
    const [pendingUsers, setPendingUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchPendingUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getPendingUsersApi();
            setPendingUsers((data && data.users) ? data.users : []);
        } catch (err) {
            setError(err.message);
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const approveUser = async (userId) => {
        try {
            await approveUserApi(userId);
            toast.success('User approved successfully');
            setPendingUsers(prev => prev.filter(user => user.id !== userId));
        } catch (err) {
            toast.error(err.message);
        }
    };

    const rejectUser = async (userId) => {
        try {
            await rejectUserApi(userId);
            toast.success('User rejected successfully');
            setPendingUsers(prev => prev.filter(user => user.id !== userId));
        } catch (err) {
            toast.error(err.message);
        }
    };

    return {
        pendingUsers,
        loading,
        error,
        fetchPendingUsers,
        approveUser,
        rejectUser
    };
};
