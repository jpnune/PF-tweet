import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { LogIn, MessageCircle } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/api/token/', { username, password });
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      localStorage.setItem('username', username);
      navigate('/');
    } catch (err: any) {
      if (err.response) {
        setError(err.response.data?.detail || 'Usuário ou senha inválidos.');
      } else {
        setError('Não foi possível conectar ao servidor. Por favor, verifique sua conexão ou tente novamente mais tarde.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '40px 30px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', padding: '16px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '50%', marginBottom: '24px' }}>
          <MessageCircle size={32} color="#3b82f6" />
        </div>
        
        <h2 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>Bem-vindo de volta</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Acesse sua conta para ver os tweets</p>

        {error && (
          <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: 'var(--error-color)', fontSize: '0.9rem', marginBottom: '20px', textAlign: 'left' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Usuário</label>
            <input
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Digite seu usuário"
              required
            />
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Senha</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha"
              required
            />
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }} disabled={loading}>
            {loading ? 'Entrando...' : <><LogIn size={20} /> Entrar</>}
          </button>
        </form>

        <p style={{ marginTop: '24px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Não tem uma conta? <Link to="/signup" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 600 }}>Cadastre-se</Link>
        </p>
      </div>
    </div>
  );
}
