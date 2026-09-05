import React, { useEffect, useState } from 'react';
import { Database, RefreshCw, Phone, User as UserIcon, Calendar, Search, Users, ShieldCheck, Clock, Edit2, Trash2, X, Check, AlertCircle, Printer } from 'lucide-react';
import { User, UsersResponse } from '../types';
import { API_BASE_URL } from '../config';

interface UserListProps {
  refreshTrigger: number;
  adminToken?: string;
}

export const UserList: React.FC<UserListProps> = ({ refreshTrigger, adminToken }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Edit User State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editPhone, setEditPhone] = useState<string>('');
  const [editLoading, setEditLoading] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete User State
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/users`);
      const data: UsersResponse = await response.json();
      if (response.ok && data.success && data.users) {
        setUsers(data.users);
      } else {
        setError(data.message || 'Failed to load registered users.');
      }
    } catch (err) {
      setError('Could not connect to database backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [refreshTrigger]);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return dateStr;
    }
  };

  const formatPhoneDisplay = (phone: string): string => {
    let digitsOnly = phone.trim().replace(/\D/g, '');
    if (digitsOnly.startsWith('855')) {
      digitsOnly = digitsOnly.slice(3);
    }
    if (!digitsOnly.startsWith('0') && digitsOnly.length >= 8) {
      digitsOnly = `0${digitsOnly}`;
    }
    if (digitsOnly.length <= 3) return digitsOnly;
    if (digitsOnly.length <= 6) return `${digitsOnly.slice(0, 3)} ${digitsOnly.slice(3)}`;
    return `${digitsOnly.slice(0, 3)} ${digitsOnly.slice(3, 6)} ${digitsOnly.slice(6)}`;
  };

  const filteredUsers = users.filter((u) => {
    const rawSearch = searchQuery.toLowerCase().trim();
    const cleanSearchPhone = rawSearch.replace(/\D/g, '');
    
    const nameMatch = u.name.toLowerCase().includes(rawSearch);
    const phoneMatch = cleanSearchPhone ? u.phone_number.replace(/\D/g, '').includes(cleanSearchPhone) : false;
    
    return nameMatch || phoneMatch;
  });

  const latestUser = users.length > 0 ? formatDate(users[0].created_at) : 'N/A';

  // Open Edit Modal
  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditPhone(user.phone_number);
    setEditError(null);
  };

  // Submit Edit Form
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditError(null);

    if (!editName.trim()) {
      setEditError('Name cannot be empty.');
      return;
    }

    const digitsOnly = editPhone.replace(/\D/g, '');
    if (!digitsOnly || digitsOnly.length < 8) {
      setEditError('Please enter a valid phone number (at least 8 digits).');
      return;
    }

    setEditLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken || ''}`,
          'x-admin-token': adminToken || '',
        },
        body: JSON.stringify({
          name: editName.trim(),
          phone_number: editPhone.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setEditError(data.message || 'Failed to update user.');
        setEditLoading(false);
        return;
      }

      setSuccessBanner(`Updated user "${editName}" successfully!`);
      setEditingUser(null);
      fetchUsers();
      setTimeout(() => setSuccessBanner(null), 4000);
    } catch (err) {
      setEditError('Network error updating user record.');
    } finally {
      setEditLoading(false);
    }
  };

  // Open Delete Confirmation Modal
  const handleOpenDelete = (user: User) => {
    setDeletingUser(user);
  };

  // Confirm and Perform Delete Action
  const confirmDeleteUser = async () => {
    if (!deletingUser) return;
    setIsDeleting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${deletingUser.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminToken || ''}`,
          'x-admin-token': adminToken || '',
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(data.message || 'Failed to delete user.');
        setIsDeleting(false);
        return;
      }

      setSuccessBanner(`User "${deletingUser.name}" deleted from database.`);
      setDeletingUser(null);
      fetchUsers();
      setTimeout(() => setSuccessBanner(null), 4000);
    } catch (err) {
      alert('Error deleting user record.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="glass-card user-list-card" style={{ width: '100%', padding: '36px' }}>
      {/* A4 Single Large Full-Width Table Print Layout (Visible ONLY when printing) */}
      <div className="print-only-container">
        <div className="print-header">
          <h1 className="print-title">SeyhaGamming — Registered Users Report</h1>
          <div className="print-meta">
            Total Records: {filteredUsers.length} &nbsp;|&nbsp; Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
          </div>
        </div>

        <table className="print-table-1col">
          <thead>
            <tr>
              <th className="center" style={{ width: '55px' }}>#</th>
              <th>Full Name</th>
              <th>Phone Number</th>
              <th>Registration Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user, idx) => (
              <tr key={user.id || idx}>
                <td className="center">{idx + 1}</td>
                <td className="bold">{user.name}</td>
                <td className="phone">{formatPhoneDisplay(user.phone_number)}</td>
                <td className="date">{formatDate(user.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Header Bar */}
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', marginBottom: '24px' }}>
        <div>
          <h2>
            <Database className="icon" style={{ color: 'var(--accent-cyan)' }} />
            Admin Data Dashboard
          </h2>
          <p style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
            <span>Live MySQL Database Connection:</span>
            <span style={{ color: 'var(--accent-emerald)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-emerald)', display: 'inline-block', boxShadow: '0 0 8px var(--accent-emerald)' }}></span>
              MySQL Cloud Database (`register_db`)
            </span>
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Search Box */}
          <div className="input-wrapper" style={{ width: '250px' }}>
            <span className="input-icon">
              <Search size={16} />
            </span>
            <input
              type="text"
              className="form-input"
              style={{ padding: '10px 14px 10px 40px', fontSize: '0.9rem' }}
              placeholder="Search user or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button
            className="btn-secondary"
            onClick={fetchUsers}
            disabled={loading}
            title="Refresh database records"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontSize: '0.9rem' }}
          >
            <RefreshCw size={15} className={loading ? 'spinner' : ''} /> Refresh
          </button>

          <button
            className="btn-primary"
            onClick={() => window.print()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              fontSize: '0.9rem',
              background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
              border: 'none',
              boxShadow: '0 4px 12px rgba(6, 182, 212, 0.35)'
            }}
            title="Print or Export A4 PDF Document"
          >
            <Printer size={15} /> Print PDF
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successBanner && (
        <div className="alert-banner success">
          <Check size={18} />
          <div>{successBanner}</div>
        </div>
      )}

      {/* Admin Stats Metric Cards */}
      <div className="admin-stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-icon indigo">
            <Users size={24} />
          </div>
          <div>
            <div className="stat-val">{users.length}</div>
            <div className="stat-label">Total Accounts</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon cyan">
            <Clock size={24} />
          </div>
          <div>
            <div className="stat-val" style={{ fontSize: '1.05rem', fontWeight: 700 }}>
              {latestUser}
            </div>
            <div className="stat-label">Latest Registration</div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="user-table-container">
        {loading && users.length === 0 ? (
          <div className="empty-state">
            <RefreshCw className="spinner" size={28} style={{ marginBottom: '12px', color: 'var(--accent-cyan)' }} />
            <p style={{ fontSize: '1rem' }}>Loading records from MySQL database...</p>
          </div>
        ) : error ? (
          <div className="empty-state" style={{ color: '#fda4af' }}>
            <p>{error}</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="empty-state">
            <p style={{ fontSize: '1.05rem' }}>{searchQuery ? `No users matching "${searchQuery}"` : 'No registered users in database yet.'}</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <table className="user-table desktop-only-table">
              <thead>
                <tr>
                  <th style={{ width: '60px', padding: '16px 20px', fontSize: '0.9rem' }}>#</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.9rem' }}>Full Name</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.9rem' }}>Phone Number</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.9rem' }}>Registration Date</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.9rem', textAlign: 'center', width: '130px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, idx) => (
                  <tr key={user.id || idx}>
                    <td style={{ color: 'var(--text-muted)', fontWeight: 600, padding: '18px 20px', fontSize: '0.95rem' }}>
                      {idx + 1}
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--text-main)', padding: '18px 20px', fontSize: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="user-avatar-large">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        {user.name}
                      </div>
                    </td>
                    <td style={{ padding: '18px 20px' }}>
                      <span className="badge-phone-large">
                        <Phone size={13} style={{ display: 'inline', marginRight: '6px' }} />
                        {formatPhoneDisplay(user.phone_number)}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '18px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={14} />
                        {formatDate(user.created_at)}
                      </div>
                    </td>
                    <td style={{ padding: '18px 20px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <button
                          className="btn-action-edit"
                          onClick={() => handleOpenEdit(user)}
                          title="Edit User"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="btn-action-delete"
                          onClick={() => handleOpenDelete(user)}
                          title="Delete User"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile Cards View */}
            <div className="mobile-only-cards">
              {filteredUsers.map((user, idx) => (
                <div key={user.id || idx} className="mobile-user-card">
                  <div className="mobile-card-header">
                    <div className="mobile-card-user-info">
                      <div className="user-avatar-large">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="mobile-user-name">{user.name}</h4>
                        <small className="mobile-user-id">Record #{filteredUsers.length - idx}</small>
                      </div>
                    </div>

                    <div className="mobile-card-actions">
                      <button
                        className="btn-action-edit"
                        onClick={() => handleOpenEdit(user)}
                        title="Edit User"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="btn-action-delete"
                        onClick={() => handleOpenDelete(user)}
                        title="Delete User"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="mobile-card-body">
                    <div className="mobile-card-field">
                      <span className="mobile-field-label">Phone Number</span>
                      <span className="badge-phone-large" style={{ width: 'fit-content' }}>
                        <Phone size={13} style={{ display: 'inline', marginRight: '6px' }} />
                        {formatPhoneDisplay(user.phone_number)}
                      </span>
                    </div>

                    <div className="mobile-card-footer">
                      <span className="mobile-card-date">
                        <Calendar size={13} style={{ display: 'inline', marginRight: '4px' }} />
                        Registered: {formatDate(user.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="modal-overlay">
          <div className="modal-content glass-card">
            <button className="modal-close-btn" onClick={() => setEditingUser(null)} title="Close">
              <X size={20} />
            </button>

            <div className="card-header" style={{ marginBottom: '20px' }}>
              <h2>
                <Edit2 className="icon" style={{ color: 'var(--primary)' }} />
                Edit User Details
              </h2>
              <p>Update record for ID #{editingUser.id}</p>
            </div>

            {editError && (
              <div className="alert-banner error">
                <AlertCircle size={18} />
                <div>{editError}</div>
              </div>
            )}

            <form onSubmit={handleSaveEdit}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <UserIcon size={18} />
                  </span>
                  <input
                    type="text"
                    className="form-input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    disabled={editLoading}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <Phone size={18} />
                  </span>
                  <input
                    type="tel"
                    className="form-input"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    disabled={editLoading}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setEditingUser(null)}
                  disabled={editLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1 }}
                  disabled={editLoading}
                >
                  {editLoading ? (
                    <>
                      <RefreshCw className="spinner" size={16} /> Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Small Window UI: Delete Confirmation Modal */}
      {deletingUser && (
        <div className="modal-overlay">
          <div className="modal-content glass-card" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <button className="modal-close-btn" onClick={() => setDeletingUser(null)} title="Close">
              <X size={20} />
            </button>

            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1.5px solid rgba(244, 63, 94, 0.4)',
              color: '#fda4af',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto'
            }}>
              <Trash2 size={28} />
            </div>

            <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
              Delete User Record?
            </h3>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px', lineHeight: 1.4 }}>
              Are you sure you want to permanently delete this user from the database?
            </p>

            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '14px',
              marginBottom: '24px',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div className="user-avatar-large">
                {deletingUser.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '1rem' }}>{deletingUser.name}</div>
                <div style={{ fontSize: '0.88rem', color: '#38bdf8', fontWeight: 600, marginTop: '2px' }}>
                  {formatPhoneDisplay(deletingUser.phone_number)}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setDeletingUser(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #f43f5e, #e11d48)',
                  boxShadow: '0 4px 15px rgba(244, 63, 94, 0.4)'
                }}
                onClick={confirmDeleteUser}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="spinner" size={16} /> Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} /> Delete User
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
