import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Button, TextField, Typography, MenuItem, Dialog, DialogTitle,
  DialogContent, DialogActions, Alert, Chip,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Add } from '@mui/icons-material';
import { paymentApi, invoiceApi } from '../services/api';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any>({ content: [], totalElements: 0 });
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ invoiceId: '', amount: '', paymentMethod: 'CASH', transactionReference: '', notes: '' });
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    try {
      const res = await paymentApi.getAll({ page, size: pageSize, sort: 'createdAt,desc' });
      const d = res.data;
      const content = d.content || d._embedded?.payments || [];
      const total = d.totalElements ?? d.page?.totalElements ?? content.length;
      setPayments({ content, totalElements: total });
    } catch (e) {}
  }, [page, pageSize]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async () => {
    setError('');
    try {
      await paymentApi.record({
        invoiceId: parseInt(form.invoiceId),
        amount: parseFloat(form.amount),
        paymentMethod: form.paymentMethod,
        transactionReference: form.transactionReference || null,
        notes: form.notes || null,
      });
      setDialogOpen(false);
      setForm({ invoiceId: '', amount: '', paymentMethod: 'CASH', transactionReference: '', notes: '' });
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Payment failed');
    }
  };

  const methodColors: any = {
    CASH: 'success', UPI: 'primary', BANK_TRANSFER: 'info', CARD: 'secondary',
  };

  const columns: GridColDef[] = [
    { field: 'invoiceNumber', headerName: 'Invoice', width: 120,
      valueGetter: (value: any, row: any) => row.invoice?.invoiceNumber },
    { field: 'customerName', headerName: 'Customer', flex: 1, minWidth: 150,
      valueGetter: (value: any, row: any) => row.customer?.customerName },
    { field: 'amount', headerName: 'Amount', width: 130, type: 'number',
      valueFormatter: (value: any) => '₹' + (value || 0).toLocaleString('en-IN') },
    { field: 'paymentMethod', headerName: 'Method', width: 140,
      renderCell: (p) => <Chip label={p.value?.replace('_', ' ')} size="small" color={methodColors[p.value] || 'default'} /> },
    { field: 'transactionReference', headerName: 'Reference', width: 150 },
    { field: 'createdAt', headerName: 'Date', width: 170,
      valueFormatter: (value: any) => value ? new Date(value).toLocaleString('en-IN') : '' },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ color: '#1a237e' }}>Payments</Typography>
          <Typography variant="body2" color="text.secondary">Track all payment transactions</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}
          sx={{ background: 'linear-gradient(135deg, #00c853 0%, #69f0ae 100%)', color: '#fff', '&:hover': { background: 'linear-gradient(135deg, #009624 0%, #00c853 100%)' } }}>
          Record Payment
        </Button>
      </Box>

      <Box sx={{ bgcolor: '#fff', borderRadius: 4, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
        <DataGrid
          rows={payments.content || []} columns={columns} rowCount={payments.totalElements || 0}
          paginationMode="server" paginationModel={{ page, pageSize }}
          onPaginationModelChange={(m) => { setPage(m.page); setPageSize(m.pageSize); }}
          pageSizeOptions={[10, 25, 50]} disableRowSelectionOnClick autoHeight
          sx={{ border: 0, '& .MuiDataGrid-columnHeaders': { bgcolor: '#f8f9ff', fontWeight: 700 }, '& .MuiDataGrid-row:hover': { bgcolor: '#f8f9ff' } }}
        />
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Record Payment</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField fullWidth label="Invoice ID" type="number" value={form.invoiceId}
            onChange={e => setForm({ ...form, invoiceId: e.target.value })} required margin="normal" />
          <TextField fullWidth label="Amount (₹)" type="number" value={form.amount}
            onChange={e => setForm({ ...form, amount: e.target.value })} required margin="normal" />
          <TextField select fullWidth label="Payment Method" value={form.paymentMethod}
            onChange={e => setForm({ ...form, paymentMethod: e.target.value })} margin="normal">
            {['CASH', 'UPI', 'BANK_TRANSFER', 'CARD'].map(m => <MenuItem key={m} value={m}>{m.replace('_', ' ')}</MenuItem>)}
          </TextField>
          <TextField fullWidth label="Transaction Reference" value={form.transactionReference}
            onChange={e => setForm({ ...form, transactionReference: e.target.value })} margin="normal" />
          <TextField fullWidth label="Notes" value={form.notes}
            onChange={e => setForm({ ...form, notes: e.target.value })} margin="normal" multiline rows={2} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>Record Payment</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
