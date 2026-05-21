import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Typography, IconButton, Chip, Alert, MenuItem,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Add, Edit, Delete, Search } from '@mui/icons-material';
import { productApi } from '../services/api';

export default function ProductsPage() {
  const [products, setProducts] = useState<any>({ content: [], totalElements: 0 });
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ productName: '', category: '', unitPrice: '', gstPercentage: '', stockQuantity: '' });
  const [error, setError] = useState('');

  const categories = ['Teak', 'Rosewood', 'Pine', 'Plywood', 'MDF', 'Sal', 'Cedar', 'Particle Board', 'Block Board', 'Veneer', 'Bamboo', 'Rubber Wood', 'Mahogany', 'Deodar', 'Neem'];

  const loadData = useCallback(async () => {
    try {
      const res = await productApi.getAll({
        name: search || undefined, category: catFilter || undefined,
        page, size: pageSize, sort: 'productName,asc'
      });
      const d = res.data;
      const content = d.content || d._embedded?.products || [];
      const total = d.totalElements ?? d.page?.totalElements ?? content.length;
      setProducts({ content, totalElements: total });
    } catch (e) {}
  }, [page, pageSize, search, catFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async () => {
    setError('');
    try {
      const data = {
        ...form,
        unitPrice: parseFloat(form.unitPrice),
        gstPercentage: parseFloat(form.gstPercentage),
        stockQuantity: parseInt(form.stockQuantity) || 0,
      };
      if (editing) {
        await productApi.update(editing.id, data);
      } else {
        await productApi.create(data);
      }
      setDialogOpen(false);
      setEditing(null);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save');
    }
  };

  const handleEdit = (row: any) => {
    setEditing(row);
    setForm({
      productName: row.productName, category: row.category,
      unitPrice: String(row.unitPrice), gstPercentage: String(row.gstPercentage),
      stockQuantity: String(row.stockQuantity),
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure?')) {
      await productApi.delete(String(id));
      loadData();
    }
  };

  const columns: GridColDef[] = [
    { field: 'productName', headerName: 'Product', flex: 1, minWidth: 200 },
    { field: 'category', headerName: 'Category', width: 130 },
    { field: 'unitPrice', headerName: 'Price (₹)', width: 120, type: 'number',
      valueFormatter: (value: any) => '₹' + (value || 0).toLocaleString('en-IN') },
    { field: 'gstPercentage', headerName: 'GST %', width: 80, type: 'number',
      valueFormatter: (value: any) => value + '%' },
    { field: 'stockQuantity', headerName: 'Stock', width: 80, type: 'number' },
    { field: 'active', headerName: 'Status', width: 90,
      renderCell: (p) => <Chip label={p.value ? 'Active' : 'Inactive'} size="small" color={p.value ? 'success' : 'default'} /> },
    { field: 'actions', headerName: 'Actions', width: 120, sortable: false,
      renderCell: (p) => (
        <>
          <IconButton size="small" onClick={() => handleEdit(p.row)} color="primary"><Edit fontSize="small" /></IconButton>
          <IconButton size="small" onClick={() => handleDelete(p.row.id)} color="error"><Delete fontSize="small" /></IconButton>
        </>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ color: '#1a237e' }}>Products</Typography>
          <Typography variant="body2" color="text.secondary">Manage your product inventory</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => {
          setEditing(null);
          setForm({ productName: '', category: '', unitPrice: '', gstPercentage: '18', stockQuantity: '0' });
          setDialogOpen(true);
        }} sx={{ background: 'linear-gradient(135deg, #1a237e 0%, #3949ab 100%)' }}>Add Product</Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 2.5 }}>
        <TextField size="small" placeholder="Search products..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
          InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} /> }}
          sx={{ width: 280, bgcolor: '#fff', borderRadius: 3, '& .MuiOutlinedInput-root': { borderRadius: 3 } }} />
        <TextField select size="small" label="Category" value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(0); }}
          sx={{ width: 180, bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 3 } }}>
          <MenuItem value="">All Categories</MenuItem>
          {categories.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
        </TextField>
      </Box>

      <Box sx={{ bgcolor: '#fff', borderRadius: 4, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
        <DataGrid
          rows={products.content || []} columns={columns} rowCount={products.totalElements || 0}
          paginationMode="server" paginationModel={{ page, pageSize }}
          onPaginationModelChange={(m) => { setPage(m.page); setPageSize(m.pageSize); }}
          pageSizeOptions={[10, 25, 50]} disableRowSelectionOnClick autoHeight
          sx={{ border: 0, '& .MuiDataGrid-columnHeaders': { bgcolor: '#f8f9ff', fontWeight: 700 }, '& .MuiDataGrid-row:hover': { bgcolor: '#f8f9ff' } }}
        />
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Product' : 'Add Product'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField fullWidth label="Product Name" value={form.productName} onChange={e => setForm({ ...form, productName: e.target.value })} required margin="normal" />
          <TextField select fullWidth label="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required margin="normal">
            {categories.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField>
          <TextField fullWidth label="Unit Price (₹)" type="number" value={form.unitPrice} onChange={e => setForm({ ...form, unitPrice: e.target.value })} required margin="normal" />
          <TextField fullWidth label="GST Percentage" type="number" value={form.gstPercentage} onChange={e => setForm({ ...form, gstPercentage: e.target.value })} required margin="normal" />
          <TextField fullWidth label="Stock Quantity" type="number" value={form.stockQuantity} onChange={e => setForm({ ...form, stockQuantity: e.target.value })} margin="normal" />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>{editing ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
