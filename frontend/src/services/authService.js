const API_URL = 'http://localhost:5000/api';

export async function createUser(userData) {
    try {
        // Add required fields based on user type
        const { userType } = userData;
        let enrichedData = { ...userData };

        switch(userType?.toLowerCase()) {
            case 'doctor':
                enrichedData = {
                    ...enrichedData,
                    phoneNumber: userData.phoneNumber || '',
                    licenseNumber: userData.licenseNumber || '',
                    specialization: userData.specialization || '',
                };
                break;
            case 'patient':
                enrichedData = {
                    ...enrichedData,
                    phoneNumber: userData.phoneNumber || '',
                    dateOfBirth: userData.dateOfBirth || '',
                    gender: userData.gender || '',
                };
                break;
            case 'hospital':
                enrichedData = {
                    ...enrichedData,
                    phoneNumber: userData.phoneNumber || '',
                    address: userData.address || '',
                    registrationNumber: userData.registrationNumber || `HOSP-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                    type: userData.type || 'private',
                };
                break;
            default:
                // Keep enrichedData as-is for unknown user types
                break;
        }

        const response = await fetch(`${API_URL}/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(enrichedData)
        });
        const data = await response.json();
        if (!data.ok) {
            throw new Error(data.message);
        }
        return data;
    } catch (error) {
        return { ok: false, message: error.message || 'Failed to create account' };
    }
}

export async function login(email, password, userType) {
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password, userType })
        });
        const data = await response.json();
        if (!data.ok) {
            throw new Error(data.message);
        }
        localStorage.setItem('token', data.token);
        localStorage.setItem('userType', data.user.userType);
        localStorage.setItem('dashboardUrl', data.dashboardUrl);
        return data;
    } catch (error) {
        return { ok: false, message: error.message || 'Failed to login' };
    }
}

export async function getUserById(id) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        if (!data.ok) {
            throw new Error(data.message);
        }
        return data;
    } catch (error) {
        return { ok: false, message: error.message || 'Failed to get user' };
    }
}

const authService = {
    createUser,
    login,
    getUserById
};

export default authService;
