import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Grid, TextField, Button, Alert, Snackbar,
  Dialog, DialogTitle, DialogContent, DialogActions, Divider, Switch,
  FormControlLabel, List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, Chip,
} from '@mui/material';
import { Save, Backup, Restore, Delete, Schedule, Storage } from '@mui/icons-material';
import { settingsApi, backupApi } from '../services/api';

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>({});
  const [backups, setBackups] = useState<any[]>([]);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' as any });
  const [restoreDialog, setRestoreDialog] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [gstError, setGstError] = useState('');

  const validateGST = (gst: string): boolean => {
    if (!gst) return true; // optional
    gst = gst.toUpperCase().trim();
    if (gst.length !== 15) return false;
    // Format: 2 digit state code + 5 letters (PAN) + 4 digits + 1 letter + 1 alphanumeric entity + Z + 1 check digit
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstRegex.test(gst)) return false;
    const stateCode = parseInt(gst.substring(0, 2));
    if (stateCode < 1 || stateCode > 37) return false;
    return true;
  };

  const handleGstSave = () => {
    const gst = (settings.gst_number || '').toUpperCase().trim();
    if (gst && !validateGST(gst)) {
      setGstError('Invalid GSTIN. Format: 2-digit state code + 10-char PAN + entity number + Z + check digit (e.g. 29ABCDE1234F1Z5)');
      return;
    }
    setGstError('');
    saveSetting('gst_number', gst);
  };

  useEffect(() => {
    settingsApi.getAll().then(r => {
      if (r.data && typeof r.data === 'object') {
        // Backend returns Map<String, String> directly
        if (Array.isArray(r.data)) {
          const map: any = {};
          r.data.forEach((s: any) => map[s.settingKey] = s.settingValue);
          setSettings(map);
        } else {
          setSettings(r.data);
        }
      }
    }).catch(() => {});
    backupApi.list().then(r => {
      const items = Array.isArray(r.data) ? r.data : [];
      setBackups(items);
    }).catch(() => setBackups([]));
  }, []);

  const saveSetting = async (key: string, value: string) => {
    try {
      await settingsApi.update({ [key]: value });
      setSnack({ open: true, message: 'Setting saved!', severity: 'success' });
    } catch (e) {
      setSnack({ open: true, message: 'Failed to save setting', severity: 'error' });
    }
  };

  const updateField = (key: string, value: string) => {
    setSettings({ ...settings, [key]: value });
  };

  const handleBackup = async () => {
    setLoading(true);
    try {
      const res = await backupApi.create();
      setSnack({ open: true, message: `Backup created successfully`, severity: 'success' });
      backupApi.list().then(r => setBackups(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    } catch (e) {
      setSnack({ open: true, message: 'Backup failed', severity: 'error' });
    }
    setLoading(false);
  };

  const handleRestore = async () => {
    if (!restoreDialog) return;
    setLoading(true);
    try {
      await backupApi.restore(restoreDialog);
      setSnack({ open: true, message: 'Restore successful! App will reload.', severity: 'success' });
      setRestoreDialog(null);
      setTimeout(() => window.location.reload(), 2000);
    } catch (e) {
      setSnack({ open: true, message: 'Restore failed', severity: 'error' });
    }
    setLoading(false);
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ color: '#1a237e' }}>Settings</Typography>
        <Typography variant="body2" color="text.secondary">Configure your application preferences</Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" gutterBottom>Company Information</Typography>
            <TextField fullWidth label="Company Name" value={settings.company_name || ''} margin="normal" required
              onChange={e => updateField('company_name', e.target.value)}
              onBlur={() => saveSetting('company_name', settings.company_name || '')}
              helperText="Appears on invoices and reports" />
            <TextField fullWidth label="Owner / Proprietor Name" value={settings.owner_name || ''} margin="normal"
              onChange={e => updateField('owner_name', e.target.value)}
              onBlur={() => saveSetting('owner_name', settings.owner_name || '')} />
            <TextField fullWidth label="Company Address" value={settings.company_address || ''} margin="normal" multiline rows={2}
              onChange={e => updateField('company_address', e.target.value)}
              onBlur={() => saveSetting('company_address', settings.company_address || '')} />
            <TextField fullWidth label="Company Phone" value={settings.company_phone || ''} margin="normal"
              onChange={e => updateField('company_phone', e.target.value)}
              onBlur={() => saveSetting('company_phone', settings.company_phone || '')}
              inputProps={{ maxLength: 10 }} />
            <TextField fullWidth label="GST Number (GSTIN)" value={settings.gst_number || ''} margin="normal"
              onChange={e => { updateField('gst_number', e.target.value.toUpperCase()); setGstError(''); }}
              onBlur={handleGstSave}
              error={!!gstError}
              helperText={gstError || 'Format: 29ABCDE1234F1Z5 (15 characters)'}
              inputProps={{ maxLength: 15, style: { textTransform: 'uppercase' } }} />
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" gutterBottom>Invoice Settings</Typography>
            <TextField fullWidth label="Invoice Prefix" value={settings.invoice_prefix || ''} margin="normal"
              onChange={e => updateField('invoice_prefix', e.target.value)}
              onBlur={() => saveSetting('invoice_prefix', settings.invoice_prefix || '')} />
            <TextField fullWidth label="Default GST %" type="number" value={settings.default_gst_percentage || ''} margin="normal"
              onChange={e => updateField('default_gst_percentage', e.target.value)}
              onBlur={() => saveSetting('default_gst_percentage', settings.default_gst_percentage || '')} />
            <TextField fullWidth label="Default Due Days" type="number" value={settings.default_due_days || ''} margin="normal"
              onChange={e => updateField('default_due_days', e.target.value)}
              onBlur={() => saveSetting('default_due_days', settings.default_due_days || '')} />
            <TextField fullWidth label="Currency Symbol" value={settings.currency_symbol || ''} margin="normal"
              onChange={e => updateField('currency_symbol', e.target.value)}
              onBlur={() => saveSetting('currency_symbol', settings.currency_symbol || '')} />
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Backup & Restore</Typography>
              <Button variant="contained" startIcon={<Backup />} onClick={handleBackup} disabled={loading}>
                Create Backup Now
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            {backups.length === 0 ? (
              <Typography color="text.secondary">No backups found. Create your first backup above.</Typography>
            ) : (
              <List>
                {backups.map((backup, idx) => {
                  const fileName = typeof backup === 'string' ? backup : (backup.fileName || backup.filePath || 'Unknown');
                  const filePath = typeof backup === 'string' ? backup : (backup.filePath || backup.fileName || '');
                  const size = backup.size ? `${(backup.size / 1024).toFixed(1)} KB` : '';
                  const created = backup.created ? new Date(backup.created).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '';
                  return (
                    <ListItem key={idx} sx={{ bgcolor: idx % 2 === 0 ? '#f5f7fa' : 'transparent', borderRadius: 1 }}>
                      <Storage sx={{ mr: 2, color: '#1a237e', opacity: 0.6 }} />
                      <ListItemText
                        primary={fileName}
                        secondary={[created, size].filter(Boolean).join(' • ') || `Backup #${backups.length - idx}`}
                      />
                      <ListItemSecondaryAction>
                        <Button size="small" startIcon={<Restore />} color="warning"
                          onClick={() => setRestoreDialog(filePath)}>
                          Restore
                        </Button>
                      </ListItemSecondaryAction>
                    </ListItem>
                  );
                })}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={!!restoreDialog} onClose={() => setRestoreDialog(null)}>
        <DialogTitle>Confirm Restore</DialogTitle>
        <DialogContent>
          <Typography>Restore from backup <strong>{restoreDialog}</strong>?</Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>This will replace all current data. Make sure to backup first.</Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestoreDialog(null)}>Cancel</Button>
          <Button variant="contained" color="warning" onClick={handleRestore} disabled={loading}>Restore</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack({ ...snack, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snack.severity} onClose={() => setSnack({ ...snack, open: false })}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
}
