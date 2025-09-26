import React, { useState } from 'react';
import './Footer.css';

const Footer: React.FC = () => {
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

    return (
        <footer className="footer">
            <div className="footer-content">
                {/* Tip Section */}
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

                {/* Made With Love Section */}
                <div className="made-with-love">
                    <span>Made with ❤️ by </span>
                    <strong>3plev.eth</strong>
                </div>

                {/* Additional Info */}
                <div className="footer-info">
                    <span>PrismaX AI Queue Reminder System</span>
                    <span className="separator">•</span>
                    <span>{new Date().getFullYear()}</span>
                </div>
            </div>


        </footer>
    );
};

export default Footer;