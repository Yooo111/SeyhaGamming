import React, { useState } from 'react';
import { ShieldCheck, Lock, LogOut, UserCheck } from 'lucide-react';
import { RegisterForm } from './components/RegisterForm';
import { UserList } from './components/UserList';
import { AdminLoginModal } from './components/AdminLoginModal';

export const App: React.FC = () => {
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [adminUser, setAdminUser] = useState<string>('');
  const [adminToken, setAdminToken] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const handleUserRegistered = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleAdminLoginSuccess = (username: string, token: string) => {
    setIsAdmin(true);
    setAdminUser(username);
    setAdminToken(token);
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    setAdminUser('');
    setAdminToken('');
  };

  return (
    <div className="page-wrapper" style={{ maxWidth: '1200px' }}>
      {/* Top Navbar */}
      <nav className="top-navbar">
        <div className="navbar-brand">
          <UserCheck style={{ color: 'var(--accent-cyan)' }} />
          <span>{isAdmin ? 'SeyhaGamming Admin Dashboard' : 'SeyhaGamming Registration'}</span>
        </div>

        <div>
          {isAdmin ? (
            <div className="admin-nav-group">
              <span className="admin-badge">
                <ShieldCheck size={16} /> Admin: {adminUser}
              </span>
              <button className="btn-admin-logout" onClick={handleAdminLogout}>
                <LogOut size={15} /> Logout Admin
              </button>
            </div>
          ) : (
            <button className="btn-admin-login" onClick={() => setIsModalOpen(true)}>
              <Lock size={15} /> Admin Portal
            </button>
          )}
        </div>
      </nav>

      {/* Main Container View */}
      {isAdmin ? (
        /* Admin View: ONLY Registered User Data Dashboard (1200px Wide & Large Text) */
        <main style={{ width: '100%', maxWidth: '1200px' }}>
          <UserList refreshTrigger={refreshTrigger} adminToken={adminToken} />
        </main>
      ) : (
        /* Standard User View: ONLY Registration Form */
        <main style={{ width: '100%', maxWidth: '540px' }}>
          <RegisterForm onUserRegistered={handleUserRegistered} />
        </main>
      )}

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onLoginSuccess={handleAdminLoginSuccess}
      />
    </div>
  );
};

export default App;
