import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Typography, IconButton, Chip, Alert,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Add, Edit, Delete, Search } from '@mui/icons-material';
import { customerApi } from '../services/api';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any>({ content: [], totalElements: 0 });
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ mobileNumber: '', customerName: '', email: '', address: '', gstNumber: '' });
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    try {
      const res = await customerApi.getAll({ name: search || undefined, page, size: pageSize, sort: 'customerName,asc' });
      const d = res.data;
      const content = d.content || d._embedded?.customers || [];
      const total = d.totalElements ?? d.page?.totalElements ?? content.length;
      setCustomers({ content, totalElements: total });
    } catch (e) {}
  }, [page, pageSize, search]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async () => {
    setError('');
    try {
      if (editing) {
        await customerApi.update(editing.mobileNumber, form);
      } else {
        await customerApi.create(form);
      }
      setDialogOpen(false);
      setEditing(null);
      setForm({ mobileNumber: '', customerName: '', email: '', address: '', gstNumber: '' });
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save');
    }
  };

  const handleEdit = (row: any) => {
    setEditing(row);
    setForm({ mobileNumber: row.mobileNumber, customerName: row.customerName, email: row.email || '', address: row.address || '', gstNumber: row.gstNumber || '' });
    setDialogOpen(true);
  };

  const handleDelete = async (mobile: string) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      await customerApi.delete(mobile);
      loadData();
    }
  };

  const columns: GridColDef[] = [
    { field: 'customerName', headerName: 'Name', flex: 1, minWidth: 150 },
    { field: 'mobileNumber', headerName: 'Mobile', width: 130 },
    { field: 'email', headerName: 'Email', flex: 1, minWidth: 180 },
    { field: 'gstNumber', headerName: 'GST Number', width: 170 },
    { field: 'address', headerName: 'Address', flex: 1, minWidth: 200 },
    {
      field: 'active', headerName: 'Status', width: 100,
      renderCell: (p) => <Chip label={p.value ? 'Active' : 'Inactive'} size="small" color={p.value ? 'success' : 'default'} />,
    },
    {
      field: 'actions', headerName: 'Actions', width: 120, sortable: false,
      renderCell: (p) => (
        <>
          <IconButton size="small" onClick={() => handleEdit(p.row)} color="primary"><Edit fontSize="small" /></IconButton>
          <IconButton size="small" onClick={() => handleDelete(p.row.mobileNumber)} color="error"><Delete fontSize="small" /></IconButton>
        </>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ color: '#1a237e' }}>Customers</Typography>
          <Typography variant="body2" color="text.secondary">Manage your customer database</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => {
          setEditing(null);
          setForm({ mobileNumber: '', customerName: '', email: '', address: '', gstNumber: '' });
          setDialogOpen(true);
        }} sx={{ background: 'linear-gradient(135deg, #1a237e 0%, #3949ab 100%)' }}>Add Customer</Button>
      </Box>

      <Box sx={{ mb: 2.5 }}>
        <TextField size="small" placeholder="Search by name..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
          InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} /> }}
          sx={{ width: 320, bgcolor: '#fff', borderRadius: 3, '& .MuiOutlinedInput-root': { borderRadius: 3 } }} />
      </Box>

      <Box sx={{ bgcolor: '#fff', borderRadius: 4, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
        <DataGrid
          rows={customers.content || []}
          columns={columns}
          getRowId={(row) => row.mobileNumber}
          rowCount={customers.totalElements || 0}
          paginationMode="server"
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={(m) => { setPage(m.page); setPageSize(m.pageSize); }}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          autoHeight
          sx={{ border: 0, '& .MuiDataGrid-columnHeaders': { bgcolor: '#f8f9ff', fontWeight: 700 }, '& .MuiDataGrid-row:hover': { bgcolor: '#f8f9ff' } }}
        />
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField fullWidth label="Mobile Number" value={form.mobileNumber} onChange={e => setForm({ ...form, mobileNumber: e.target.value })}
            required margin="normal" disabled={!!editing} />
          <TextField fullWidth label="Customer Name" value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })}
            required margin="normal" />
          <TextField fullWidth label="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} margin="normal" />
          <TextField fullWidth label="Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} margin="normal" multiline rows={2} />
          <TextField fullWidth label="GST Number" value={form.gstNumber} onChange={e => setForm({ ...form, gstNumber: e.target.value })} margin="normal" />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>{editing ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
