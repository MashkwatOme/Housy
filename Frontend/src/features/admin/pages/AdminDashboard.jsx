import AdminLayout from '../components/AdminLayout';
import DashboardOverview from '../components/DashboardOverview';

const AdminDashboard = ({ onNavigate }) => {
    return (
        <AdminLayout onNavigate={onNavigate}>
            <DashboardOverview />
        </AdminLayout>
    );
};

export default AdminDashboard;
