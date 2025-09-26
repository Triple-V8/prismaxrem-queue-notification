import axios, { AxiosResponse } from 'axios';
import { User, Queue, QueueStatus } from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Configure axios defaults
const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to: ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    console.error('Response error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Types
export interface UserRegistrationData {
  username: string;
  email: string;
  telegramUsername?: string;
}

export interface UserRegistrationResponse {
  success: boolean;
  message: string;
  user: {
    id: number;
    username: string;
    usernamePattern: string;
    email: string;
    isActive: boolean;
    createdAt: string;
    telegramUsername?: string;
  };
}

export interface QueueHistory {
  history: Array<{
    currentUserPattern: string;
    rawContent: string;
    timestamp: string;
  }>;
  count: number;
  limit: number;
  offset: number;
}

// API functions
export const api = {
  // User registration
  async registerUser(userData: UserRegistrationData): Promise<UserRegistrationResponse> {
    try {
      const response = await axiosInstance.post<UserRegistrationResponse>(
        '/users/register', 
        userData
      );
      return { ...response.data, success: true };
    } catch (error: any) {
      console.error('Registration failed:', error);
      throw error;
    }
  },

  // Get all users
  async getAllUsers(): Promise<any> {
    try {
      const response = await axiosInstance.get('/users/all');
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch users:', error);
      throw error;
    }
  },

  // Get user by ID
  async getUserById(id: number): Promise<any> {
    try {
      const response = await axiosInstance.get(`/users/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch user:', error);
      throw error;
    }
  },

  // Find user by pattern
  async findUserByPattern(pattern: string): Promise<any> {
    try {
      const response = await axiosInstance.get(`/users/pattern/${pattern}`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to find user by pattern:', error);
      throw error;
    }
  },

  // Queue management
  async getCurrentQueueStatus(): Promise<QueueStatus> {
    try {
      const response = await axiosInstance.get<QueueStatus>('/queue/current');
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch queue status:', error);
      throw error;
    }
  },

  async getQueueHistory(limit: number = 50, offset: number = 0): Promise<QueueHistory> {
    try {
      const response = await axiosInstance.get<QueueHistory>(
        `/queue/history?limit=${limit}&offset=${offset}`
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch queue history:', error);
      throw error;
    }
  },

  // Admin functions
  async resetNotifications(): Promise<any> {
    try {
      const response = await axiosInstance.post('/queue/reset-notifications');
      return response.data;
    } catch (error: any) {
      console.error('Failed to reset notifications:', error);
      throw error;
    }
  },

  async updateNotificationStatus(userId: number, notified: boolean): Promise<any> {
    try {
      const response = await axiosInstance.patch(`/users/${userId}/notification-status`, {
        notified
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to update notification status:', error);
      throw error;
    }
  },



  // Health check
  async healthCheck(): Promise<any> {
    try {
      const response = await axiosInstance.get('/../../health');
      return response.data;
    } catch (error: any) {
      console.error('Health check failed:', error);
      throw error;
    }
  }
};

// Individual export functions for backward compatibility
export const fetchQueueStatus = async (): Promise<QueueStatus> => {
  return api.getCurrentQueueStatus();
};

export const fetchUserQueueStatus = async (userId?: number): Promise<any> => {
  if (userId) {
    return api.getUserById(userId);
  }
  // If no userId provided, return current queue status
  return api.getCurrentQueueStatus();
};

export default api;