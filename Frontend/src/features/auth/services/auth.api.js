export const loginApi = async (email, password) => {
    const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');
    return data;
};

export const registerApi = async (formData) => {
    const res = await fetch('/api/auth/register', {
        method: 'POST',
        body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Registration failed');
    return data;
};

export const getMeApi = async () => {
    const res = await fetch('/api/auth/me', {
        method: 'GET'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Not authenticated');
    return data;
};

export const logoutApi = async () => {
    const res = await fetch('/api/auth/logout', {
        method: 'POST'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Logout failed');
    return data;
};

export const updateProfileApi = async ({ name, email, phone, profilePicture }) => {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('phone', phone);
    if (profilePicture) formData.append('profile_picture', profilePicture);

    const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Profile update failed');
    return data;
};
