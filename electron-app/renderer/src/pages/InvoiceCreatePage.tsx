import React, { useEffect, useState } from 'react';
import {
  Box, Button, TextField, Typography, Paper, Grid, IconButton, Autocomplete,
  MenuItem, Table, TableHead, TableBody, TableRow, TableCell, Alert, Divider,
} from '@mui/material';
import { Add, Delete, Save } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { customerApi, productApi, invoiceApi, settingsApi } from '../services/api';

interface LineItem {
  productId: number | null;
  productName: string;
  quantity: number;
  unitPrice: number;
  gstPercentage: number;
}

export default function InvoiceCreatePage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [items, setItems] = useState<LineItem[]>([{ productId: null, productName: '', quantity: 1, unitPrice: 0, gstPercentage: 18 }]);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [companyName, setCompanyName] = useState('');

  useEffect(() => {
    customerApi.getAllList().then(res => setCustomers(res.data)).catch(() => {});
    productApi.getAllList().then(res => setProducts(res.data)).catch(() => {});
    settingsApi.getAll().then(r => {
      if (r.data && typeof r.data === 'object' && !Array.isArray(r.data)) {
        setCompanyName(r.data.company_name || '');
      } else if (Array.isArray(r.data)) {
        const cn = r.data.find((s: any) => s.settingKey === 'company_name');
        if (cn) setCompanyName(cn.settingValue);
      }
    }).catch(() => {});
  }, []);

  const addItem = () => setItems([...items, { productId: null, productName: '', quantity: 1, unitPrice: 0, gstPercentage: 18 }]);

  const removeItem = (idx: number) => {
    if (items.length > 1) setItems(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: string, value: any) => {
    const updated = [...items];
    (updated[idx] as any)[field] = value;
    setItems(updated);
  };

  const selectProduct = (idx: number, product: any) => {
    if (product) {
      const updated = [...items];
      updated[idx] = {
        productId: product.id,
        productName: product.productName,
        quantity: 1,
        unitPrice: product.unitPrice,
        gstPercentage: product.gstPercentage,
      };
      setItems(updated);
    }
  };

  const calcLineTotal = (item: LineItem) => {
    const base = item.unitPrice * item.quantity;
    const gst = base * item.gstPercentage / 100;
    return { base, gst, total: base + gst };
  };

  const subtotal = items.reduce((s, i) => s + calcLineTotal(i).base, 0);
  const totalGst = items.reduce((s, i) => s + calcLineTotal(i).gst, 0);
  const grandTotal = subtotal + totalGst;

  const handleSubmit = async () => {
    setError('');
    if (!selectedCustomer) { setError('Please select a customer'); return; }
    if (items.some(i => !i.productName || i.unitPrice <= 0)) { setError('All items must have a product and price'); return; }

    setSaving(true);
    try {
      await invoiceApi.create({
        customerId: selectedCustomer.mobileNumber,
        items: items.map(i => ({
          productId: i.productId,
          productName: i.productName,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          gstPercentage: i.gstPercentage,
        })),
        dueDate: dueDate || null,
        notes: notes || null,
      });
      navigate('/invoices');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create invoice');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Create Invoice</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Autocomplete
              options={customers}
              getOptionLabel={(o: any) => `${o.customerName} (${o.mobileNumber})`}
              value={selectedCustomer}
              onChange={(_, v) => setSelectedCustomer(v)}
              renderInput={(params) => <TextField {...params} label="Select Customer" required />}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField fullWidth label="Due Date" type="date" value={dueDate}
              onChange={e => setDueDate(e.target.value)} InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField fullWidth label="Notes" value={notes} onChange={e => setNotes(e.target.value)} />
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">Line Items</Typography>
          <Button startIcon={<Add />} onClick={addItem} size="small">Add Item</Button>
        </Box>

        <Table size="small">
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 600, bgcolor: '#f5f7fa' } }}>
              <TableCell width="35%">Product</TableCell>
              <TableCell width="10%">Qty</TableCell>
              <TableCell width="15%">Unit Price (₹)</TableCell>
              <TableCell width="10%">GST %</TableCell>
              <TableCell width="12%">GST Amt</TableCell>
              <TableCell width="13%">Total</TableCell>
              <TableCell width="5%"></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item, idx) => {
              const calc = calcLineTotal(item);
              return (
                <TableRow key={idx}>
                  <TableCell>
                    <Autocomplete size="small"
                      options={products}
                      getOptionLabel={(o: any) => o.productName || ''}
                      onChange={(_, v) => selectProduct(idx, v)}
                      renderInput={(params) => <TextField {...params} placeholder="Select product" />}
                      freeSolo
                      onInputChange={(_, v) => updateItem(idx, 'productName', v)}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField size="small" type="number" value={item.quantity}
                      onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                      inputProps={{ min: 1, style: { width: 60 } }} />
                  </TableCell>
                  <TableCell>
                    <TextField size="small" type="number" value={item.unitPrice}
                      onChange={e => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                      inputProps={{ style: { width: 100 } }} />
                  </TableCell>
                  <TableCell>
                    <TextField size="small" type="number" value={item.gstPercentage}
                      onChange={e => updateItem(idx, 'gstPercentage', parseFloat(e.target.value) || 0)}
                      inputProps={{ style: { width: 60 } }} />
                  </TableCell>
                  <TableCell>₹{calc.gst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>₹{calc.total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</TableCell>
                  <TableCell>
                    <IconButton size="small" color="error" onClick={() => removeItem(idx)} disabled={items.length === 1}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="body1">Subtotal: ₹{subtotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</Typography>
          <Typography variant="body1">GST: ₹{totalGst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</Typography>
          <Typography variant="h5" color="primary" fontWeight={700} sx={{ mt: 1 }}>
            Grand Total: ₹{grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </Typography>
        </Box>

        <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button onClick={() => navigate('/invoices')}>Cancel</Button>
          <Button variant="contained" startIcon={<Save />} onClick={handleSubmit} disabled={saving} size="large">
            {saving ? 'Creating...' : 'Create Invoice'}
          </Button>
        </Box>

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            © 2026 {companyName || 'AVP Nexus'}. All rights reserved.
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
