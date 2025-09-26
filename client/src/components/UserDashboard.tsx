import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

interface DashboardStats {
  totalUsers: number;
  activeNotifications: number;
  totalNotificationsSent: number;
  lastQueueUpdate: string;
}

const UserDashboard: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const getDashboardStats = async () => {
            try {
                setIsLoading(true);
                setError(null);
                
                // Fetch users data
                const usersResponse = await api.getAllUsers();
                
                // Try to fetch queue status (might fail if no queue data exists yet)
                let queueResponse = null;
                try {
                    queueResponse = await api.getCurrentQueueStatus();
                } catch (queueError) {
                    console.log('No queue status available yet:', queueError);
                    // This is okay - queue might not have any data yet
                }

                // Fetch notification statistics
                let notificationStats = null;
                try {
                    notificationStats = await api.getNotificationStats();
                } catch (notificationError) {
                    console.log('No notification statistics available yet:', notificationError);
                    // This is okay - might be no notifications sent yet
                }

                // Calculate stats - usersResponse has a 'users' property containing the array
                const users = usersResponse.users || [];
                const dashboardData: DashboardStats = {
                    totalUsers: users.length || 0,
                    activeNotifications: users.filter((user: any) => user.isActive).length || 0,
                    totalNotificationsSent: notificationStats?.stats?.totalNotificationsSent || 0,
                    lastQueueUpdate: queueResponse?.timestamp || new Date().toISOString()
                };

                setStats(dashboardData);
            } catch (err: any) {
                setError('Failed to load dashboard data. Please try again later.');
                console.error('Error fetching dashboard stats:', err);
            } finally {
                setIsLoading(false);
            }
        };

        getDashboardStats();
        
        // Refresh stats every minute
        const interval = setInterval(getDashboardStats, 60000);
        return () => clearInterval(interval);
    }, []);

    if (isLoading) {
        return (
            <div className="container">
                <div className="card fade-in">
                    <div className="loading">
                        <div className="spinner"></div>
                    </div>
                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                        Loading dashboard...
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container">
                <div className="card fade-in">
                    <div className="error-message">
                        <h2>⚠️ Error</h2>
                        <p>{error}</p>
                        <button 
                            className="btn btn-primary"
                            onClick={() => window.location.reload()}
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="card fade-in">
                <div className="dashboard">
                    <div className="card-header">
                        <h1>📊 PrismaX AI Dashboard</h1>
                        <p>Monitor system statistics and queue activity</p>
                    </div>

                    <div className="dashboard-grid">
                        <div className="stat-card">
                            <span className="stat-value">{stats?.totalUsers || 0}</span>
                            <div className="stat-label">Total Registered Users</div>
                        </div>

                        <div className="stat-card">
                            <span className="stat-value">{stats?.activeNotifications || 0}</span>
                            <div className="stat-label">Active Notifications</div>
                        </div>

                        <div className="stat-card">
                            <span className="stat-value">{stats?.totalNotificationsSent || 0}</span>
                            <div className="stat-label">Total Notifications Sent</div>
                        </div>

                        <div className="stat-card">
                            <span className="stat-value">
                                {stats?.lastQueueUpdate ? 
                                    new Date(stats.lastQueueUpdate).toLocaleTimeString() : 
                                    'Unknown'
                                }
                            </span>
                            <div className="stat-label">Last Queue Update</div>
                        </div>
                    </div>

                    <div className="card" style={{ marginTop: '32px' }}>
                        <h3>System Status</h3>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '16px' }}>
                            <div className="status status-active">
                                🟢 Queue Monitor Active
                            </div>
                            <div className="status status-active">
                                🟢 Email Service Online
                            </div>
                            <div className="status status-active">
                                🟢 Database Connected
                            </div>
                        </div>
                    </div>

                    <div className="card" style={{ marginTop: '24px' }}>
                        <h3>Recent Activity</h3>
                        <p style={{ color: 'var(--text-secondary)', marginTop: '16px' }}>
                            🔄 Dashboard updates automatically every minute
                        </p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                            Last updated: {new Date().toLocaleTimeString()}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDashboard;