import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ size = 40, message = 'Loading...' }) => {
    return (
        <div className="loading-container">
            <div className="spinner-wrapper">
                <Loader2 className="spinner-icon" size={size} />
            </div>
            {message && <p className="loading-text">{message}</p>}
            <style>{`
                .loading-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 40px;
                    min-height: 200px;
                    width: 100%;
                }
                .spinner-wrapper {
                    color: var(--primary-color);
                    animation: spin 1s linear infinite;
                }
                .loading-text {
                    margin-top: 16px;
                    color: var(--text-muted);
                    font-size: 14px;
                    font-weight: 500;
                    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: .5; }
                }
            `}</style>
        </div>
    );
};

export default LoadingSpinner;
