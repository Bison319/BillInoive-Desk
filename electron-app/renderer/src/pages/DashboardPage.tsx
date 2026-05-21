import React, { useEffect, useState } from 'react';
import { Box, Grid, Card, CardContent, Typography, Paper } from '@mui/material';
import { Receipt, Payment, TrendingUp, AccountBalance } from '@mui/icons-material';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { reportApi } from '../services/api';

const COLORS = ['#1a237e', '#ff6d00', '#00c853', '#d50000', '#8e24aa', '#00bcd4'];

interface DashboardData {
  totalSales: number;
  pendingPayments: number;
  gstCollected: number;
  totalInvoices: number;
  totalPayments: number;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [paymentData, setPaymentData] = useState<any[]>([]);

  useEffect(() => {
    reportApi.dashboard().then(res => setData(res.data)).catch(() => {});

    const now = new Date();
    const promises = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      promises.push(reportApi.monthlySales(d.getFullYear(), d.getMonth() + 1)
        .then(res => ({
          month: d.toLocaleDateString('en-IN', { month: 'short' }),
          sales: res.data.totalSales || 0,
        }))
        .catch(() => ({ month: '', sales: 0 }))
      );
    }
    Promise.all(promises).then(setMonthlyData);

    reportApi.paymentAnalytics().then(res => {
      const amountByMode = res.data.amountByMode || {};
      setPaymentData(Object.entries(amountByMode).map(([name, value]) => ({ name: name.replace('_', ' '), value })));
    }).catch(() => {});
  }, []);

  const fmt = (n: number) => '₹' + (n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

  const stats = [
    { title: 'Total Revenue', value: fmt(data?.totalSales || 0), icon: <TrendingUp />, color: '#1a237e', bg: '#e8eaf6' },
    { title: 'Pending', value: fmt(data?.pendingPayments || 0), icon: <Payment />, color: '#ff6d00', bg: '#fff3e0' },
    { title: 'GST Collected', value: fmt(data?.gstCollected || 0), icon: <AccountBalance />, color: '#00c853', bg: '#e8f5e9' },
    { title: 'Invoices', value: String(data?.totalInvoices || 0), icon: <Receipt />, color: '#8e24aa', bg: '#f3e5f5' },
  ];

  return (
    <Box sx={{ maxWidth: '100%', overflow: 'hidden' }}>
      <Typography variant="h5" fontWeight={800} sx={{ color: '#1a237e', mb: 0.5 }}>Dashboard</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Business overview at a glance</Typography>

      {/* Stat Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {stats.map((s) => (
          <Grid item xs={6} md={3} key={s.title}>
            <Card sx={{ height: '100%', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ p: 1, borderRadius: 2, bgcolor: s.bg, display: 'flex' }}>
                    {React.cloneElement(s.icon as React.ReactElement, { sx: { fontSize: 22, color: s.color } })}
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" noWrap>{s.title}</Typography>
                    <Typography variant="h6" fontWeight={800} noWrap sx={{ fontSize: '1.1rem' }}>{s.value}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Charts */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2.5, borderRadius: 3, height: 320 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1, color: '#1a237e' }}>Monthly Revenue</Typography>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1a237e" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#1a237e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={12} />
                <YAxis tickFormatter={(v) => '₹' + (v / 1000).toFixed(0) + 'K'} axisLine={false} tickLine={false} fontSize={11} width={55} />
                <Tooltip formatter={(value: number) => ['₹' + value.toLocaleString('en-IN'), 'Revenue']}
                  contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.1)', fontSize: 13 }} />
                <Area type="monotone" dataKey="sales" stroke="#1a237e" strokeWidth={2.5} fill="url(#salesFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2.5, borderRadius: 3, height: 320 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1, color: '#1a237e' }}>Payment Split</Typography>
            {paymentData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={paymentData} dataKey="value" nameKey="name" cx="50%" cy="45%"
                    outerRadius={75} innerRadius={45} paddingAngle={2}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false} fontSize={11}>
                    {paymentData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: number) => '₹' + value.toLocaleString('en-IN')}
                    contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.1)', fontSize: 13 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 250 }}>
                <Typography color="text.secondary" variant="body2">No payment data yet</Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
