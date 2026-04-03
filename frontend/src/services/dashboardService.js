const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const dashboardService = {
    getHospitalDashboard: async (id, token) => {
        const response = await fetch(`${API_URL}/dashboard/hospital/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    },

    getDoctorDashboard: async (id, token) => {
        const response = await fetch(`${API_URL}/dashboard/doctor/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    },

    getPatientDashboard: async (identifier, token) => {
        const response = await fetch(`${API_URL}/dashboard/patient/${encodeURIComponent(identifier)}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    },

    uploadReport: async (file, token) => {
        const formData = new FormData();
        formData.append('report', file);

        const response = await fetch(`${API_URL}/patient/upload-report`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    },

    getMainInfo: async (token) => {
        const response = await fetch(`${API_URL}/patient/main-info`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    },

    getMainInfoLocation: async (token) => {
        const response = await fetch(`${API_URL}/patient/main-info-location`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    },

    downloadReport: async (reportId, token) => {
        const response = await fetch(`${API_URL}/patient/download-report/${reportId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message);
        }
        return response.blob();
    },

    getPatientReports: async (token) => {
        const response = await fetch(`${API_URL}/patient/reports`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    },

    updatePatientProfile: async (patientId, profileData, token) => {
        const response = await fetch(`${API_URL}/patient/profile/${patientId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(profileData)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to update profile');
        return data;
    },

    searchPatients: async (doctorId, searchQuery, token) => {
        const response = await fetch(`${API_URL}/dashboard/doctor/${doctorId}/search-patients?search=${encodeURIComponent(searchQuery)}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    },

    getDoctorPatients: async (doctorId, token) => {
        const response = await fetch(`${API_URL}/dashboard/doctor/${doctorId}/patients`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    },

    addPatientToDoctor: async (doctorId, patientId, token) => {
        const response = await fetch(`${API_URL}/dashboard/doctor/${doctorId}/patients/${patientId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    }
};

export default dashboardService;
