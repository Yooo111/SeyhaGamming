import React, { useState } from 'react';
import { User, Phone, ArrowRight, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { RegisterResponse } from '../types';

import { API_BASE_URL } from '../config';

interface RegisterFormProps {
  onUserRegistered: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onUserRegistered }) => {
  // Form Fields
  const [name, setName] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');

  // UI & API States
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Submit Direct Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSuccess(false);

    // Validation
    if (!name.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    const digitsOnly = phoneNumber.replace(/\D/g, '');
    if (!digitsOnly || digitsOnly.length < 8) {
      setErrorMsg('Please enter a valid phone number (at least 8 digits).');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone_number: phoneNumber.trim(),
        }),
      });

      const data: RegisterResponse = await response.json();

      if (!response.ok || !data.success) {
        setErrorMsg(data.message || 'Registration failed.');
        setLoading(false);
        return;
      }

      setIsSuccess(true);
      onUserRegistered();
    } catch (err: any) {
      setErrorMsg('Could not connect to backend server. Make sure server is running.');
    } finally {
      setLoading(false);
    }
  };

  // Reset Form for another registration
  const handleReset = () => {
    setIsSuccess(false);
    setName('');
    setPhoneNumber('');
    setErrorMsg(null);
  };

  return (
    <div className="glass-card">
      <div className="card-header">
        <h2>Create Account</h2>
        <p>Enter your details to register</p>
      </div>

      {/* Global Error Banner */}
      {errorMsg && (
        <div className="alert-banner error">
          <AlertCircle size={20} />
          <div>{errorMsg}</div>
        </div>
      )}

      {/* Direct Registration Form */}
      {!isSuccess ? (
    <form onSubmit={handleRegister}>
      <div className="form-group">
        <label className="form-label">Full Name</label>
        <div className="input-wrapper">
          <span className="input-icon">
            <User size={18} />
          </span>
          <input
            type="text"
            className="form-input"
            placeholder="Enter your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Phone Number (Unique)</label>
        <div className="input-wrapper">
          <span className="input-icon">
            <Phone size={18} />
          </span>
          <input
            type="tel"
            className="form-input"
            placeholder="e.g. 081906015"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            disabled={loading}
            required
          />
        </div>
            <small style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '6px', display: 'block' }}>
              🔒 Each phone number can only be registered once.
            </small>
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '24px' }}>
            {loading ? (
              <>
                <RefreshCw className="spinner" size={18} /> Registering Account...
              </>
            ) : (
              <>
                Register Account <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      ) : (
        /* Success State */
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '2px solid var(--accent-emerald)',
            color: 'var(--accent-emerald)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto'
          }}>
            <CheckCircle2 size={36} />
          </div>

          <h3 style={{ fontSize: '1.4rem', color: '#ffffff', marginBottom: '8px' }}>Registration Successful!</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '24px' }}>
            Welcome <strong style={{ color: 'var(--text-main)' }}>{name}</strong>! Your account has been created and saved in the MySQL database.
          </p>

          <button type="button" className="btn-primary" onClick={handleReset}>
            Register Another Account
          </button>
        </div>
      )}
    </div>
  );
};
