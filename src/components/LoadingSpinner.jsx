import { ThreeDots, TailSpin, Grid, Puff, Rings } from 'react-loader-spinner';

const LoadingSpinner = ({ 
    size = 40, 
    message = 'Loading...', 
    type = 'three-dots',
    color = '#3b82f6',
    height = 80,
    width = 80
}) => {
    const renderSpinner = () => {
        const commonProps = {
            color: color,
            height: height,
            width: width,
            visible: true
        };

        switch (type) {
            case 'three-dots':
                return <ThreeDots {...commonProps} radius="9" />;
            case 'tail-spin':
                return <TailSpin {...commonProps} radius="1" />;
            case 'grid':
                return <Grid {...commonProps} radius="9" />;
            case 'puff':
                return <Puff {...commonProps} radius="1" />;
            case 'rings':
                return <Rings {...commonProps} radius="6" />;
            default:
                return <ThreeDots {...commonProps} radius="9" />;
        }
    };

    return (
        <div className="loading-container">
            <div className="spinner-wrapper">
                {renderSpinner()}
            </div>
            {message && <p className="loading-text">{message}</p>}
            <style>{`
                .loading-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 60px 40px;
                    min-height: 300px;
                    width: 100%;
                    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                    border-radius: 12px;
                }
                .spinner-wrapper {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 20px;
                }
                .loading-text {
                    margin-top: 20px;
                    color: var(--text-muted);
                    font-size: 16px;
                    font-weight: 500;
                    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                    text-align: center;
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: .6; }
                }
            `}</style>
        </div>
    );
};

export default LoadingSpinner;
