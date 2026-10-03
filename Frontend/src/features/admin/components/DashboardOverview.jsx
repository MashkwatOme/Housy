import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { useDashboardStats } from '../hooks/useDashboardStats';
import './DashboardOverview.css';

/* ---------- helpers ---------- */

const CURRENCY = '৳';

const formatNumber = (n) => Number(n || 0).toLocaleString('en-US');

const getInitials = (name) =>
    name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';

const timeAgo = (dateString) => {
    if (!dateString) return '';
    const diff = Date.now() - new Date(dateString).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const parseDay = (day) => {
    const [y, m, d] = day.split('-').map(Number);
    return new Date(y, m - 1, d);
};

const formatDay = (day, opts = { month: 'short', day: 'numeric' }) =>
    parseDay(day).toLocaleDateString('en-US', opts);

const sum = (arr) => arr.reduce((a, b) => a + b, 0);

/* ---------- icons ---------- */

const Icon = ({ children, size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {children}
    </svg>
);

const UsersIcon = () => <Icon><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></Icon>;
const HomeIcon = () => <Icon><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></Icon>;
const ShieldIcon = () => <Icon><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></Icon>;
const RefreshIcon = () => <Icon size={16}><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></Icon>;
const ArrowRightIcon = () => <Icon size={16}><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></Icon>;
const TrendIcon = ({ dir }) => (
    <Icon size={14}>
        {dir === 'up' && <><line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" /></>}
        {dir === 'down' && <><line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" /></>}
        {dir === 'flat' && <line x1="5" y1="12" x2="19" y2="12" />}
    </Icon>
);

/* ---------- stat tile ---------- */

const StatTile = ({ icon, label, value, sub, delta, accent, to }) => {
    const body = (
        <>
            <div className="dash-tile-top">
                <span className="dash-tile-icon">{icon}</span>
                <span className="dash-tile-label">{label}</span>
            </div>
            <div className="dash-tile-value">{value}</div>
            <div className="dash-tile-foot">
                {delta && (
                    <span className={`dash-delta ${delta.dir}`}>
                        <TrendIcon dir={delta.dir} />
                        {delta.text}
                    </span>
                )}
                {sub && <span className="dash-tile-sub">{sub}</span>}
                {to && <span className="dash-tile-link">Review queue <ArrowRightIcon /></span>}
            </div>
        </>
    );
    const cls = `dash-tile ${accent ? 'accent' : ''}`;
    return to ? <Link to={to} className={`${cls} link`}>{body}</Link> : <div className={cls}>{body}</div>;
};

/* ---------- signups column chart ---------- */

const SignupsChart = ({ signups }) => {
    const [hover, setHover] = useState(null);
    const [asTable, setAsTable] = useState(false);

    const counts = signups.map(s => s.count);
    const max = Math.max(...counts, 0);
    const step = Math.max(1, Math.ceil(max / 3));
    const niceMax = step * 3;
    const ticks = [3, 2, 1, 0].map(i => i * step);
    const peakIndex = max > 0 ? counts.indexOf(max) : -1;
    const total = sum(counts);
    const range = `${formatDay(signups[0].day)} – ${formatDay(signups[signups.length - 1].day)}`;

    return (
        <section className="dash-card dash-signups">
            <div className="dash-card-head">
                <div>
                    <h3>New signups</h3>
                    <p>{formatNumber(total)} new accounts · {range}</p>
                </div>
                <button type="button" className="dash-link-btn" onClick={() => setAsTable(t => !t)}>
                    {asTable ? 'View chart' : 'View as table'}
                </button>
            </div>

            {asTable ? (
                <div className="dash-table-wrap">
                    <table className="dash-table">
                        <thead><tr><th>Date</th><th>New accounts</th></tr></thead>
                        <tbody>
                            {[...signups].reverse().map(s => (
                                <tr key={s.day}>
                                    <td>{formatDay(s.day, { weekday: 'short', month: 'short', day: 'numeric' })}</td>
                                    <td className="num">{s.count}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="dash-chart" role="img" aria-label={`Bar chart of new signups per day, ${range}. ${total} in total.`}>
                    <div className="dash-chart-yaxis">
                        {ticks.map(t => <span key={t}>{t}</span>)}
                    </div>
                    <div className="dash-chart-plot">
                        <div className="dash-chart-grid">
                            {ticks.map(t => <div key={t} className="dash-gridline" />)}
                        </div>
                        <div className="dash-chart-cols" onMouseLeave={() => setHover(null)}>
                            {signups.map((s, i) => {
                                const h = niceMax ? (s.count / niceMax) * 100 : 0;
                                return (
                                    <div
                                        key={s.day}
                                        className={`dash-col ${hover === i ? 'hover' : ''}`}
                                        tabIndex={0}
                                        onMouseEnter={() => setHover(i)}
                                        onFocus={() => setHover(i)}
                                        onBlur={() => setHover(null)}
                                    >
                                        {i === peakIndex && hover === null && <span className="dash-col-label" style={{ bottom: `calc(${h}% + 6px)` }}>{s.count}</span>}
                                        <div className="dash-col-bar" style={{ height: `${h}%` }} />
                                        {hover === i && (
                                            <div
                                                className={`dash-tooltip ${i <= 1 ? 'left' : i >= signups.length - 2 ? 'right' : ''}`}
                                                style={{ bottom: `calc(${h}% + 12px)` }}
                                            >
                                                <strong>{s.count} {s.count === 1 ? 'signup' : 'signups'}</strong>
                                                <span>{formatDay(s.day, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="dash-chart-xaxis">
                            {signups.map((s, i) => (
                                <span key={s.day}>
                                    {parseDay(s.day).getDate()}
                                    {(i === 0 || parseDay(s.day).getDate() === 1) && (
                                        <em>{formatDay(s.day, { month: 'short' })}</em>
                                    )}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

/* ---------- users breakdown ---------- */

const UsersBreakdown = ({ users }) => {
    const roles = [
        { key: 'tenants', label: 'Tenants', value: users.tenants, cls: 's1' },
        { key: 'owners', label: 'Owners', value: users.owners, cls: 's2' },
    ];
    const statuses = [
        { key: 'accepted', label: 'Verified', value: users.accepted },
        { key: 'pending', label: 'Pending', value: users.pending },
        { key: 'rejected', label: 'Rejected', value: users.rejected },
    ];

    return (
        <section className="dash-card">
            <div className="dash-card-head">
                <div>
                    <h3>Users</h3>
                    <p>{formatNumber(users.total)} registered accounts</p>
                </div>
            </div>

            <div className="dash-stack" role="img" aria-label={`${users.tenants} tenants and ${users.owners} owners`}>
                {users.total === 0 && <div className="dash-stack-empty" />}
                {roles.map(r => (
                    r.value > 0 && <div key={r.key} className={`dash-stack-seg ${r.cls}`} style={{ flexGrow: r.value }} title={`${r.label}: ${r.value}`} />
                ))}
            </div>
            <ul className="dash-legend">
                {roles.map(r => (
                    <li key={r.key}>
                        <span className={`dash-swatch ${r.cls}`} />
                        <span className="dash-legend-label">{r.label}</span>
                        <span className="dash-legend-value">{formatNumber(r.value)}</span>
                        <span className="dash-legend-pct">{users.total ? Math.round((r.value / users.total) * 100) : 0}%</span>
                    </li>
                ))}
            </ul>

            <div className="dash-divider" />

            <h4 className="dash-subhead">Verification status</h4>
            <ul className="dash-status-list">
                {statuses.map(s => (
                    <li key={s.key}>
                        <span className={`dash-chip ${s.key}`}>{s.label}</span>
                        <span className="dash-status-count">{formatNumber(s.value)}</span>
                    </li>
                ))}
            </ul>
        </section>
    );
};

/* ---------- activity meters ---------- */

const MeterGroup = ({ title, data, order }) => {
    const entries = order.map(([key, label]) => ({ key, label, value: data[key] || 0 }));
    const total = sum(entries.map(e => e.value));
    return (
        <div className="dash-meter-group">
            <h4 className="dash-subhead">{title} <span>{formatNumber(total)}</span></h4>
            {entries.map(e => (
                <div key={e.key} className="dash-meter-row">
                    <span className="dash-meter-label">{e.label}</span>
                    <div className="dash-meter-track">
                        <div className="dash-meter-fill" style={{ width: `${total ? (e.value / total) * 100 : 0}%` }} />
                    </div>
                    <span className="dash-meter-value">{formatNumber(e.value)}</span>
                </div>
            ))}
        </div>
    );
};

const Activity = ({ stats }) => (
    <section className="dash-card">
        <div className="dash-card-head">
            <div>
                <h3>Platform activity</h3>
                <p>Requests and listings across Housy</p>
            </div>
        </div>
        <MeterGroup
            title="Stay requests"
            data={stats.stayRequests}
            order={[['pending', 'Pending'], ['approved', 'Approved'], ['rejected', 'Rejected'], ['cancelled', 'Cancelled']]}
        />
        <MeterGroup
            title="Maintenance"
            data={stats.maintenance}
            order={[['pending', 'Pending'], ['in_progress', 'In progress'], ['resolved', 'Resolved'], ['cancelled', 'Cancelled']]}
        />
        <MeterGroup
            title="Listings"
            data={stats.properties.byStatus}
            order={[['active', 'Active'], ['hidden', 'Hidden'], ['reported', 'Reported']]}
        />
    </section>
);

/* ---------- recent lists ---------- */

const RecentUsers = ({ users }) => (
    <section className="dash-card">
        <div className="dash-card-head">
            <div>
                <h3>Recent signups</h3>
                <p>Latest accounts to join</p>
            </div>
        </div>
        {users.length === 0 ? (
            <div className="dash-empty">No accounts yet</div>
        ) : (
            <ul className="dash-list">
                {users.map(u => (
                    <li key={u.id}>
                        <span className="dash-avatar">{getInitials(u.name)}</span>
                        <div className="dash-list-main">
                            <strong>{u.name}</strong>
                            <span><span className="cap">{u.role}</span> · {timeAgo(u.created_at)}</span>
                        </div>
                        <span className={`dash-chip ${u.status}`}>{u.status === 'accepted' ? 'Verified' : u.status}</span>
                    </li>
                ))}
            </ul>
        )}
    </section>
);

const RecentProperties = ({ properties }) => (
    <section className="dash-card">
        <div className="dash-card-head">
            <div>
                <h3>Latest listings</h3>
                <p>Newest properties on the platform</p>
            </div>
        </div>
        {properties.length === 0 ? (
            <div className="dash-empty">No listings yet</div>
        ) : (
            <ul className="dash-list">
                {properties.map(p => (
                    <li key={p.id}>
                        <span className="dash-avatar square"><HomeIcon /></span>
                        <div className="dash-list-main">
                            <strong>{p.title}</strong>
                            <span>{p.area}, {p.district} · by {p.owner_name}</span>
                        </div>
                        <div className="dash-list-side">
                            <strong>{CURRENCY}{formatNumber(p.monthly_rent)}</strong>
                            <span>{timeAgo(p.created_at)}</span>
                        </div>
                    </li>
                ))}
            </ul>
        )}
    </section>
);

/* ---------- skeleton ---------- */

const Skeleton = () => (
    <div className="dash-skeleton" aria-busy="true" aria-label="Loading dashboard">
        <div className="dash-tiles">{[0, 1, 2].map(i => <div key={i} className="dash-skel-block tile" />)}</div>
        <div className="dash-grid two"><div className="dash-skel-block tall" /><div className="dash-skel-block tall" /></div>
    </div>
);

/* ---------- page ---------- */

const DashboardOverview = () => {
    const { user } = useAuth();
    const { stats, loading, error, refresh } = useDashboardStats();

    useEffect(() => {
        refresh();
    }, [refresh]);

    const firstName = user?.name ? user.name.split(' ')[0] : 'Admin';
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    let usersDelta = null;
    if (stats) {
        const counts = stats.signups.map(s => s.count);
        const thisWeek = sum(counts.slice(7));
        const lastWeek = sum(counts.slice(0, 7));
        const diff = thisWeek - lastWeek;
        usersDelta = {
            dir: diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat',
            text: `${diff > 0 ? '+' : ''}${diff} vs last week`,
            thisWeek,
        };
    }

    return (
        <div className="dash-container">
            <div className="dash-header">
                <div>
                    <h1>Welcome back, {firstName}</h1>
                    <p>{today} · Here's what's happening on Housy.</p>
                </div>
                <button type="button" className="dash-refresh" onClick={refresh} disabled={loading}>
                    <RefreshIcon /> {loading ? 'Refreshing…' : 'Refresh'}
                </button>
            </div>

            {loading && !stats && <Skeleton />}

            {error && !stats && (
                <div className="dash-card dash-error">
                    <p>Couldn't load dashboard data: {error}</p>
                    <button type="button" className="dash-refresh" onClick={refresh}>Try again</button>
                </div>
            )}

            {stats && (
                <>
                    <div className="dash-tiles">
                        <StatTile
                            icon={<UsersIcon />}
                            label="Total users"
                            value={formatNumber(stats.users.total)}
                            delta={usersDelta}
                            sub={`${usersDelta.thisWeek} joined this week`}
                        />
                        <StatTile
                            icon={<HomeIcon />}
                            label="Properties"
                            value={formatNumber(stats.properties.total)}
                            sub={`${formatNumber(stats.properties.byStatus.active || 0)} active · ${formatNumber(stats.properties.byStatus.reported || 0)} reported`}
                        />
                        <StatTile
                            accent
                            icon={<ShieldIcon />}
                            label="Pending verifications"
                            value={formatNumber(stats.users.pending)}
                            to="/admin/verifications"
                        />
                    </div>

                    <div className="dash-grid two">
                        <SignupsChart signups={stats.signups} />
                        <UsersBreakdown users={stats.users} />
                    </div>

                    <div className="dash-grid three">
                        <Activity stats={stats} />
                        <RecentUsers users={stats.recentUsers} />
                        <RecentProperties properties={stats.recentProperties} />
                    </div>
                </>
            )}
        </div>
    );
};

export default DashboardOverview;
