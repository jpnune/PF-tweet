import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { 
  MessageCircle, 
  Heart, 
  Repeat2, 
  Trash2, 
  LogOut, 
  Search, 
  Send, 
  Globe, 
  Home, 
  Moon, 
  Sun,
  User,
  X
} from 'lucide-react';

interface Tweet {
  id: number;
  user: {
    id: number;
    username: string;
    display_name: string;
    avatar_url: string;
  };
  content: string;
  created_at: string;
  parent: number | null;
  likes_count: number;
  retweets_count: number;
  comments_count: number;
  has_liked: boolean;
  parent_tweet: {
    id: number;
    username: string;
    display_name: string;
    avatar_url: string;
    content: string;
    created_at: string;
  } | null;
}

interface UserProfile {
  id: number;
  username: string;
  display_name: string;
  avatar_url: string;
  is_following: boolean;
}

interface Comment {
  id: number;
  user: {
    id: number;
    username: string;
    display_name: string;
    avatar_url: string;
  };
  tweet: number;
  content: string;
  created_at: string;
}

interface CurrentUser {
  id: number;
  username: string;
  email: string;
  display_name: string;
  avatar_url: string;
  followers_count: number;
  following_count: number;
}

export default function Feed() {
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(true);
  const [tweetContent, setTweetContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [feedType, setFeedType] = useState<'feed' | 'global'>('feed');
  const [theme, setTheme] = useState<'dark' | 'light'>('light');

  // New features state
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showConnectionsModal, setShowConnectionsModal] = useState(false);
  const [connectionsType, setConnectionsType] = useState<'followers' | 'following'>('following');
  const [connectionsList, setConnectionsList] = useState<UserProfile[]>([]);
  const [connectionsLoading, setConnectionsLoading] = useState(false);

  // Profile Form state
  const [profileDisplayName, setProfileDisplayName] = useState('');
  const [profileAvatarUrl, setProfileAvatarUrl] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileUpdating, setProfileUpdating] = useState(false);

  // Comments state
  const [expandedComments, setExpandedComments] = useState<Record<number, boolean>>({});
  const [commentsByTweet, setCommentsByTweet] = useState<Record<number, Comment[]>>({});
  const [newCommentText, setNewCommentText] = useState<Record<number, string>>({});
  const [commentsLoadingState, setCommentsLoadingState] = useState<Record<number, boolean>>({});
  
  const navigate = useNavigate();
  const currentUsername = localStorage.getItem('username') || '';

  // SVG parameters for the visual character counter
  const maxChars = 280;
  const radius = 12;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(tweetContent.length, maxChars) / maxChars) * circumference;

  useEffect(() => {
    // Validate auth on mount
    if (!localStorage.getItem('access_token')) {
      navigate('/login');
    } else {
      fetchCurrentUser();
    }
  }, [navigate]);

  useEffect(() => {
    fetchTweets();
  }, [feedType]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchUsers();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/api/users/me/');
      setCurrentUser(response.data);
      setProfileDisplayName(response.data.display_name || '');
      setProfileAvatarUrl(response.data.avatar_url || '');
    } catch (err) {
      console.error('Erro ao buscar usuário logado', err);
    }
  };

  const fetchTweets = async () => {
    setLoading(true);
    try {
      const endpoint = feedType === 'feed' ? '/api/tweets/' : '/api/tweets/global_feed/';
      const response = await api.get(endpoint);
      setTweets(response.data);
    } catch (err) {
      console.error('Erro ao buscar tweets', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get(`/api/users/?search=${searchQuery}`);
      setUsers(response.data);
    } catch (err) {
      console.error('Erro ao buscar usuários', err);
    }
  };

  const handlePostTweet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tweetContent.trim() || tweetContent.length > maxChars) return;

    try {
      const response = await api.post('/api/tweets/', { content: tweetContent });
      setTweets([response.data, ...tweets]);
      setTweetContent('');
    } catch (err) {
      console.error('Erro ao criar tweet', err);
    }
  };

  const handleLike = async (id: number) => {
    try {
      const response = await api.post(`/api/tweets/${id}/like/`);
      setTweets(tweets.map(t => {
        if (t.id === id) {
          return { ...t, has_liked: response.data.has_liked, likes_count: response.data.likes_count };
        }
        return t;
      }));
    } catch (err) {
      console.error('Erro ao curtir tweet', err);
    }
  };

  const handleRetweet = async (id: number) => {
    const comment = prompt('Escreva um comentário para o seu Retweet (opcional):') || '';
    try {
      const response = await api.post(`/api/tweets/${id}/retweet/`, { content: comment });
      setTweets([response.data, ...tweets]);
    } catch (err) {
      console.error('Erro ao retweetar', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Deseja excluir este tweet permanentemente?')) return;
    try {
      await api.delete(`/api/tweets/${id}/`);
      setTweets(tweets.filter(t => t.id !== id));
    } catch (err) {
      console.error('Erro ao excluir tweet', err);
    }
  };

  const handleFollowToggle = async (userId: number) => {
    try {
      const response = await api.post(`/api/users/${userId}/follow/`);
      setUsers(users.map(u => {
        if (u.id === userId) {
          return { ...u, is_following: response.data.is_following };
        }
        return u;
      }));
      // Update logged in user following counters
      fetchCurrentUser();
      // Refresh feed since follows changed
      if (feedType === 'feed') {
        fetchTweets();
      }
    } catch (err) {
      console.error('Erro ao seguir/desseguir', err);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileUpdating(true);
    setProfileError('');
    setProfileSuccess('');
    try {
      const data: any = {
        display_name: profileDisplayName,
        avatar_url: profileAvatarUrl
      };
      if (profilePassword.trim()) {
        data.password = profilePassword;
      }
      const response = await api.patch('/api/users/me/', data);
      setCurrentUser(response.data);
      setProfileSuccess('Perfil atualizado com sucesso!');
      setProfilePassword('');
      setTimeout(() => {
        setShowProfileModal(false);
        setProfileSuccess('');
      }, 1500);
    } catch (err: any) {
      setProfileError('Erro ao atualizar perfil. Verifique os dados.');
    } finally {
      setProfileUpdating(false);
    }
  };

  const handleShowConnections = async (type: 'followers' | 'following') => {
    if (!currentUser) return;
    setConnectionsType(type);
    setShowConnectionsModal(true);
    setConnectionsLoading(true);
    try {
      const response = await api.get(`/api/users/${currentUser.id}/${type}/`);
      setConnectionsList(response.data);
    } catch (err) {
      console.error('Erro ao carregar conexões', err);
    } finally {
      setConnectionsLoading(false);
    }
  };

  const handleConnectionFollowToggle = async (userId: number) => {
    try {
      const response = await api.post(`/api/users/${userId}/follow/`);
      setConnectionsList(connectionsList.map(u => {
        if (u.id === userId) {
          return { ...u, is_following: response.data.is_following };
        }
        return u;
      }));
      setUsers(users.map(u => {
        if (u.id === userId) {
          return { ...u, is_following: response.data.is_following };
        }
        return u;
      }));
      fetchCurrentUser();
      if (feedType === 'feed') {
        fetchTweets();
      }
    } catch (err) {
      console.error('Erro ao seguir/desseguir', err);
    }
  };

  const toggleComments = async (tweetId: number) => {
    const isExpanded = !!expandedComments[tweetId];
    setExpandedComments(prev => ({ ...prev, [tweetId]: !isExpanded }));
    
    if (!isExpanded) {
      setCommentsLoadingState(prev => ({ ...prev, [tweetId]: true }));
      try {
        const response = await api.get(`/api/comments/?tweet=${tweetId}`);
        setCommentsByTweet(prev => ({ ...prev, [tweetId]: response.data }));
      } catch (err) {
        console.error('Erro ao carregar comentários', err);
      } finally {
        setCommentsLoadingState(prev => ({ ...prev, [tweetId]: false }));
      }
    }
  };

  const handleCreateComment = async (e: React.FormEvent, tweetId: number) => {
    e.preventDefault();
    const text = newCommentText[tweetId] || '';
    if (!text.trim()) return;

    try {
      const response = await api.post('/api/comments/', {
        tweet: tweetId,
        content: text
      });
      setCommentsByTweet(prev => ({
        ...prev,
        [tweetId]: [...(prev[tweetId] || []), response.data]
      }));
      setNewCommentText(prev => ({ ...prev, [tweetId]: '' }));
      
      setTweets(tweets.map(t => {
        if (t.id === tweetId) {
          return { ...t, comments_count: (t.comments_count || 0) + 1 };
        }
        return t;
      }));
    } catch (err) {
      console.error('Erro ao postar comentário', err);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (nextTheme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  };

  // Determine SVG counter color
  const getCounterColor = () => {
    const len = tweetContent.length;
    if (len >= maxChars) return 'var(--error-color)';
    if (len >= maxChars - 20) return '#f59e0b'; // Amber/Orange
    return 'var(--primary-color)';
  };

  return (
    <div className="app-container">
      {/* LEFT SIDEBAR */}
      <aside className="left-sidebar" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '24px 0', borderRight: '1px solid var(--border-color)', height: '100vh', position: 'sticky', top: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '12px' }}>
            <div style={{ display: 'inline-flex', padding: '8px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px' }}>
              <MessageCircle size={28} color="#3b82f6" />
            </div>
            <span style={{ fontWeight: 700, fontSize: '1.2rem', display: 'block' }}>Chirp</span>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button 
              onClick={() => setFeedType('feed')}
              className="btn-secondary" 
              style={{ 
                border: 'none', 
                background: feedType === 'feed' ? 'var(--border-color)' : 'transparent',
                fontWeight: feedType === 'feed' ? 600 : 400,
                justifyContent: 'flex-start',
                width: '100%'
              }}
            >
              <Home size={20} color={feedType === 'feed' ? 'var(--primary-color)' : 'currentColor'} />
              <span>Feed Pessoal</span>
            </button>
            
            <button 
              onClick={() => setFeedType('global')}
              className="btn-secondary" 
              style={{ 
                border: 'none', 
                background: feedType === 'global' ? 'var(--border-color)' : 'transparent',
                fontWeight: feedType === 'global' ? 600 : 400,
                justifyContent: 'flex-start',
                width: '100%'
              }}
            >
              <Globe size={20} color={feedType === 'global' ? 'var(--accent-color)' : 'currentColor'} />
              <span>Descobrir</span>
            </button>

            <button 
              onClick={toggleTheme}
              className="btn-secondary" 
              style={{ border: 'none', background: 'transparent', justifyContent: 'flex-start', width: '100%' }}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              <span>Tema {theme === 'dark' ? 'Claro' : 'Escuro'}</span>
            </button>
          </nav>
        </div>

        <div style={{ padding: '0 12px' }}>
          {/* Profile overview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px', padding: '12px', background: 'var(--border-color)', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {currentUser?.avatar_url ? (
                <img src={currentUser.avatar_url} alt="Avatar" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600 }}>
                  {currentUsername.charAt(0).toUpperCase()}
                </div>
              )}
              <div style={{ textAlign: 'left', overflow: 'hidden' }}>
                <span style={{ fontWeight: 600, fontSize: '0.9rem', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {currentUser?.display_name || currentUsername}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>@{currentUsername}</span>
              </div>
            </div>
            {currentUser && (
              <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', marginTop: '4px' }}>
                <button 
                  onClick={() => handleShowConnections('following')} 
                  style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: 0, fontSize: '0.75rem' }}
                >
                  <strong>{currentUser.following_count}</strong> <span style={{ color: 'var(--text-muted)' }}>Seguindo</span>
                </button>
                <button 
                  onClick={() => handleShowConnections('followers')} 
                  style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: 0, fontSize: '0.75rem' }}
                >
                  <strong>{currentUser.followers_count}</strong> <span style={{ color: 'var(--text-muted)' }}>Seguidores</span>
                </button>
              </div>
            )}
          </div>

          <button 
            onClick={() => setShowProfileModal(true)} 
            className="btn-secondary" 
            style={{ width: '100%', marginBottom: '8px', justifyContent: 'center' }}
          >
            <User size={16} /> Editar Perfil
          </button>

          <button onClick={handleLogout} className="btn-secondary" style={{ width: '100%', borderColor: 'rgba(239, 68, 68, 0.2)', color: 'var(--error-color)', justifyContent: 'center' }}>
            <LogOut size={16} /> Sair
          </button>
        </div>
      </aside>

      {/* CENTER FEED */}
      <main style={{ padding: '24px 0', minWidth: 0 }}>
        <header style={{ marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '24px', margin: 0, fontWeight: 700 }}>
            {feedType === 'feed' ? 'Seu Feed' : 'Explore o Chirp'}
          </h1>
        </header>

        {/* TWEET CREATION BOX */}
        <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px' }}>
          <form onSubmit={handlePostTweet}>
            <textarea
              className="form-input"
              value={tweetContent}
              onChange={(e) => setTweetContent(e.target.value)}
              placeholder="O que está acontecendo?"
              style={{ width: '100%', minHeight: '100px', resize: 'none', border: 'none', background: 'transparent', padding: 0, fontSize: '1.1rem' }}
              maxLength={maxChars + 20}
            />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {tweetContent.length > 0 && (
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="32" height="32" style={{ transform: 'rotate(-90deg)' }}>
                      <circle
                        cx="16"
                        cy="16"
                        r={radius}
                        fill="transparent"
                        stroke="var(--border-color)"
                        strokeWidth="3"
                      />
                      <circle
                        cx="16"
                        cy="16"
                        r={radius}
                        fill="transparent"
                        stroke={getCounterColor()}
                        strokeWidth="3"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                      />
                    </svg>
                    <span style={{ 
                      position: 'absolute', 
                      fontSize: '0.7rem', 
                      fontWeight: 600, 
                      color: tweetContent.length > maxChars ? 'var(--error-color)' : 'var(--text-muted)' 
                    }}>
                      {maxChars - tweetContent.length}
                    </span>
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                className="btn-primary" 
                disabled={!tweetContent.trim() || tweetContent.length > maxChars}
                style={{ padding: '8px 16px', borderRadius: '20px' }}
              >
                <Send size={16} /> Enviar
              </button>
            </div>
          </form>
        </div>

        {/* FEED LIST */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {loading ? (
            // Skeleton loaders
            Array.from({ length: 4 }).map((_, index) => (
              <div className="glass-panel skeleton" key={index} style={{ padding: '20px', display: 'flex', gap: '16px', minHeight: '120px' }}>
                <div className="skeleton-avatar" />
                <div style={{ flex: 1 }}>
                  <div className="skeleton-text" style={{ width: '30%' }} />
                  <div className="skeleton-text" style={{ width: '90%' }} />
                  <div className="skeleton-text" style={{ width: '60%' }} />
                </div>
              </div>
            ))
          ) : tweets.length === 0 ? (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Nenhum chirp encontrado. Comece a seguir outras pessoas ou compartilhe algo!
            </div>
          ) : (
            tweets.map((tweet) => (
              <article className="glass-panel" key={tweet.id} style={{ padding: '20px', display: 'flex', gap: '14px', textAlign: 'left' }}>
                {/* User avatar on the left */}
                {tweet.user.avatar_url ? (
                  <img src={tweet.user.avatar_url} alt="Avatar" style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', marginTop: '3px' }} />
                ) : (
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600, fontSize: '1.1rem', marginTop: '3px', flexShrink: 0 }}>
                    {tweet.user.username.charAt(0).toUpperCase()}
                  </div>
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{tweet.user.display_name || tweet.user.username}</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>@{tweet.user.username}</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>•</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {new Date(tweet.created_at).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {tweet.user.username === currentUsername && (
                      <button 
                        onClick={() => handleDelete(tweet.id)} 
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--error-color)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  {/* Tweet text */}
                  <p style={{ fontSize: '1.05rem', lineHeight: '1.4', whiteSpace: 'pre-wrap', marginTop: '6px', marginBottom: '8px' }}>
                    {tweet.content}
                  </p>

                  {/* Parent / Retweet block */}
                  {tweet.parent_tweet && (
                    <div style={{ borderLeft: '3px solid var(--accent-color)', paddingLeft: '12px', margin: '8px 0', background: 'rgba(0, 0, 0, 0.02)', borderRadius: '0 8px 8px 0', padding: '10px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      {tweet.parent_tweet.avatar_url ? (
                        <img src={tweet.parent_tweet.avatar_url} alt="Avatar" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600, fontSize: '0.8rem', flexShrink: 0 }}>
                          {tweet.parent_tweet.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '2px' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{tweet.parent_tweet.display_name || tweet.parent_tweet.username}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{tweet.parent_tweet.username}</span>
                        </div>
                        <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', margin: 0 }}>{tweet.parent_tweet.content}</p>
                      </div>
                    </div>
                  )}

                  {/* Interactive buttons */}
                  <div style={{ display: 'flex', gap: '24px', marginTop: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                    <button 
                      onClick={() => handleLike(tweet.id)}
                      style={{ 
                        background: 'transparent', 
                        border: 'none', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px', 
                        cursor: 'pointer',
                        color: tweet.has_liked ? 'var(--error-color)' : 'var(--text-muted)'
                      }}
                    >
                      <Heart size={18} fill={tweet.has_liked ? 'var(--error-color)' : 'transparent'} />
                      <span style={{ fontSize: '0.85rem' }}>{tweet.likes_count}</span>
                    </button>

                    <button 
                      onClick={() => handleRetweet(tweet.id)}
                      style={{ 
                        background: 'transparent', 
                        border: 'none', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px', 
                        cursor: 'pointer',
                        color: 'var(--text-muted)'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--success-color)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                    >
                      <Repeat2 size={18} />
                      <span style={{ fontSize: '0.85rem' }}>{tweet.retweets_count}</span>
                    </button>

                    <button 
                      onClick={() => toggleComments(tweet.id)}
                      style={{ 
                        background: 'transparent', 
                        border: 'none', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px', 
                        cursor: 'pointer',
                        color: expandedComments[tweet.id] ? 'var(--primary-color)' : 'var(--text-muted)'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary-color)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = expandedComments[tweet.id] ? 'var(--primary-color)' : 'var(--text-muted)')}
                    >
                      <MessageCircle size={18} />
                      <span style={{ fontSize: '0.85rem' }}>{tweet.comments_count || 0}</span>
                    </button>
                  </div>

                  {/* Comments Section */}
                  {expandedComments[tweet.id] && (
                    <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                        {commentsLoadingState[tweet.id] ? (
                          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Carregando comentários...</span>
                        ) : !commentsByTweet[tweet.id] || commentsByTweet[tweet.id].length === 0 ? (
                          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Nenhum comentário ainda. Seja o primeiro!</span>
                        ) : (
                          commentsByTweet[tweet.id].map(comment => (
                            <div key={comment.id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', background: 'rgba(0, 0, 0, 0.02)', padding: '10px', borderRadius: '8px' }}>
                              {comment.user.avatar_url ? (
                                <img src={comment.user.avatar_url} alt="Avatar" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                              ) : (
                                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.8rem', fontWeight: 600, flexShrink: 0 }}>
                                  {comment.user.username.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div style={{ flex: 1, textAlign: 'left' }}>
                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '2px' }}>
                                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{comment.user.display_name || comment.user.username}</span>
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{comment.user.username}</span>
                                </div>
                                <p style={{ fontSize: '0.9rem', margin: 0 }}>{comment.content}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Comment Input Form */}
                      <form onSubmit={(e) => handleCreateComment(e, tweet.id)} style={{ display: 'flex', gap: '10px' }}>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Escreva um comentário..."
                          value={newCommentText[tweet.id] || ''}
                          onChange={(e) => setNewCommentText(prev => ({ ...prev, [tweet.id]: e.target.value }))}
                          style={{ padding: '8px 12px', fontSize: '0.9rem' }}
                        />
                        <button type="submit" className="btn-primary" style={{ padding: '8px 16px', borderRadius: '10px' }}>
                          Comentar
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      </main>

      {/* RIGHT SIDEBAR - SEARCH & USERS */}
      <aside style={{ padding: '24px 0', display: 'flex', flexDirection: 'column', gap: '20px', borderLeft: '1px solid var(--border-color)', height: '100vh', position: 'sticky', top: 0, paddingLeft: '24px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '15px' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Procurar usuários..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '44px' }}
          />
        </div>

        <div className="glass-panel" style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', textAlign: 'left' }}>
            {feedType === 'feed' ? 'Seguindo' : 'Quem seguir'}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
            {users.filter(user => feedType === 'global' || user.is_following).length === 0 ? (
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textAlign: 'left' }}>
                {feedType === 'feed' ? 'Você não está seguindo ninguém ainda.' : 'Nenhum perfil encontrado.'}
              </span>
            ) : (
              users
                .filter(user => feedType === 'global' || user.is_following)
                .map(user => (
                  <div key={user.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                    <div style={{ textAlign: 'left', minWidth: 0 }}>
                      <span style={{ fontWeight: 600, display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>@{user.username}</span>
                    </div>
                    <button 
                      onClick={() => handleFollowToggle(user.id)}
                      className={user.is_following ? 'btn-secondary' : 'btn-primary'}
                      style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '15px' }}
                    >
                      {user.is_following ? 'Seguindo' : 'Seguir'}
                    </button>
                  </div>
                ))
            )}
          </div>
        </div>
      </aside>

      {/* PROFILE MODAL */}
      {showProfileModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '24px', background: 'var(--bg-app)', position: 'relative' }}>
            <button 
              onClick={() => setShowProfileModal(false)}
              style={{ position: 'absolute', right: '16px', top: '16px', background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '20px', textAlign: 'left' }}>Editar Perfil</h2>
            
            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Nome de Exibição (Opcional)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Seu nome bonito" 
                  value={profileDisplayName}
                  onChange={(e) => setProfileDisplayName(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Foto de Perfil URL (Opcional)</label>
                <input 
                  type="url" 
                  className="form-input" 
                  placeholder="https://exemplo.com/suafoto.jpg" 
                  value={profileAvatarUrl}
                  onChange={(e) => setProfileAvatarUrl(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Nova Senha (Opcional)</label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="Digite uma nova senha" 
                  value={profilePassword}
                  onChange={(e) => setProfilePassword(e.target.value)}
                />
              </div>

              {profileError && <span style={{ color: 'var(--error-color)', fontSize: '0.85rem' }}>{profileError}</span>}
              {profileSuccess && <span style={{ color: 'var(--success-color)', fontSize: '0.85rem' }}>{profileSuccess}</span>}

              <button type="submit" className="btn-primary" disabled={profileUpdating} style={{ padding: '12px', borderRadius: '10px', marginTop: '8px', justifyContent: 'center' }}>
                {profileUpdating ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CONNECTIONS (FOLLOWERS/FOLLOWING) MODAL */}
      {showConnectionsModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', maxHeight: '480px', padding: '24px', background: 'var(--bg-app)', position: 'relative', display: 'flex', flexDirection: 'column' }}>
            <button 
              onClick={() => setShowConnectionsModal(false)}
              style={{ position: 'absolute', right: '16px', top: '16px', background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '20px', textAlign: 'left' }}>
              {connectionsType === 'followers' ? 'Seguidores' : 'Seguindo'}
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', flex: 1 }}>
              {connectionsLoading ? (
                <span style={{ color: 'var(--text-muted)' }}>Carregando...</span>
              ) : connectionsList.length === 0 ? (
                <span style={{ color: 'var(--text-muted)' }}>Nenhum usuário nesta lista.</span>
              ) : (
                connectionsList.map(u => (
                  <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, textAlign: 'left' }}>
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt="Avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.8rem', fontWeight: 600, flexShrink: 0 }}>
                          {u.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div style={{ minWidth: 0 }}>
                        <span style={{ fontWeight: 600, display: 'block', fontSize: '0.9rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{u.display_name || u.username}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>@{u.username}</span>
                      </div>
                    </div>
                    {u.username !== currentUsername && (
                      <button 
                        onClick={() => handleConnectionFollowToggle(u.id)}
                        className={u.is_following ? 'btn-secondary' : 'btn-primary'}
                        style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '15px' }}
                      >
                        {u.is_following ? 'Seguindo' : 'Seguir'}
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
