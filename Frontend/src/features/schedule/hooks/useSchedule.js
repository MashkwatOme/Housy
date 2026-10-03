import { useState, useCallback } from 'react';
import scheduleService from '../services/schedule.service';

export const useSchedule = () => {
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchMySchedules = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await scheduleService.getMySchedules();
            setSchedules(data.schedules || []);
        } catch (err) {
            setError(err.message || 'Failed to fetch your schedules');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchUnreadCount = useCallback(async () => {
        try {
            const data = await scheduleService.getUnreadStatusCount();
            setUnreadCount(Number(data.unreadCount || 0));
            return Number(data.unreadCount || 0);
        } catch (err) {
            setError(err.message || 'Failed to fetch schedule notifications');
            return 0;
        }
    }, []);

    const markStatusNotificationsRead = useCallback(async () => {
        await scheduleService.markStatusNotificationsRead();
        setUnreadCount(0);
        window.dispatchEvent(new CustomEvent('schedule-notifications-read'));
    }, []);

    const fetchOwnerSchedules = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await scheduleService.getOwnerSchedules();
            setSchedules(data.schedules || []);
        } catch (err) {
            setError(err.message || 'Failed to fetch incoming schedules');
        } finally {
            setLoading(false);
        }
    }, []);

    const createSchedule = useCallback(async (scheduleData) => {
        setLoading(true);
        setError(null);
        try {
            const result = await scheduleService.createSchedule(scheduleData);
            return result;
        } catch (err) {
            setError(err.message || 'Failed to schedule visit');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const updateScheduleStatus = useCallback(async (id, status) => {
        setLoading(true);
        setError(null);
        try {
            const result = await scheduleService.updateScheduleStatus(id, status);
            setSchedules(prev => 
                prev.map(sch => sch.id === id ? { ...sch, status } : sch)
            );
            return result;
        } catch (err) {
            setError(err.message || 'Failed to update schedule status');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        schedules,
        loading,
        error,
        unreadCount,
        fetchMySchedules,
        fetchUnreadCount,
        markStatusNotificationsRead,
        fetchOwnerSchedules,
        createSchedule,
        updateScheduleStatus
    };
};
