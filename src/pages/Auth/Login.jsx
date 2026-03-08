import React, { useState } from 'react';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
    const [credentials, setCredentials] = useState({ username: '', password: '' });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const login = useAuthStore((state) => state.login);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        
        try {
            const response = await api.post('/auth/login', credentials);
            const { token, id, username, role } = response.data;
            
            // Store user data and token in Zustand
            // Wrapping role in an array as authStore expects 'roles'
            login({ id, username, roles: [role] }, token);
            
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-visual">
                <div className="visual-content">
                    <h1>Authentic Flavors.</h1>
                    <p>Manage your restaurant and delight your guests.</p>
                </div>
            </div>
            
            <div className="login-form-side">
                <div className="login-card premium-card">
                    <div className="login-header">
                        <span className="logo-icon">🥡</span>
                        <h2>Emperor's Wok POS</h2>
                        <p>Sign in to your staff account</p>
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="form-group">
                            <label htmlFor="username">Username</label>
                            <input 
                                type="text" 
                                id="username" 
                                name="username" 
                                value={credentials.username} 
                                onChange={handleChange} 
                                placeholder="staff_member"
                                required 
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <input 
                                type="password" 
                                id="password" 
                                name="password" 
                                value={credentials.password} 
                                onChange={handleChange} 
                                placeholder="••••••••"
                                required 
                            />
                        </div>

                        <div className="form-options">
                            <label className="remember-me">
                                <input type="checkbox" /> Remember me
                            </label>
                            <a href="#" className="forgot-password">Forgot password?</a>
                        </div>

                        <button type="submit" className="btn-primary login-btn" disabled={loading}>
                            {loading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </form>

                    <div className="login-footer">
                        <p>Don't have an account? <a href="#">Contact support</a></p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
