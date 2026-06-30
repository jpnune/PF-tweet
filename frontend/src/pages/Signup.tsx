import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { UserPlus, MessageCircle } from 'lucide-react';

export default function Signup() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/api/register/', { username, email, password });
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      if (err.response?.data) {
        const errorData = err.response.data;
        const msg = Object.keys(errorData)
          .map((key) => `${key}: ${errorData[key]}`)
          .join(', ');
        setError(msg || 'Erro ao realizar cadastro.');
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
        <div style={{ display: 'inline-flex', padding: '16px', background: 'rgba(168, 85, 247, 0.1)', borderRadius: '50%', marginBottom: '24px' }}>
          <MessageCircle size={32} color="#a855f7" />
        </div>
        
        <h2 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>Crie sua conta</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Junte-se à comunidade agora mesmo</p>

        {success && (
          <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px', color: 'var(--success-color)', fontSize: '0.9rem', marginBottom: '20px' }}>
            Cadastro realizado com sucesso! Redirecionando...
          </div>
        )}

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
              placeholder="Escolha um nome de usuário"
              required
            />
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>E-mail</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Digite seu melhor e-mail"
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
              placeholder="Escolha uma senha forte"
              required
            />
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }} disabled={loading || success}>
            {loading ? 'Cadastrando...' : <><UserPlus size={20} /> Cadastrar</>}
          </button>
        </form>

        <p style={{ marginTop: '24px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Já possui uma conta? <Link to="/login" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 600 }}>Faça Login</Link>
        </p>
      </div>
    </div>
  );
}
