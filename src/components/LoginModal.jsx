import React, { useState } from 'react';

const LoginModal = ({ onSubmit, onCancel, loading, error }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(email, password);
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <form onSubmit={handleSubmit} className="glass-panel fade-in-up" style={{ padding: '40px', width: '340px', textAlign: 'center', background: 'white', borderRadius: '20px' }}>
        <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔐</div>
        <h3 style={{ color: '#003366', marginTop: 0, fontSize: '1.4rem', fontWeight: '800' }}>Acceso Administrador</h3>
        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '24px' }}>Sesión segura con Firebase Auth</p>

        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: '100%', padding: '13px 15px', marginBottom: '12px', border: '1px solid #ddd', borderRadius: '12px', outline: 'none', background: '#f9f9f9', boxSizing: 'border-box', fontSize: '0.95rem', color: '#333' }}
          autoFocus
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ width: '100%', padding: '13px 15px', marginBottom: '16px', border: '1px solid #ddd', borderRadius: '12px', outline: 'none', background: '#f9f9f9', boxSizing: 'border-box', fontSize: '0.95rem', color: '#333' }}
        />

        {error && (
          <p style={{ color: '#e53e3e', fontSize: '0.82rem', marginBottom: '12px', background: '#FFF5F5', padding: '8px 12px', borderRadius: '8px', border: '1px solid #FEB2B2' }}>
            ⚠️ {error}
          </p>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            style={{ flex: 1, padding: '12px', background: '#f0f0f0', border: 'none', color: '#666', fontWeight: 'bold', borderRadius: '12px', cursor: 'pointer' }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{ flex: 1, background: '#003366', color: 'white', border: 'none', fontWeight: 'bold', borderRadius: '12px', padding: '12px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? '⏳ Entrando...' : 'Entrar'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoginModal;
