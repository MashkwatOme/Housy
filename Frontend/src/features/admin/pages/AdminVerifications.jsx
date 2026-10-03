import AdminLayout from '../components/AdminLayout';
import VerificationQueue from '../components/VerificationQueue';

const AdminVerifications = ({ onNavigate }) => {
    return (
        <AdminLayout onNavigate={onNavigate}>
            <VerificationQueue />
        </AdminLayout>
    );
};

export default AdminVerifications;
