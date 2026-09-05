import React, { useState } from 'react';
import { Lock, User, KeyRound, X, AlertCircle, RefreshCw } from 'lucide-react';
import { AdminLoginResponse } from '../types';
import { API_BASE_URL } from '../config';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (username: string, token: string) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!username.trim() || !password) {
      setErrorMsg('Please enter both username and password.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data: AdminLoginResponse = await response.json();

      if (!response.ok || !data.success) {
        setErrorMsg(data.message || 'Invalid admin credentials.');
        setLoading(false);
        return;
      }

      onLoginSuccess(data.admin?.username || username, data.token || '');
      onClose();
    } catch (err: any) {
      setErrorMsg('Failed to connect to authentication server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-card">
        <button className="modal-close-btn" onClick={onClose} title="Close Modal">
          <X size={20} />
        </button>

        <div className="card-header" style={{ marginBottom: '20px', textAlign: 'center' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            background: 'rgba(99, 102, 241, 0.15)',
            border: '1.5px solid var(--primary)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px auto'
          }}>
            <Lock size={26} />
          </div>
          <h2 style={{ justifyContent: 'center' }}>Admin Portal Login</h2>
          <p style={{ fontSize: '0.85rem' }}>Restricted access for database administrators</p>
        </div>

        {errorMsg && (
          <div className="alert-banner error">
            <AlertCircle size={18} />
            <div>{errorMsg}</div>
          </div>
        )}


        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Admin Username</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <User size={18} />
              </span>
              <input
                type="text"
                className="form-input"
                placeholder="Enter admin username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <KeyRound size={18} />
              </span>
              <input
                type="password"
                className="form-input"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '24px' }}>
            {loading ? (
              <>
                <RefreshCw className="spinner" size={18} /> Authenticating...
              </>
            ) : (
              <>
                Login to Admin Portal
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
