import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const { login, user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed');
    }
  };

  return (
    <div className="login-container">
      <div className="login-wrapper">
        <div className="login-brand">
          <div className="logo-circle">CG</div>
          <h1>CleanGuard QC</h1>
          <p>Professional Quality Control</p>
        </div>

        <div className="login-card">
          <div className="card-header">
            <h2>Welcome Back</h2>
            <p>Please sign in to your account</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <button type="submit" className="btn btn-block">
              Sign In
            </button>
          </form>
        </div>
      </div>

      <style>{`
        .login-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          padding: 20px;
        }
        .login-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          max-width: 420px;
          gap: 30px;
        }
        .login-brand {
          text-align: center;
        }
        .logo-circle {
          width: 60px;
          height: 60px;
          background: var(--primary-color);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 24px;
          margin: 0 auto 15px;
          box-shadow: var(--shadow-lg);
        }
        .login-brand h1 {
          font-size: 24px;
          color: var(--text-main);
          margin-bottom: 5px;
        }
        .login-brand p {
          color: var(--text-muted);
          font-size: 14px;
        }
        .login-card {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          padding: 40px;
          border-radius: 24px;
          box-shadow: var(--shadow-lg);
          width: 100%;
          border: 1px solid rgba(255, 255, 255, 0.5);
        }
        .card-header {
          text-align: center;
          margin-bottom: 30px;
        }
        .card-header h2 {
          font-size: 20px;
          margin-bottom: 5px;
        }
        .card-header p {
          color: var(--text-muted);
          font-size: 14px;
        }
        .error-message {
          background: #fef2f2;
          color: #991b1b;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-size: 14px;
          border: 1px solid #fecaca;
        }
      `}</style>
    </div>
  );
};

export default Login;
