import React, { useState, useRef } from 'react';
import AuthLayout from './AuthLayout';
import './Register.css';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const Register = ({ onNavigate }) => {
    const { register, loading } = useAuth();
    const [role, setRole] = useState('tenant');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [acceptTerms, setAcceptTerms] = useState(false);
    
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [nidFront, setNidFront] = useState(null);
    const [nidBack, setNidBack] = useState(null);

    const nidFrontRef = useRef();
    const nidBackRef = useRef();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!acceptTerms) {
            return toast.error("You must accept the terms and conditions.");
        }
        if (password !== confirmPassword) {
            return toast.error("Passwords do not match.");
        }
        if (!nidFront || !nidBack) {
            return toast.error("Both NID images are required.");
        }

        try {
            const formData = new FormData();
            formData.append('role', role);
            formData.append('name', name);
            formData.append('email', email);
            formData.append('phone', phone);
            formData.append('password', password);
            formData.append('nid_front', nidFront);
            formData.append('nid_back', nidBack);

            await register(formData);

            toast.success("Registered successfully! Awaiting Admin verification.");
            
            // Optionally clear form or redirect to login after a delay
            setTimeout(() => {
                if (onNavigate) onNavigate('login');
            }, 3000);
        } catch (err) {
            toast.error(err.message || "Registration failed");
        }
    };

    return (
        <AuthLayout>
            <div className="auth-form-container">
                <h2 className="auth-heading">Create your account</h2>
                <p className="auth-subheading">Start your journey with the most comprehensive real-estate platform.</p>
                
                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Tenant or Owner?</label>
                        <div className="role-selector">
                            <button 
                                type="button" 
                                className={`role-btn ${role === 'tenant' ? 'active' : ''}`}
                                onClick={() => setRole('tenant')}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                Tenant
                                {role === 'tenant' && (
                                    <svg className="check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                )}
                            </button>
                            <button 
                                type="button" 
                                className={`role-btn ${role === 'owner' ? 'active' : ''}`}
                                onClick={() => setRole('owner')}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line></svg>
                                Owner
                                {role === 'owner' && (
                                    <svg className="check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group half-width">
                            <label className="form-label">Full Name</label>
                            <input type="text" required className="form-input" placeholder="John Doe" value={name} onChange={e=>setName(e.target.value)} />
                        </div>
                        <div className="form-group half-width">
                            <label className="form-label">Email Address</label>
                            <input type="email" required className="form-input" placeholder="john@example.com" value={email} onChange={e=>setEmail(e.target.value)} />
                        </div>
                    </div>
                    
                    <div className="form-group">
                        <label className="form-label">Phone Number</label>
                        <input type="tel" required className="form-input" placeholder="+1 (555) 000-0000" value={phone} onChange={e=>setPhone(e.target.value)} />
                    </div>

                    <div className="form-row">
                        <div className="form-group half-width">
                            <label className="form-label">Password</label>
                            <div className="password-input-wrapper">
                                <input type={showPassword ? "text" : "password"} required className="form-input" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} />
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
                        <div className="form-group half-width">
                            <label className="form-label">Confirm Password</label>
                            <div className="password-input-wrapper">
                                <input type={showConfirmPassword ? "text" : "password"} required className="form-input" placeholder="••••••••" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} />
                                <button type="button" className="btn-toggle-visibility" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        {showConfirmPassword ? (
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
                    </div>

                    <div className="form-row">
                        <div className="form-group half-width">
                            <label className="form-label">NID Front</label>
                            <input type="file" required={!nidFront} accept="image/jpeg, image/png" style={{display: 'none'}} ref={nidFrontRef} onChange={e => setNidFront(e.target.files[0])} />
                            <div className="upload-dropzone" onClick={() => nidFrontRef.current?.click()} style={nidFront ? {borderColor: 'var(--color-primary)'} : {}}>
                                <div className="upload-icon-wrapper">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-id-card-icon lucide-id-card"><path d="M16 10h2"/><path d="M16 14h2"/><path d="M6.17 15a3 3 0 0 1 5.66 0"/><circle cx="9" cy="11" r="2"/><rect x="2" y="5" width="20" height="14" rx="2"/></svg>
                                </div>
                                <span className="upload-title">{nidFront ? nidFront.name : 'Upload Front'}</span>
                                <span className="upload-subtitle">JPG, PNG (Max 5MB)</span>
                            </div>
                        </div>
                        <div className="form-group half-width">
                            <label className="form-label">NID Back</label>
                            <input type="file" required={!nidBack} accept="image/jpeg, image/png" style={{display: 'none'}} ref={nidBackRef} onChange={e => setNidBack(e.target.files[0])} />
                            <div className="upload-dropzone" onClick={() => nidBackRef.current?.click()} style={nidBack ? {borderColor: 'var(--color-primary)'} : {}}>
                                <div className="upload-icon-wrapper">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-credit-card-icon lucide-credit-card"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                                </div>
                                <span className="upload-title">{nidBack ? nidBack.name : 'Upload Back'}</span>
                                <span className="upload-subtitle">JPG, PNG (Max 5MB)</span>
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="terms-checkbox-label">
                            <input type="checkbox" className="terms-checkbox" checked={acceptTerms} onChange={e => setAcceptTerms(e.target.checked)} />
                            <span className="terms-text">I accept all <strong>terms and conditions</strong> and the privacy policy.</span>
                        </label>
                    </div>
                    
                    <button type="submit" className="btn-auth-primary" disabled={loading}>
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>
                
                <div className="auth-divider">
                    <span>Or sign up with</span>
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
                    Already have an account? <button className="btn-link" onClick={() => onNavigate && onNavigate('login')}>Sign In</button>
                </div>
            </div>
        </AuthLayout>
    );
};

export default Register;
