// import axios from 'axios';

// const api = axios.create({
//   baseURL: process.env.REACT_APP_API_URL || '',
//   headers: {
//     'Content-Type': 'application/json'
//   }
// });

// // Add token to header if it exists
// const token = localStorage.getItem('token');
// if (token) {
//   api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
// }

// // Response interceptor for handling errors
// api.interceptors.response.use(
//   response => response,
//   error => {
//     // Handle session expiration (401 unauthorized)
//     if (error.response && error.response.status === 401) {
//       localStorage.removeItem('token');
//       delete api.defaults.headers.common['Authorization'];
      
//       // Redirect to login if not already there
//       if (!window.location.pathname.includes('/login')) {
//         window.location.href = '/login';
//       }
//     }
//     return Promise.reject(error);
//   }
// );

// export default api;
// Check your api.js file and update it like this:
// import axios from 'axios';

// // Create an axios instance with the proper base URL
// const api = axios.create({
//   baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
//   // or if you're using a different API URL:
//   // baseURL: process.env.REACT_APP_API_URL || '/api',
//   headers: {
//     'Content-Type': 'application/json'
//   }
// });

// // Add request interceptor to include auth token
// api.interceptors.request.use(
//   config => {
//     const token = localStorage.getItem('token');
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   error => Promise.reject(error)
// );

// // Add response interceptor for error handling
// api.interceptors.response.use(
//   response => response,
//   error => {
//     // Handle session expiration or unauthorized access
//     if (error.response && error.response.status === 401) {
//       // Clear local storage and redirect to login
//       localStorage.removeItem('token');
//       window.location.href = '/login';
//     }
//     return Promise.reject(error);
//   }
// );

// export default api;
// src/utils/api.js
// import axios from 'axios';

// // Create axios instance with base URL
// const api = axios.create({
//   baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
//   headers: {
//     'Content-Type': 'application/json'
//   },
//   timeout: 10000 // 10 seconds timeout
// });

// // Add request interceptor to add token to all requests
// api.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('token');
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// // Add response interceptor to handle common errors
// api.interceptors.response.use(
//   (response) => {
//     return response;
//   },
//   (error) => {
//     // Handle network errors
//     if (!error.response) {
//       console.error('Network Error:', error);
//       return Promise.reject({
//         response: {
//           data: {
//             error: 'Network Error: Cannot connect to server. Please check your connection and try again.'
//           }
//         }
//       });
//     }

//     // Handle token expiration
//     if (error.response.status === 401) {
//       // Check if error is due to expired token
//       if (error.response.data.error === 'Token expired') {
//         localStorage.removeItem('token');
//         window.location.href = '/login?expired=true';
//       }
//     }

//     return Promise.reject(error);
//   }
// );

// export default api;
import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000 // 10 seconds timeout
});

// Add request interceptor with better logging
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle network errors
    if (!error.response) {
      console.error('Network Error Details:', {
        message: error.message,
        code: error.code,
        config: error.config ? {
          url: error.config.url,
          method: error.config.method,
          baseURL: error.config.baseURL
        } : 'No config'
      });
      
      return Promise.reject({
        response: {
          data: {
            error: `Network Error: Cannot connect to server (${error.message}). Please check your connection and try again.`
          }
        }
      });
    }

    // Handle token expiration
    if (error.response.status === 401) {
      // Check if error is due to expired token
      if (error.response.data.error === 'Token expired') {
        localStorage.removeItem('token');
        window.location.href = '/login?expired=true';
      }
    }

    return Promise.reject(error);
  }
);

export default api;