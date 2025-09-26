import React, { useState } from 'react';
import './Footer.css';

const Footer: React.FC = () => {
     const [copiedEth, setCopiedEth] = useState(false);
        const [copiedSol, setCopiedSol] = useState(false);
          const ethAddress = "0x5B6d25947A28B9cBfb1CeF386c28b03f9A885B69";
          const solAddress = "VxEgahsuRzdcXzuNcXnDbD7SjeKej4utdm8xqj7b185";
      
          const copyAddress = async (address: string, type: 'eth' | 'sol') => {
              try {
                  await navigator.clipboard.writeText(address);
                  if (type === 'eth') {
                    setCopiedEth(true);
                    setTimeout(() => setCopiedEth(false), 2000);
                  } else {
                    setCopiedSol(true);
                    setTimeout(() => setCopiedSol(false), 2000);
                  }
              } catch (err) {
                  console.error('Failed to copy address:', err);
                  // Fallback for older browsers
                  const textArea = document.createElement('textarea');
                  textArea.value = address;
                  document.body.appendChild(textArea);
                  textArea.select();
                  document.execCommand('copy');
                  document.body.removeChild(textArea);
                  if (type === 'eth') {
                    setCopiedEth(true);
                    setTimeout(() => setCopiedEth(false), 2000);
                  } else {
                    setCopiedSol(true);
                    setTimeout(() => setCopiedSol(false), 2000);
                  }
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
                            <code className="tip-address" title={ethAddress}>
                                {shortenAddress(ethAddress)}
                            </code>
                            <button 
                                className={`copy-btn ${copiedEth ? 'copied' : ''}`}
                                onClick={() => copyAddress(ethAddress, 'eth')}
                                title="Copy full address"
                            >
                                {copiedEth ? '✓' : '📋'}
                            </button>
                        </div>
                        {copiedEth && (
                            <span className="copy-success">Ethereum address copied to clipboard!</span>
                        )}
                    </div>

                    <div className="tip-address-container" style={{marginTop: '10px'}}>
                        <span className="tip-label">Solana Address:</span>
                        <div className="address-wrapper">
                            <code className="tip-address" title={solAddress}>
                                {shortenAddress(solAddress)}
                            </code>
                            <button 
                                className={`copy-btn ${copiedSol ? 'copied' : ''}`}
                                onClick={() => copyAddress(solAddress, 'sol')}
                                title="Copy full address"
                            >
                                {copiedSol ? '✓' : '📋'}
                            </button>
                        </div>
                        {copiedSol && (
                            <span className="copy-success">Solana address copied to clipboard!</span>
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