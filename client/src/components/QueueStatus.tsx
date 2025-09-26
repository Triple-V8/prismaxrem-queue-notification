import React, { useEffect, useState } from 'react';
import { fetchQueueStatus } from '../services/api';
import { QueueStatus as QueueStatusType } from '../types';

const QueueStatus: React.FC = () => {
    const [queueStatus, setQueueStatus] = useState<QueueStatusType>({ nextUser: null });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const getQueueStatus = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const status = await fetchQueueStatus();
                setQueueStatus(status);
            } catch (err: any) {
                setError('Failed to fetch queue status. Please try again later.');
                console.error('Error fetching queue status:', err);
            } finally {
                setIsLoading(false);
            }
        };

        getQueueStatus();
        
        // Refresh queue status every 30 seconds
        const interval = setInterval(getQueueStatus, 30000);
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
                        Loading queue status...
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
                <div className="queue-status">
                    <h1>🎮 PrismaX AI Queue Status</h1>
                    
                    <div className="queue-info">
                        {queueStatus.nextUser ? (
                            <>
                                <div className="next-user">
                                    Next user in queue:
                                </div>
                                <div className="queue-position">
                                    {queueStatus.nextUser}
                                </div>
                                <div className="status status-active">
                                    Queue Active
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="next-user">
                                    Queue Status
                                </div>
                                <div className="queue-position">
                                    Empty
                                </div>
                                <div className="status status-inactive">
                                    No users in queue
                                </div>
                            </>
                        )}
                    </div>
                    
                    <div className="card" style={{ marginTop: '24px' }}>
                        <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                            🔄 Status updates automatically every 30 seconds
                        </p>
                        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                            Last updated: {new Date().toLocaleTimeString()}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QueueStatus;