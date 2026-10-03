import { useState, useCallback } from 'react';
import { getDashboardStatsApi } from '../service/admin.api';

export const useDashboardStats = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchStats = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            setStats(await getDashboardStatsApi());
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    return { stats, loading, error, refresh: fetchStats };
};
