import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Grid, TextField, Button, Alert, Snackbar, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, Avatar, Divider,
  Table, TableHead, TableBody, TableRow, TableCell, IconButton, Switch, MenuItem,
  InputAdornment,
} from '@mui/material';
import { Person, Lock, History, PersonAdd, Edit, Block, CheckCircle, Visibility, VisibilityOff, Key } from '@mui/icons-material';
import { userApi, authApi, auditApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function UserProfilePage() {
  const { username, role, fullName } = useAuth();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' as any });
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [registerDialog, setRegisterDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [editUserDialog, setEditUserDialog] = useState(false);
  const [resetPasswordDialog, setResetPasswordDialog] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' });
  const [registerForm, setRegisterForm] = useState({ username: '', password: '', fullName: '', email: '', role: 'CASHIER' });
  const [editForm, setEditForm] = useState({ fullName: '', email: '' });
  const [editUserForm, setEditUserForm] = useState({ id: 0, username: '', fullName: '', email: '', role: '' });
  const [resetPasswordForm, setResetPasswordForm] = useState({ userId: 0, username: '', newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    userApi.getMe().then(r => setCurrentUser(r.data)).catch(() => {});
    userApi.getAll().then(r => setUsers(r.data || [])).catch(() => {});
    auditApi.getAll({ username, size: 20, sort: 'timestamp,desc' }).then(r => {
      const d = r.data;
      setActivities(d.content || d._embedded?.auditLogs || []);
    }).catch(() => {});
  };

  const handleChangePassword = async () => {
    setError('');
    if (passwordForm.newPassword.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    try {
      await userApi.changePassword(currentUser.id, passwordForm.newPassword);
      setPasswordDialog(false);
      setPasswordForm({ newPassword: '', confirmPassword: '' });
      setSnack({ open: true, message: 'Password changed successfully', severity: 'success' });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to change password');
    }
  };

  const handleRegister = async () => {
    setError('');
    if (!registerForm.username || !registerForm.password || !registerForm.fullName) {
      setError('Username, password and full name are required');
      return;
    }
    try {
      await authApi.register(registerForm);
      setRegisterDialog(false);
      setRegisterForm({ username: '', password: '', fullName: '', email: '', role: 'CASHIER' });
      setSnack({ open: true, message: 'User created successfully', severity: 'success' });
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create user');
    }
  };

  const handleUpdateProfile = async () => {
    setError('');
    try {
      await userApi.update(currentUser.id, editForm);
      setEditDialog(false);
      setSnack({ open: true, message: 'Profile updated', severity: 'success' });
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleToggleActive = async (userId: number) => {
    try {
      await userApi.toggleActive(userId);
      loadData();
      setSnack({ open: true, message: 'User status updated', severity: 'success' });
    } catch (err: any) {
      setSnack({ open: true, message: 'Failed to update user', severity: 'error' });
    }
  };

  const handleEditUser = async () => {
    setError('');
    if (!editUserForm.fullName) {
      setError('Full name is required');
      return;
    }
    try {
      await userApi.update(editUserForm.id, { fullName: editUserForm.fullName, email: editUserForm.email });
      setEditUserDialog(false);
      setSnack({ open: true, message: 'User updated successfully', severity: 'success' });
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update user');
    }
  };

  const handleResetPassword = async () => {
    setError('');
    if (resetPasswordForm.newPassword.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }
    if (resetPasswordForm.newPassword !== resetPasswordForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    try {
      await userApi.changePassword(resetPasswordForm.userId, resetPasswordForm.newPassword);
      setResetPasswordDialog(false);
      setResetPasswordForm({ userId: 0, username: '', newPassword: '', confirmPassword: '' });
      setSnack({ open: true, message: 'Password reset successfully', severity: 'success' });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password');
    }
  };

  return (
    <Box sx={{ maxWidth: '100%', overflow: 'hidden' }}>
      <Typography variant="h5" fontWeight={800} sx={{ color: '#1a237e', mb: 0.5 }}>User Management</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Profile, security & user accounts</Typography>

      <Grid container spacing={3}>
        {/* Profile Card */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3, textAlign: 'center' }}>
            <Avatar sx={{
              width: 72, height: 72, mx: 'auto', mb: 2, fontSize: 28, fontWeight: 700,
              background: 'linear-gradient(135deg, #1a237e 0%, #3949ab 100%)',
            }}>
              {(fullName || username || 'U').charAt(0).toUpperCase()}
            </Avatar>
            <Typography variant="h6" fontWeight={700}>{currentUser?.fullName || fullName}</Typography>
            <Typography variant="body2" color="text.secondary">{currentUser?.email || 'No email set'}</Typography>
            <Chip label={role} size="small" sx={{ mt: 1, bgcolor: '#e8eaf6', color: '#1a237e', fontWeight: 600 }} />
            <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
              @{username}
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button size="small" variant="outlined" startIcon={<Edit />} onClick={() => {
                setEditForm({ fullName: currentUser?.fullName || '', email: currentUser?.email || '' });
                setEditDialog(true);
                setError('');
              }}>Edit Profile</Button>
              <Button size="small" variant="outlined" color="warning" startIcon={<Lock />}
                onClick={() => { setPasswordDialog(true); setError(''); setPasswordForm({ newPassword: '', confirmPassword: '' }); setShowNewPassword(false); setShowConfirmPassword(false); }}>
                Change Password
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <History sx={{ color: '#1a237e' }} />
              <Typography variant="h6" fontWeight={700}>Recent Activity</Typography>
            </Box>
            {activities.length === 0 ? (
              <Typography color="text.secondary" variant="body2">No recent activity</Typography>
            ) : (
              <Box sx={{ maxHeight: 280, overflow: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ '& th': { fontWeight: 600, bgcolor: '#f8f9ff', fontSize: 12 } }}>
                      <TableCell>Action</TableCell>
                      <TableCell>Entity</TableCell>
                      <TableCell>Details</TableCell>
                      <TableCell>Time</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {activities.map((a: any, i: number) => (
                      <TableRow key={i} sx={{ '& td': { fontSize: 12, py: 0.8 } }}>
                        <TableCell>
                          <Chip label={a.action} size="small" variant="outlined"
                            color={a.action === 'LOGIN' ? 'primary' : a.action === 'CREATE' ? 'success' : 'default'}
                            sx={{ fontSize: 11 }} />
                        </TableCell>
                        <TableCell>{a.entityType}</TableCell>
                        <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {a.details}
                        </TableCell>
                        <TableCell>{a.timestamp ? new Date(a.timestamp).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : ''}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* User Management (Admin Only) */}
        {role === 'ADMIN' && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Person sx={{ color: '#1a237e' }} />
                  <Typography variant="h6" fontWeight={700}>All Users</Typography>
                </Box>
                <Button size="small" variant="contained" startIcon={<PersonAdd />}
                  onClick={() => { setRegisterDialog(true); setError(''); }}
                  sx={{ background: 'linear-gradient(135deg, #1a237e 0%, #3949ab 100%)' }}>
                  Add User
                </Button>
              </Box>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { fontWeight: 600, bgcolor: '#f8f9ff' } }}>
                    <TableCell>Username</TableCell>
                    <TableCell>Full Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((u: any) => (
                    <TableRow key={u.id}>
                      <TableCell sx={{ fontWeight: 600 }}>{u.username}</TableCell>
                      <TableCell>{u.fullName}</TableCell>
                      <TableCell>{u.email || '-'}</TableCell>
                      <TableCell><Chip label={u.role} size="small" color={u.role === 'ADMIN' ? 'primary' : 'default'} /></TableCell>
                      <TableCell>
                        <Chip label={u.active ? 'Active' : 'Inactive'} size="small"
                          color={u.active ? 'success' : 'error'} variant="outlined" />
                      </TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN') : '-'}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton size="small" color="primary"
                            onClick={() => {
                              setEditUserForm({ id: u.id, username: u.username, fullName: u.fullName || '', email: u.email || '', role: u.role || '' });
                              setEditUserDialog(true);
                              setError('');
                            }}
                            title="Edit User">
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="warning"
                            onClick={() => {
                              setResetPasswordForm({ userId: u.id, username: u.username, newPassword: '', confirmPassword: '' });
                              setResetPasswordDialog(true);
                              setError('');
                              setShowNewPassword(false);
                              setShowConfirmPassword(false);
                            }}
                            title="Reset Password">
                            <Key fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color={u.active ? 'error' : 'success'}
                            onClick={() => handleToggleActive(u.id)}
                            title={u.active ? 'Deactivate' : 'Activate'}>
                            {u.active ? <Block fontSize="small" /> : <CheckCircle fontSize="small" />}
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialog} onClose={() => setPasswordDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField fullWidth label="New Password" 
            type={showNewPassword ? 'text' : 'password'} 
            value={passwordForm.newPassword}
            onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} 
            margin="normal" required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setShowNewPassword(!showNewPassword)}>
                    {showNewPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField fullWidth label="Confirm Password" 
            type={showConfirmPassword ? 'text' : 'password'} 
            value={passwordForm.confirmPassword}
            onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} 
            margin="normal" required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPasswordDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleChangePassword}>Update Password</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField fullWidth label="Full Name" value={editForm.fullName}
            onChange={e => setEditForm({ ...editForm, fullName: e.target.value })} margin="normal" required />
          <TextField fullWidth label="Email" type="email" value={editForm.email}
            onChange={e => setEditForm({ ...editForm, email: e.target.value })} margin="normal" />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdateProfile}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Register User Dialog */}
      <Dialog open={registerDialog} onClose={() => setRegisterDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New User</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField fullWidth label="Username" value={registerForm.username}
            onChange={e => setRegisterForm({ ...registerForm, username: e.target.value })} margin="normal" required />
          <TextField fullWidth label="Full Name" value={registerForm.fullName}
            onChange={e => setRegisterForm({ ...registerForm, fullName: e.target.value })} margin="normal" required />
          <TextField fullWidth label="Email" type="email" value={registerForm.email}
            onChange={e => setRegisterForm({ ...registerForm, email: e.target.value })} margin="normal" />
          <TextField fullWidth label="Password" 
            type={showPassword ? 'text' : 'password'} 
            value={registerForm.password}
            onChange={e => setRegisterForm({ ...registerForm, password: e.target.value })} 
            margin="normal" required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField select fullWidth label="Role" value={registerForm.role}
            onChange={e => setRegisterForm({ ...registerForm, role: e.target.value })} margin="normal">
            <MenuItem value="CASHIER">Cashier</MenuItem>
            <MenuItem value="MANAGER">Manager</MenuItem>
            <MenuItem value="ADMIN">Admin</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRegisterDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleRegister}>Create User</Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog (Admin) */}
      <Dialog open={editUserDialog} onClose={() => setEditUserDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Edit User: {editUserForm.username}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField fullWidth label="Username" value={editUserForm.username} margin="normal" disabled
            helperText="Username cannot be changed" />
          <TextField fullWidth label="Full Name" value={editUserForm.fullName}
            onChange={e => setEditUserForm({ ...editUserForm, fullName: e.target.value })} margin="normal" required />
          <TextField fullWidth label="Email" type="email" value={editUserForm.email}
            onChange={e => setEditUserForm({ ...editUserForm, email: e.target.value })} margin="normal" />
          <TextField fullWidth label="Role" value={editUserForm.role} margin="normal" disabled
            helperText="Role change not supported from here" />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditUserDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditUser}>Save Changes</Button>
        </DialogActions>
      </Dialog>

      {/* Reset Password Dialog (Admin) */}
      <Dialog open={resetPasswordDialog} onClose={() => setResetPasswordDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Reset Password: {resetPasswordForm.username}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Alert severity="info" sx={{ mb: 2 }}>Set a new password for user <strong>{resetPasswordForm.username}</strong></Alert>
          <TextField fullWidth label="New Password" 
            type={showNewPassword ? 'text' : 'password'} 
            value={resetPasswordForm.newPassword}
            onChange={e => setResetPasswordForm({ ...resetPasswordForm, newPassword: e.target.value })} 
            margin="normal" required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setShowNewPassword(!showNewPassword)}>
                    {showNewPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField fullWidth label="Confirm Password" 
            type={showConfirmPassword ? 'text' : 'password'} 
            value={resetPasswordForm.confirmPassword}
            onChange={e => setResetPasswordForm({ ...resetPasswordForm, confirmPassword: e.target.value })} 
            margin="normal" required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setResetPasswordDialog(false)}>Cancel</Button>
          <Button variant="contained" color="warning" onClick={handleResetPassword}>Reset Password</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack({ ...snack, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snack.severity} onClose={() => setSnack({ ...snack, open: false })}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
}
