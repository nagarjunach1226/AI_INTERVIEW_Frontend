const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api/v1';

export const register = async (userData) => {
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      // FastAPI returns 'detail' for errors
      throw new Error(errorData.detail || 'Registration failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

export const login = async (credentials) => {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json();
      // FastAPI returns 'detail' for errors
      throw new Error(errorData.detail || 'Login failed');
    }

    const data = await response.json();

    // The backend does not return a token, so don't store it
    // If you add JWT support, you can store the token here

    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const logout = () => {
  // No token to remove, but keep for future JWT support
  localStorage.removeItem('authToken');
};

export const getToken = () => {
  // No token is stored, return null
  return null;
};

export const isAuthenticated = () => {
  // No token, always return false
  return false;
};