const API_URL = '/api/schedules';

const scheduleService = {
    createSchedule: async (scheduleData) => {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(scheduleData)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to create schedule');
            return data;
        } catch (error) {
            throw error;
        }
    },

    getMySchedules: async () => {
        try {
            const response = await fetch(`${API_URL}/my`, {
                method: 'GET'
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to fetch schedules');
            return data;
        } catch (error) {
            throw error;
        }
    },

    getUnreadStatusCount: async () => {
        const response = await fetch(`${API_URL}/my/unread-count`, {
            method: 'GET'
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch schedule notifications');
        return data;
    },

    markStatusNotificationsRead: async () => {
        const response = await fetch(`${API_URL}/my/mark-status-read`, {
            method: 'PATCH'
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to mark schedule notifications as read');
        return data;
    },

    getOwnerSchedules: async () => {
        try {
            const response = await fetch(`${API_URL}/owner`, {
                method: 'GET'
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to fetch owner schedules');
            return data;
        } catch (error) {
            throw error;
        }
    },

    updateScheduleStatus: async (id, status) => {
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to update schedule status');
            return data;
        } catch (error) {
            throw error;
        }
    }
};

export default scheduleService;
