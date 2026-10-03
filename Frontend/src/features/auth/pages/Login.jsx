import React, { useState } from 'react';
import AuthLayout from './AuthLayout';
import './Login.css';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const Login = ({ onNavigate }) => {
    const { login, loading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const data = await login(email, password);
            toast.success('Logged in successfully!');
            if (onNavigate) {
                if (data && data.user && data.user.role === 'admin') {
                    onNavigate('admindashboard');
                } else if (data && data.user && data.user.role === 'owner') {
                    onNavigate('ownerdashboard');
                } else {
                    onNavigate('browse');
                }
            }
        } catch (err) {
            toast.error(err.message || 'Failed to login');
        }
    };

    return (
        <AuthLayout>
            <div className="auth-form-container">
                <h2 className="auth-heading">Sign In</h2>
                <p className="auth-subheading">Welcome back. Access your strategic portfolio and insights.</p>
                
                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input id="email" type="email" required className="form-input" placeholder="name@company.com" value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                    
                    <div className="form-group">
                        <div className="label-row">
                            <label className="form-label">Password</label>
                            <a href="#forgot" className="forgot-link">Forgot Password?</a>
                        </div>
                        <div className="password-input-wrapper">
                            <input id="password" type={showPassword ? "text" : "password"} required className="form-input" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
                            <button type="button" className="btn-toggle-visibility" onClick={() => setShowPassword(!showPassword)}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    {showPassword ? (
                                        <>
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                            <line x1="4" y1="4" x2="20" y2="20"></line>
                                        </>
                                    ) : (
                                        <>
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                            <circle cx="12" cy="12" r="3"></circle>
                                        </>
                                    )}
                                </svg>
                            </button>
                        </div>
                    </div>
                    
                    <button id="login-btn" type="submit" className="btn-auth-primary" disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>
                
                <div className="auth-divider">
                    <span>Or sign in with</span>
                </div>
                
                <div className="social-auth-buttons">
                    <button type="button" className="btn-social">
                        <img src="https://www.vectorlogo.zone/logos/google/google-icon.svg" alt="Google" className="social-icon" />
                        Google
                    </button>
                    <button type="button" className="btn-social">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="social-icon">
                            <path d="M4 4h4v4H4z"></path>
                            <path d="M4 16h4v4H4z"></path>
                            <path d="M16 4h4v4h-4z"></path>
                            <path d="M16 16h4v4h-4z"></path>
                        </svg>
                        Apple
                    </button>
                </div>
                
                <div className="auth-footer">
                    Don't have an account? <button className="btn-link" onClick={() => onNavigate && onNavigate('signup')}>Sign Up</button>
                </div>
            </div>
        </AuthLayout>
    );
};

export default Login;
