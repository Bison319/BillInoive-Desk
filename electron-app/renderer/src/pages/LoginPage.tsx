import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, TextField, Button, Typography, Alert, Avatar, Paper,
  InputAdornment, IconButton,
} from '@mui/material';
import { Store, Login, Person, Lock, Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) { navigate('/'); return null; }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0d1b3e 0%, #1a237e 30%, #283593 60%, #3949ab 100%)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Decorative background circles */}
      <Box sx={{
        position: 'absolute', width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,109,0,0.15) 0%, transparent 70%)',
        top: -150, right: -100,
      }} />
      <Box sx={{
        position: 'absolute', width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(57,73,171,0.3) 0%, transparent 70%)',
        bottom: -100, left: -100,
      }} />

      <Card sx={{
        maxWidth: 440, width: '100%', mx: 2, borderRadius: 5,
        overflow: 'visible', position: 'relative',
        boxShadow: '0 32px 64px rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}>
        <CardContent sx={{ p: 5 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box sx={{
              width: 72, height: 72, borderRadius: 4, mx: 'auto', mb: 2,
              background: 'linear-gradient(135deg, #ff6d00 0%, #ff9e40 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(255,109,0,0.35)',
            }}>
              <Store sx={{ fontSize: 40, color: '#fff' }} />
            </Box>
            <Typography variant="h4" fontWeight={800} sx={{ color: '#1a237e' }}>AVP Nexus</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Sign in to your billing platform
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth label="Username" value={username} onChange={e => setUsername(e.target.value)}
              required margin="normal" autoFocus
              InputProps={{
                startAdornment: <InputAdornment position="start"><Person sx={{ color: 'text.secondary' }} /></InputAdornment>,
              }}
            />
            <TextField
              fullWidth label="Password" type={showPassword ? 'text' : 'password'} value={password}
              onChange={e => setPassword(e.target.value)} required margin="normal"
              InputProps={{
                startAdornment: <InputAdornment position="start"><Lock sx={{ color: 'text.secondary' }} /></InputAdornment>,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              type="submit" fullWidth variant="contained" size="large" disabled={loading}
              startIcon={<Login />}
              sx={{
                mt: 3, py: 1.6, fontSize: 16, fontWeight: 700, borderRadius: 3,
                background: 'linear-gradient(135deg, #1a237e 0%, #3949ab 100%)',
                boxShadow: '0 8px 24px rgba(26,35,126,0.35)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #0d1642 0%, #1a237e 100%)',
                  boxShadow: '0 12px 32px rgba(26,35,126,0.45)',
                },
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <Paper sx={{
            mt: 3, p: 2, bgcolor: '#f8f9ff', borderRadius: 3,
            border: '1px solid #e8eaf6',
          }}>
            <Typography variant="caption" color="text.secondary" display="block" textAlign="center">
              Demo credentials: <strong>admin</strong> / <strong>admin123</strong>
            </Typography>
          </Paper>
        </CardContent>
      </Card>
    </Box>
  );
}
