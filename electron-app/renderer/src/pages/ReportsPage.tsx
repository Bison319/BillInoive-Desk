import React, { useState } from 'react';
import {
  Box, Typography, Paper, Tabs, Tab, TextField, Button, Grid, Table,
  TableHead, TableBody, TableRow, TableCell, Chip,
} from '@mui/material';
import { Download, Assessment } from '@mui/icons-material';
import { reportApi } from '../services/api';

export default function ReportsPage() {
  const [tab, setTab] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadDailySales = async () => {
    setLoading(true);
    try { const res = await reportApi.dailySales(date); setData(res.data); } catch (e) {}
    setLoading(false);
  };

  const loadOutstandingDues = async () => {
    setLoading(true);
    try { const res = await reportApi.outstandingDues(); setData(res.data); } catch (e) {}
    setLoading(false);
  };

  const loadGstReport = async () => {
    setLoading(true);
    try { const res = await reportApi.gstReport(startDate, endDate); setData(res.data); } catch (e) {}
    setLoading(false);
  };

  const loadPaymentAnalytics = async () => {
    setLoading(true);
    try { const res = await reportApi.paymentAnalytics(startDate, endDate); setData(res.data); } catch (e) {}
    setLoading(false);
  };

  const exportExcel = async (type: string) => {
    try {
      const res = type === 'invoices' ? await reportApi.exportInvoicesExcel() : await reportApi.exportPaymentsExcel();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}.xlsx`;
      a.click();
    } catch (e) {}
  };

  const fmt = (n: number) => '₹' + (n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ color: '#1a237e' }}>Reports</Typography>
        <Typography variant="body2" color="text.secondary">Analyze your business performance</Typography>
      </Box>

      <Paper sx={{ mb: 3, borderRadius: 4, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.04)' }}>
        <Tabs value={tab} onChange={(_, v) => { setTab(v); setData(null); }}
          sx={{ borderBottom: 1, borderColor: 'divider', '& .MuiTab-root': { fontWeight: 600, textTransform: 'none' }, '& .Mui-selected': { color: '#1a237e' } }}>
          <Tab label="Daily Sales" />
          <Tab label="Outstanding Dues" />
          <Tab label="GST Report" />
          <Tab label="Payment Analytics" />
          <Tab label="Export" />
        </Tabs>
      </Paper>

      {tab === 0 && (
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField type="date" label="Date" value={date} onChange={e => setDate(e.target.value)}
              InputLabelProps={{ shrink: true }} size="small" />
            <Button variant="contained" onClick={loadDailySales} disabled={loading}>Generate</Button>
          </Box>
          {data && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={4}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#e3f2fd' }}>
                    <Typography variant="h5" fontWeight={700}>{fmt(data.totalSales)}</Typography>
                    <Typography variant="body2" color="text.secondary">Total Sales</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={4}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#f3e5f5' }}>
                    <Typography variant="h5" fontWeight={700}>{data.totalTransactions}</Typography>
                    <Typography variant="body2" color="text.secondary">Transactions</Typography>
                  </Paper>
                </Grid>
              </Grid>
              {data.paymentModeBreakdown && (
                <Box>
                  <Typography variant="h6" gutterBottom>By Payment Method</Typography>
                  {Object.entries(data.paymentModeBreakdown).map(([method, amount]: any) => (
                    <Chip key={method} label={`${method}: ${fmt(amount)}`} sx={{ mr: 1, mb: 1 }} color="primary" variant="outlined" />
                  ))}
                </Box>
              )}
            </Box>
          )}
        </Paper>
      )}

      {tab === 1 && (
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Button variant="contained" onClick={loadOutstandingDues} disabled={loading} sx={{ mb: 2 }}>Load Report</Button>
          {Array.isArray(data) && (
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 600, bgcolor: '#f5f7fa' } }}>
                  <TableCell>Invoice #</TableCell><TableCell>Customer</TableCell>
                  <TableCell align="right">Total</TableCell><TableCell align="right">Paid</TableCell>
                  <TableCell align="right">Pending</TableCell><TableCell>Due Date</TableCell><TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((row: any) => (
                  <TableRow key={row.invoiceNumber}>
                    <TableCell>{row.invoiceNumber}</TableCell><TableCell>{row.customerName}</TableCell>
                    <TableCell align="right">{fmt(row.totalAmount)}</TableCell>
                    <TableCell align="right">{fmt(row.paidAmount)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: 'error.main' }}>{fmt(row.pendingAmount)}</TableCell>
                    <TableCell>{row.dueDate}</TableCell>
                    <TableCell><Chip label={row.status} size="small" color={row.status === 'OVERDUE' ? 'error' : 'warning'} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Paper>
      )}

      {tab === 2 && (
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField type="date" label="From" value={startDate} onChange={e => setStartDate(e.target.value)} InputLabelProps={{ shrink: true }} size="small" />
            <TextField type="date" label="To" value={endDate} onChange={e => setEndDate(e.target.value)} InputLabelProps={{ shrink: true }} size="small" />
            <Button variant="contained" onClick={loadGstReport} disabled={loading}>Generate</Button>
          </Box>
          {Array.isArray(data) && (
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 600, bgcolor: '#f5f7fa' } }}>
                  <TableCell>Invoice #</TableCell><TableCell>Customer</TableCell>
                  <TableCell>GST Number</TableCell><TableCell align="right">Total</TableCell>
                  <TableCell align="right">GST Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((row: any) => (
                  <TableRow key={row.invoiceNumber}>
                    <TableCell>{row.invoiceNumber}</TableCell><TableCell>{row.customerName}</TableCell>
                    <TableCell>{row.gstNumber || '-'}</TableCell>
                    <TableCell align="right">{fmt(row.totalAmount)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>{fmt(row.gstAmount)}</TableCell>
                  </TableRow>
                ))}
                {data.length > 0 && (
                  <TableRow sx={{ '& td': { fontWeight: 700, bgcolor: '#e8f5e9' } }}>
                    <TableCell colSpan={3}>Total</TableCell>
                    <TableCell align="right">{fmt(data.reduce((s: number, r: any) => s + r.totalAmount, 0))}</TableCell>
                    <TableCell align="right">{fmt(data.reduce((s: number, r: any) => s + r.gstAmount, 0))}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </Paper>
      )}

      {tab === 3 && (
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField type="date" label="From" value={startDate} onChange={e => setStartDate(e.target.value)} InputLabelProps={{ shrink: true }} size="small" />
            <TextField type="date" label="To" value={endDate} onChange={e => setEndDate(e.target.value)} InputLabelProps={{ shrink: true }} size="small" />
            <Button variant="contained" onClick={loadPaymentAnalytics} disabled={loading}>Generate</Button>
          </Box>
          {data && (
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#e3f2fd' }}>
                  <Typography variant="h4" fontWeight={700}>{data.totalPayments}</Typography>
                  <Typography variant="body2" color="text.secondary">Total Payments</Typography>
                </Paper>
              </Grid>
              {data.amountByMode && Object.entries(data.amountByMode).map(([method, amount]: any) => (
                <Grid item xs={4} key={method}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#f3e5f5' }}>
                    <Typography variant="h5" fontWeight={700}>{fmt(amount)}</Typography>
                    <Typography variant="body2" color="text.secondary">{method.replace('_', ' ')} ({data.countByMode?.[method] || 0})</Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </Paper>
      )}

      {tab === 4 && (
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" gutterBottom>Export Data</Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Button fullWidth variant="outlined" startIcon={<Download />} onClick={() => exportExcel('invoices')} sx={{ py: 2 }}>
                Export Invoices (Excel)
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button fullWidth variant="outlined" startIcon={<Download />} onClick={() => exportExcel('payments')} sx={{ py: 2 }}>
                Export Payments (Excel)
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Box>
  );
}
