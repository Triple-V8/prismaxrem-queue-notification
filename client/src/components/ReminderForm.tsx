import React, { useState } from 'react';
import { api } from '../services/api';
import './Footer.css';

interface FormData {
  username: string;
  email: string;
  telegramUsername: string;
}

interface FormErrors {
  username?: string;
  email?: string;
  telegramUsername?: string;
  general?: string;
}

const ReminderForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    telegramUsername: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [usernamePattern, setUsernamePattern] = useState('');

    const [copied, setCopied] = useState(false);
      const tipAddress = "0x5B6d25947A28B9cBfb1CeF386c28b03f9A885B69";
  
      const copyAddress = async () => {
          try {
              await navigator.clipboard.writeText(tipAddress);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
          } catch (err) {
              console.error('Failed to copy address:', err);
              // Fallback for older browsers
              const textArea = document.createElement('textarea');
              textArea.value = tipAddress;
              document.body.appendChild(textArea);
              textArea.select();
              document.execCommand('copy');
              document.body.removeChild(textArea);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
          }
      };
  
      const shortenAddress = (address: string) => {
          return `${address.slice(0, 6)}...${address.slice(-4)}`;
      };
  
      

  const generatePattern = (username: string): string => {
    if (username.length < 7) return '';
    return `${username.substring(0, 4)}..${username.substring(username.length - 3)}`;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 7) {
      newErrors.username = 'Username must be at least 7 characters long';
    } else if (formData.username.length > 50) {
      newErrors.username = 'Username must be less than 50 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Validate Telegram username (optional but if provided, must be valid)
    if (formData.telegramUsername.trim()) {
      if (!/^[a-zA-Z0-9_]{5,32}$/.test(formData.telegramUsername.replace('@', ''))) {
        newErrors.telegramUsername = 'Telegram username must be 5-32 characters (letters, numbers, underscore only)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Update username pattern preview
    if (field === 'username') {
      setUsernamePattern(generatePattern(value));
    }

    // Clear errors when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      // Prepare submission data
      const submissionData = {
        username: formData.username,
        email: formData.email.toLowerCase(),
        telegramUsername: formData.telegramUsername.trim() 
          ? formData.telegramUsername.replace('@', '') 
          : undefined
      };
      
      const response = await api.registerUser(submissionData);
      
      if (response.success) {
        setIsSuccess(true);
        setFormData({ username: '', email: '', telegramUsername: '' });
        //setUsernamePattern('');
        
        // Keep success message open until user manually closes it
        // Removed automatic timeout to allow Telegram bot activation
      }
    } catch (error: any) {
      setErrors({
        general: error.response?.data?.error || 'Registration failed. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="container">
        <div className="card fade-in">
          <div className="success-message">
            <h2>Registration Successful!</h2>
            <p>You'll receive email notifications when it's your turn in the queue.</p>
            <p><strong>Your queue pattern:</strong> <code>{usernamePattern}</code></p>
            
            
            {formData.telegramUsername && (
              <div className="telegram-next-steps">
                <div style={{
                  background: '#fff3cd',
                  border: '1px solid #ffc107',
                  borderRadius: '8px',
                  padding: '20px',
                  marginTop: '15px'
                }}>
                  <p style={{margin: '0 0 10px 0', fontSize: '16px', fontWeight: 'bold'}}>
                    🚨 <strong>IMPORTANT: Activate Telegram Notifications!</strong>
                  </p>
                  <p style={{margin: '0 0 15px 0'}}>
                    Click the button below to open the Telegram bot and send any message to activate 
                    <strong> 5 successive notifications</strong> when it's your turn!
                  </p>
                  <button
                    type="button"
                    className="btn btn-telegram"
                    onClick={() => {
                      window.open('https://t.me/Prismaxreminderbot', '_blank', 'noopener,noreferrer');
                    }}
                    style={{
                      background: '#0088cc',
                      color: 'white',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      marginRight: '10px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = '#006699';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = '#0088cc';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    📱 Open @Prismaxreminderbot
                  </button>
                  <p style={{margin: '15px 0 0 0', fontSize: '14px', color: '#666'}}>
                    💡 <strong>Instructions:</strong> After clicking, send any message like "hello" to link your account!
                  </p>
                </div>
              </div>
            )}
             <div className="tip-section">
                    <div className="tip-header">
                        <span className="tip-icon">💰</span>
                        <span className="tip-text">Don't forget to tip us!</span>
                    </div>
                    <div className="tip-address-container">
                        <span className="tip-label">Ethereum Address:</span>
                        <div className="address-wrapper">
                            <code className="tip-address" title={tipAddress}>
                                {shortenAddress(tipAddress)}
                            </code>
                            <button 
                                className={`copy-btn ${copied ? 'copied' : ''}`}
                                onClick={copyAddress}
                                title="Copy full address"
                            >
                                {copied ? '✓' : '📋'}
                            </button>
                        </div>
                        {copied && (
                            <span className="copy-success">Address copied to clipboard!</span>
                        )}
                    </div>
                </div>
            <div style={{
              borderTop: '1px solid #ddd',
              marginTop: '25px',
              paddingTop: '20px',
              textAlign: 'center'
            }}>
              <div className="telegram-button-container" style={{marginTop: '10px'}}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  window.open('https://t.me/Prismaxreminderbot?start=init', '_blank', 'noopener,noreferrer');
                }}
                style={{
                  background: '#0088cc',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                📱 Open Telegram Bot
              </button>
              </div>
              <p style={{margin: '15px 0 15px 0', fontSize: '14px', color: '#666'}}>
               <strong>Tip:</strong> Keep this window open while activating Telegram for easy reference
              
              </p>
              <button 
                onClick={() => setIsSuccess(false)}
                className="btn btn-primary"
                style={{
                  background: '#28a745',
                  color: 'white',
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                ➕ Register Another User
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card fade-in">
        <div className="card-header">
          <h1>Join PrismaX AI Queue Notifications</h1>
          <p>Get notified when it's your turn to teleoperate the robotic arm!</p>
        </div>

      <form onSubmit={handleSubmit} className="registration-form">
        <div className="form-group">
          <label htmlFor="username">
            PrismaX AI Username *
          </label>
          <input
            type="text"
            id="username"
            value={formData.username}
            onChange={(e) => handleInputChange('username', e.target.value)}
            placeholder="Enter your PrismaX AI username"
            className={errors.username ? 'error' : ''}
            disabled={isLoading}
            minLength={7}
            maxLength={50}
          />
          {errors.username && <span className="error-text">{errors.username}</span>}
          {usernamePattern && (
            <div className="pattern-preview">
              <small>Queue pattern: <code>{usernamePattern}</code></small>
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="email">
            Email Address *
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="Enter your email address"
            className={errors.email ? 'error' : ''}
            disabled={isLoading}
          />
          {errors.email && <span className="error-text">{errors.email}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="telegramUsername">
            Telegram Username (Optional)
          </label>
          <input
            type="text"
            id="telegramUsername"
            value={formData.telegramUsername}
            onChange={(e) => handleInputChange('telegramUsername', e.target.value)}
            placeholder="@yourusername (optional)"
            className={errors.telegramUsername ? 'error' : ''}
            disabled={isLoading}
            maxLength={33}
          />
          {errors.telegramUsername && <span className="error-text">{errors.telegramUsername}</span>}
          <div className="telegram-info">
            <small>
               Get instant Telegram notifications! After registering, message our bot 
              <strong> @Prismaxreminderbot</strong> to activate notifications.
            </small>
            <div className="telegram-button-container" style={{marginTop: '10px'}}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  window.open('https://t.me/Prismaxreminderbot', '_blank', 'noopener,noreferrer');
                }}
                style={{
                  background: '#0088cc',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                📱 Open Telegram Bot
              </button>
            </div>
          </div>
        </div>



        {errors.general && (
          <div className="general-error">
            {errors.general}
          </div>
        )}

        <div className="form-actions">
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Registering...' : '🚀 Start Monitoring Queue'}
          </button>
        </div>

        <div className="info-section" style={{ padding: '30px' }}>
          <h3>How it works:</h3>
          <ol>
            <li>Register with your PrismaX AI username and email</li>
            <li>Optionally add your Telegram username for instant notifications</li>
            <li>Our system monitors the queue in real-time</li>
            <li>Get instant email notification when it's your turn</li>
            <li>Telegram users get 5 successive notifications over 2 minutes!</li>
            <li>Never miss your robotic arm session again!</li>
          </ol>
          
          <div className="telegram-section">
            <h3>Telegram Bot Setup:</h3>
            <p>For instant Telegram notifications:</p>
            <ol>
              <li>Add your Telegram username above (optional)</li>
              <li>After registering, find <strong>@Prismaxreminderbot</strong> on Telegram</li>
              <li>Send any message to activate notifications</li>
              <li>Receive 5 instant alerts when it's your turn!</li>
            </ol>
          </div>
        </div>
      </form>
      </div>
    </div>
  );
};

export default ReminderForm;