import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  AppBar, Toolbar, Typography, IconButton, Chip, Avatar, Divider, Tooltip,
} from '@mui/material';
import {
  Dashboard, People, Inventory, Receipt, Payment, Assessment,
  Settings, Logout, Store, NotificationsNone, PersonOutline,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const DRAWER_WIDTH = 270;

const navItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/' },
  { text: 'Customers', icon: <People />, path: '/customers' },
  { text: 'Products', icon: <Inventory />, path: '/products' },
  { text: 'Invoices', icon: <Receipt />, path: '/invoices' },
  { text: 'Payments', icon: <Payment />, path: '/payments' },
  { text: 'Reports', icon: <Assessment />, path: '/reports' },
  { text: 'Users', icon: <PersonOutline />, path: '/users' },
  { text: 'Settings', icon: <Settings />, path: '/settings' },
];

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { username, role, fullName, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            background: 'linear-gradient(180deg, #0d1b3e 0%, #1a237e 40%, #283593 100%)',
            color: '#fff',
            border: 'none',
            boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
          },
        }}
      >
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Box sx={{
            width: 56, height: 56, borderRadius: 3, mx: 'auto', mb: 1.5,
            background: 'linear-gradient(135deg, #d4a017 0%, #f5c842 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(212,160,23,0.4)',
          }}>
            <Store sx={{ fontSize: 32, color: '#fff' }} />
          </Box>
          <Typography variant="h5" fontWeight={800} color="#fff" sx={{ letterSpacing: '-0.5px' }}>
            AVP Nexus
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
            Billing & Payments Platform
          </Typography>
        </Box>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mx: 2.5 }} />
        <List sx={{ px: 1.5, mt: 2 }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  sx={{
                    borderRadius: 2.5, mx: 0.5, py: 1.3,
                    backgroundColor: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                    backdropFilter: isActive ? 'blur(10px)' : 'none',
                    border: isActive ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)', transform: 'translateX(4px)' },
                    transition: 'all 0.2s ease',
                  }}
                >
                  <ListItemIcon sx={{
                    color: isActive ? '#f5c842' : 'rgba(255,255,255,0.6)',
                    minWidth: 40,
                    transition: 'color 0.2s',
                  }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    sx={{ '& .MuiTypography-root': { fontWeight: isActive ? 700 : 400, fontSize: 14, letterSpacing: '0.01em' } }}
                  />
                  {isActive && (
                    <Box sx={{ width: 4, height: 24, borderRadius: 2, bgcolor: '#d4a017', ml: 1 }} />
                  )}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
        <Box sx={{ flexGrow: 1 }} />
        <Box sx={{ p: 2.5 }}>
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5,
            bgcolor: 'rgba(255,255,255,0.06)', borderRadius: 3, border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <Avatar sx={{
              width: 36, height: 36,
              background: 'linear-gradient(135deg, #d4a017 0%, #f5c842 100%)',
              fontSize: 14, fontWeight: 700,
            }}>
              {(fullName || username || 'U').charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" fontWeight={600} color="#fff" noWrap>{fullName || username}</Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>{role}</Typography>
            </Box>
            <Tooltip title="Logout">
              <IconButton size="small" onClick={handleLogout} sx={{ color: 'rgba(255,255,255,0.5)', '&:hover': { color: '#d4a017' } }}>
                <Logout fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Drawer>

      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <AppBar position="static" elevation={0} sx={{
          bgcolor: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
        }}>
          <Toolbar sx={{ minHeight: '64px !important' }}>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" sx={{ color: '#1a237e', fontWeight: 800 }}>
                {navItems.find(n => location.pathname === n.path ||
                  (n.path !== '/' && location.pathname.startsWith(n.path)))?.text || 'AVP Nexus'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', mt: -0.5, display: 'block' }}>
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </Typography>
            </Box>
            <Tooltip title="Notifications">
              <IconButton sx={{ mr: 1 }}>
                <NotificationsNone />
              </IconButton>
            </Tooltip>
            <Chip
              label={role}
              size="small"
              sx={{
                bgcolor: '#d4a017', color: '#fff', fontWeight: 600,
                '& .MuiChip-label': { px: 1.5 },
              }}
            />
          </Toolbar>
        </AppBar>

        <Box sx={{ flexGrow: 1, p: 3, bgcolor: '#f5f3ee', overflow: 'auto', minWidth: 0 }}>
          <Outlet />
        </Box>
        <Box sx={{
          py: 1.5, textAlign: 'center',
          bgcolor: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid rgba(0,0,0,0.04)',
        }}>
          <Typography variant="caption" color="text.secondary" fontWeight={500}>
            © 2026 AVP Nexus — Built with precision
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
