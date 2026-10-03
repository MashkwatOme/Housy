import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import Navbar from '../../properties/components/Navbar';
import { useAuth } from '../../auth/hooks/useAuth';
import { useAgreement } from '../../agreement/hooks/useAgreement';
import { useStayRequests } from '../../stayRequest/hook/useStayRequests';
import './ProfilePage.css';

const initials = (name = 'User') => name.split(' ').filter(Boolean).map(part => part[0]).join('').slice(0, 2).toUpperCase();
const formatDate = value => value ? new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Not available';

const ProfilePage = ({ onNavigate }) => {
    const { user, updateProfile } = useAuth();
    const isTenant = user?.role === 'tenant';
    const { agreements, fetchAgreements } = useAgreement();
    const { requests, fetchMyRequests } = useStayRequests();
    const fileInputRef = useRef(null);
    const [form, setForm] = useState({ name: '', email: '', phone: '' });
    const [picture, setPicture] = useState(null);
    const [preview, setPreview] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!user) return;
        setForm({ name: user.name || '', email: user.email || '', phone: user.phone || '' });
        setPreview(user.profile_picture_url || '');
        if (user.role === 'tenant') {
            fetchAgreements('tenant');
            fetchMyRequests();
        }
    }, [user, fetchAgreements, fetchMyRequests]);

    useEffect(() => () => {
        if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview);
    }, [preview]);

    const activeResidence = useMemo(() => agreements.find(item => item.status === 'signed'), [agreements]);
    const latestRequest = useMemo(() => requests.find(item => item.status === 'pending' || item.status === 'approved') || requests[0], [requests]);

    const handlePicture = event => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            toast.error('Please choose a JPG, PNG or WebP image.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Profile pictures must be 5 MB or smaller.');
            return;
        }
        if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview);
        setPicture(file);
        setPreview(URL.createObjectURL(file));
    };

    const handleSubmit = async event => {
        event.preventDefault();
        setSaving(true);
        try {
            await updateProfile({ ...form, profilePicture: picture });
            setPicture(null);
            toast.success('Profile updated successfully.');
        } catch (error) {
            toast.error(error.message || 'Could not update your profile.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="profile-page-shell">
            <Navbar onNavigate={onNavigate} activeTab="profile" />
            <main className="profile-page-main">
                <div className="profile-page-heading">
                    <div><p className="profile-eyebrow">ACCOUNT SETTINGS</p><h1>My Profile</h1><p>Manage your personal details and account information.</p></div>
                    <button onClick={() => onNavigate(isTenant ? 'tenant-dashboard' : 'ownerdashboard')} className="profile-back-btn">← Back to Dashboard</button>
                </div>

                <div className="profile-layout-grid">
                    <aside className="profile-summary-card">
                        <div className="profile-avatar-large">
                            {preview ? <img src={preview} alt={`${user?.name || 'User'} profile`} /> : <span>{initials(user?.name)}</span>}
                            <button type="button" onClick={() => fileInputRef.current?.click()} aria-label="Change profile picture">✎</button>
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePicture} hidden />
                        <h2>{user?.name}</h2>
                        <p>{user?.email}</p>
                        <span className="profile-role-badge">{isTenant ? 'Tenant account' : 'Property owner'}</span>
                        <div className="profile-account-facts">
                            <div><span>Account status</span><strong>{user?.is_verified ? 'Verified' : 'Verification pending'}</strong></div>
                            <div><span>Member since</span><strong>{formatDate(user?.created_at)}</strong></div>
                            <div><span>Account ID</span><strong>{user?.id?.slice(0, 8)?.toUpperCase() || '—'}</strong></div>
                        </div>
                        <button type="button" className="profile-photo-btn" onClick={() => fileInputRef.current?.click()}>{preview ? 'Change profile picture' : 'Upload profile picture'}</button>
                        <small>JPG, PNG or WebP. Maximum 5 MB.</small>
                    </aside>

                    <section className="profile-content-stack">
                        <form className="profile-details-card" onSubmit={handleSubmit}>
                            <div className="profile-section-title"><div><h2>Personal information</h2><p>Keep your contact details accurate for agreements and account notices.</p></div><span className="profile-secure-pill">Secure account</span></div>
                            <div className="profile-form-grid">
                                <label><span>Full name</span><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></label>
                                <label><span>Account type</span><input value={isTenant ? 'Tenant' : 'Property Owner'} disabled /></label>
                                <label><span>Email address</span><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /><small>Used for login and important notices.</small></label>
                                <label><span>Phone number</span><input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required /><small>Use a number you can currently access.</small></label>
                            </div>
                            <div className="profile-form-actions"><button type="button" onClick={() => setForm({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' })}>Cancel</button><button type="submit" disabled={saving}>{saving ? 'Saving changes...' : 'Save changes'}</button></div>
                        </form>

                        {isTenant && (
                            <section className="profile-residency-card">
                                <div className="profile-section-title"><div><h2>Residency information</h2><p>Your current signed residence or most recent lease request.</p></div><span className={`residency-status ${activeResidence ? 'active' : 'pending'}`}>{activeResidence ? 'Active residence' : latestRequest ? `${latestRequest.status} request` : 'No residence yet'}</span></div>
                                {activeResidence ? (
                                    <div className="residency-property-row">
                                        <img src={activeResidence.property_image || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=500&q=80'} alt="Current residence" />
                                        <div className="residency-property-main"><p>CURRENT RESIDENCE</p><h3>{activeResidence.property_title}</h3><span>{activeResidence.property_address}</span><div><strong>৳{Number(activeResidence.monthly_rent || 0).toLocaleString()}</strong><small>/ month</small></div></div>
                                        <div className="residency-dates"><span>Lease period</span><strong>{formatDate(activeResidence.agreement_start_date)}</strong><i>to</i><strong>{formatDate(activeResidence.agreement_end_date)}</strong><button onClick={() => onNavigate('tenant-stay')}>View residence details</button></div>
                                    </div>
                                ) : latestRequest ? (
                                    <div className="residency-property-row">
                                        <img src={latestRequest.image_url || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=500&q=80'} alt="Requested property" />
                                        <div className="residency-property-main"><p>REQUESTED PROPERTY</p><h3>{latestRequest.title}</h3><span>{latestRequest.area || 'Address available in request details'}</span><div><strong>৳{Number(latestRequest.monthly_rent || 0).toLocaleString()}</strong><small>/ month</small></div></div>
                                        <div className="residency-dates"><span>Preferred move-in</span><strong>{formatDate(latestRequest.move_in_date)}</strong><span>Request status</span><strong className="capitalize">{latestRequest.status}</strong><button onClick={() => onNavigate('tenant-requests')}>View request details</button></div>
                                    </div>
                                ) : <div className="profile-empty-residence"><span>⌂</span><div><h3>No residency information yet</h3><p>When you request or lease a property, its information will appear here.</p></div><button onClick={() => onNavigate('browse')}>Browse properties</button></div>}
                            </section>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
};

export default ProfilePage;
