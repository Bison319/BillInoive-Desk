import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Button, TextField, Typography, Chip, MenuItem, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Add, Cancel, PictureAsPdf, Payment, Search } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { invoiceApi, paymentApi } from '../services/api';

const statusColors: any = {
  DRAFT: 'info', PAID: 'success', PARTIALLY_PAID: 'warning', OVERDUE: 'error', CANCELLED: 'default',
};

export default function InvoicesPage() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<any>({ content: [], totalElements: 0 });
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [payDialog, setPayDialog] = useState<any>(null);
  const [payForm, setPayForm] = useState({ amount: '', paymentMethod: 'CASH', transactionReference: '', notes: '' });
  const [payError, setPayError] = useState('');

  const loadData = useCallback(async () => {
    try {
      const res = await invoiceApi.getAll({
        customerId: search || undefined,
        status: statusFilter || undefined,
        page, size: pageSize, sort: 'createdAt,desc',
      });
      // Handle both Spring Page formats
      const d = res.data;
      const content = d.content || d._embedded?.invoices || [];
      const total = d.totalElements ?? d.page?.totalElements ?? content.length;
      setInvoices({ content, totalElements: total });
    } catch (e) {}
  }, [page, pageSize, statusFilter, search]);

  useEffect(() => { loadData(); }, [loadData]);

  const handlePay = async () => {
    setPayError('');
    try {
      await paymentApi.record({
        invoiceId: payDialog.id,
        amount: parseFloat(payForm.amount),
        paymentMethod: payForm.paymentMethod,
        transactionReference: payForm.transactionReference || null,
        notes: payForm.notes || null,
      });
      setPayDialog(null);
      loadData();
    } catch (err: any) {
      setPayError(err.response?.data?.message || 'Payment failed');
    }
  };

  const handleDownload = async (id: number, invoiceNumber: string) => {
    try {
      const res = await invoiceApi.downloadPdf(String(id));
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoiceNumber}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {}
  };

  const handleCancel = async (id: number) => {
    if (window.confirm('Cancel this invoice?')) {
      await invoiceApi.cancel(String(id));
      loadData();
    }
  };

  const columns: GridColDef[] = [
    { field: 'invoiceNumber', headerName: 'Invoice #', width: 115 },
    { field: 'customerName', headerName: 'Customer', flex: 1, minWidth: 120,
      valueGetter: (value: any, row: any) => row.customer?.customerName },
    { field: 'totalAmount', headerName: 'Total', width: 100, type: 'number',
      valueFormatter: (value: any) => '₹' + (value || 0).toLocaleString('en-IN') },
    { field: 'paidAmount', headerName: 'Paid', width: 100, type: 'number',
      valueFormatter: (value: any) => '₹' + (value || 0).toLocaleString('en-IN') },
    { field: 'pendingAmount', headerName: 'Due', width: 100, type: 'number',
      valueFormatter: (value: any) => '₹' + (value || 0).toLocaleString('en-IN') },
    { field: 'invoiceStatus', headerName: 'Status', width: 120,
      renderCell: (p) => <Chip label={(p.value || '').replace('_', ' ')} size="small" color={statusColors[p.value] || 'default'} /> },
    { field: 'dueDate', headerName: 'Due', width: 100 },
    { field: 'actions', headerName: 'Actions', width: 130, sortable: false,
      renderCell: (p) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton size="small" onClick={() => handleDownload(p.row.id, p.row.invoiceNumber)} color="primary" title="Download Invoice PDF"><PictureAsPdf fontSize="small" /></IconButton>
          {p.row.pendingAmount > 0 && p.row.invoiceStatus !== 'CANCELLED' && (
            <IconButton size="small" color="success" title="Record Payment" onClick={() => {
              setPayDialog(p.row);
              setPayForm({ amount: String(p.row.pendingAmount), paymentMethod: 'CASH', transactionReference: '', notes: '' });
            }}><Payment fontSize="small" /></IconButton>
          )}
          {p.row.invoiceStatus !== 'CANCELLED' && p.row.invoiceStatus !== 'PAID' && (
            <IconButton size="small" color="error" title="Cancel" onClick={() => handleCancel(p.row.id)}><Cancel fontSize="small" /></IconButton>
          )}
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ color: '#1a237e' }}>Invoices</Typography>
          <Typography variant="body2" color="text.secondary">Create and manage invoices</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/invoices/create')}
          sx={{ background: 'linear-gradient(135deg, #1a237e 0%, #3949ab 100%)' }}>
          Create Invoice
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 2.5 }}>
        <TextField size="small" placeholder="Customer mobile..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
          InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} /> }}
          sx={{ width: 240, bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 3 } }} />
        <TextField select size="small" label="Status" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0); }}
          sx={{ width: 180, bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 3 } }}>
          <MenuItem value="">All Statuses</MenuItem>
          {['DRAFT', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </TextField>
      </Box>

      <Box sx={{ bgcolor: '#fff', borderRadius: 4, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
        <DataGrid
          rows={invoices.content || []} columns={columns} rowCount={invoices.totalElements || 0}
          paginationMode="server" paginationModel={{ page, pageSize }}
          onPaginationModelChange={(m) => { setPage(m.page); setPageSize(m.pageSize); }}
          pageSizeOptions={[10, 25, 50]} disableRowSelectionOnClick autoHeight
          sx={{ border: 0, '& .MuiDataGrid-columnHeaders': { bgcolor: '#f8f9ff', fontWeight: 700 }, '& .MuiDataGrid-row:hover': { bgcolor: '#f8f9ff' } }}
        />
      </Box>

      <Dialog open={!!payDialog} onClose={() => setPayDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Record Payment - {payDialog?.invoiceNumber}</DialogTitle>
        <DialogContent>
          {payError && <Alert severity="error" sx={{ mb: 2 }}>{payError}</Alert>}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Pending: ₹{payDialog?.pendingAmount?.toLocaleString('en-IN')}
          </Typography>
          <TextField fullWidth label="Amount (₹)" type="number" value={payForm.amount}
            onChange={e => setPayForm({ ...payForm, amount: e.target.value })} required margin="normal" />
          <TextField select fullWidth label="Payment Method" value={payForm.paymentMethod}
            onChange={e => setPayForm({ ...payForm, paymentMethod: e.target.value })} margin="normal">
            {['CASH', 'UPI', 'BANK_TRANSFER', 'CARD'].map(m => <MenuItem key={m} value={m}>{m.replace('_', ' ')}</MenuItem>)}
          </TextField>
          <TextField fullWidth label="Reference" value={payForm.transactionReference}
            onChange={e => setPayForm({ ...payForm, transactionReference: e.target.value })} margin="normal" />
          <TextField fullWidth label="Notes" value={payForm.notes}
            onChange={e => setPayForm({ ...payForm, notes: e.target.value })} margin="normal" multiline rows={2} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPayDialog(null)}>Cancel</Button>
          <Button variant="contained" color="success" onClick={handlePay}>Record Payment</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
