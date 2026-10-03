export const getPendingUsersApi = async () => {
    const res = await fetch('/api/admin/pending-users', {
        method: 'GET'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch pending users');
    return data;
};

export const approveUserApi = async (userId) => {
    const res = await fetch(`/api/admin/users/${userId}/approve`, {
        method: 'PATCH'
    });
    if (res.status !== 204 && res.status !== 200) {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || 'Failed to approve user');
        return data;
    }
    return true; // or whatever your backend returns for 204 No Content
};

export const rejectUserApi = async (userId) => {
    const res = await fetch(`/api/admin/users/${userId}/reject`, {
        method: 'PATCH'
    });
    if (res.status !== 204 && res.status !== 200) {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || 'Failed to reject user');
        return data;
    }
    return true;
};


export const getDashboardStatsApi = async () => {
    const res = await fetch('/api/admin/stats', {
        method: 'GET'
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Failed to fetch dashboard stats');
    return data;
};
