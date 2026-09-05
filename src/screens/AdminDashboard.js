import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Tab = createBottomTabNavigator();
const API = 'https://florence-nightingales-app.onrender.com';

const colors = { admin: '#e53e3e', bg: '#f7fafc', card: '#fff', muted: '#718096', dark: '#1a365d' };

function useFetch(url, token) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(j => { setData(j); setLoading(false); })
      .catch(e => { setError('Could not load data'); setLoading(false); });
  }, [url]);
  return { data, loading, error };
}

function Screen({ loading, error, children }) {
  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={colors.admin} /></View>;
  if (error) return <View style={s.center}><Text style={{ color: 'red' }}>{error}</Text></View>;
  return children;
}

// ─── Overview: Stats ─────────────────────────────────────────────────────────
const OverviewTab = ({ token }) => {
  const { data: stats, loading, error } = useFetch(`${API}/api/admin/stats`, token);
  return (
    <Screen loading={loading} error={error}>
      <ScrollView style={s.container} contentContainerStyle={{ padding: 16 }}>
        <Text style={s.heading}>Admin Overview</Text>
        <View style={s.row}>
          <StatCard label="Active Users" value={stats.totalUsers} />
          <StatCard label="Teams" value={stats.totalTeams} />
        </View>
        <View style={s.row}>
          <StatCard label="Customers" value={stats.totalCustomers} />
          <StatCard label="Invoices" value={stats.totalInvoices} />
        </View>
        <View style={[s.card, { backgroundColor: '#fff5f5', borderLeftWidth: 4, borderLeftColor: colors.admin }]}>
          <Text style={s.label}>Outstanding Balance</Text>
          <Text style={[s.bigNum, { color: colors.admin }]}>
            ₹{Number(stats.pendingAmount || 0).toLocaleString('en-IN')}
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
};

const StatCard = ({ label, value }) => (
  <View style={[s.card, { flex: 1, margin: 4, alignItems: 'center' }]}>
    <Text style={s.bigNum}>{value ?? '—'}</Text>
    <Text style={s.label}>{label}</Text>
  </View>
);

// ─── Teams & Leads ────────────────────────────────────────────────────────────
const TeamsTab = ({ token }) => {
  const { data, loading, error } = useFetch(`${API}/api/admin/team-leads`, token);
  return (
    <Screen loading={loading} error={error}>
      <FlatList
        style={s.container}
        data={Array.isArray(data) ? data : []}
        keyExtractor={i => i.id}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={<Text style={s.heading}>Teams & Team Leads</Text>}
        ListEmptyComponent={<Text style={s.empty}>No Team Leads found</Text>}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={s.name}>{item.full_name}</Text>
              <View style={[s.badge, item.status === 'ACTIVE' ? s.badgeGreen : s.badgeRed]}>
                <Text style={s.badgeText}>{item.status}</Text>
              </View>
            </View>
            <Text style={s.sub}>{item.email}</Text>
            <Text style={s.sub}>Team: {item.team?.name || 'Unassigned'}</Text>
          </View>
        )}
      />
    </Screen>
  );
};

// ─── Financials ───────────────────────────────────────────────────────────────
const FinanceTab = ({ token }) => {
  const { data, loading, error } = useFetch(`${API}/api/admin/invoices`, token);
  return (
    <Screen loading={loading} error={error}>
      <FlatList
        style={s.container}
        data={Array.isArray(data) ? data : []}
        keyExtractor={i => i.id}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={<Text style={s.heading}>All Invoices</Text>}
        ListEmptyComponent={<Text style={s.empty}>No invoices yet</Text>}
        renderItem={({ item }) => {
          const paid = item.payments?.filter(p => p.status === 'CONFIRMED').reduce((a, p) => a + Number(p.amount), 0) || 0;
          const outstanding = Number(item.total_amount) - paid;
          const statusColor = item.status === 'PAID' ? '#38a169' : item.status === 'OVERDUE' ? '#e53e3e' : '#d69e2e';
          return (
            <View style={s.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={s.name}>{item.customer?.full_name}</Text>
                <Text style={[s.badgeText, { color: statusColor, fontWeight: 'bold' }]}>{item.status}</Text>
              </View>
              <Text style={s.sub}>Invoice: {item.invoice_number}</Text>
              <Text style={s.sub}>Total: ₹{Number(item.total_amount).toLocaleString('en-IN')}</Text>
              <Text style={[s.sub, { color: outstanding > 0 ? '#e53e3e' : '#38a169' }]}>
                Outstanding: ₹{outstanding.toLocaleString('en-IN')}
              </Text>
              <Text style={s.sub}>Due: {new Date(item.due_date).toLocaleDateString('en-IN')}</Text>
            </View>
          );
        }}
      />
    </Screen>
  );
};

// ─── Audit Logs ───────────────────────────────────────────────────────────────
const AuditTab = ({ token }) => {
  const { data, loading, error } = useFetch(`${API}/api/admin/audit-logs`, token);
  return (
    <Screen loading={loading} error={error}>
      <FlatList
        style={s.container}
        data={Array.isArray(data) ? data : []}
        keyExtractor={i => i.id}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={<Text style={s.heading}>Security Audit Logs</Text>}
        ListEmptyComponent={<Text style={s.empty}>No audit logs yet. They appear after user actions.</Text>}
        renderItem={({ item }) => (
          <View style={[s.card, { borderLeftWidth: 3, borderLeftColor: item.result === 'SUCCESS' ? '#38a169' : '#e53e3e' }]}>
            <Text style={s.name}>{item.action}</Text>
            <Text style={s.sub}>By: {item.actor?.full_name || 'System'}</Text>
            <Text style={s.sub}>Entity: {item.entity_type}</Text>
            <Text style={s.sub}>{new Date(item.timestamp).toLocaleString('en-IN')}</Text>
          </View>
        )}
      />
    </Screen>
  );
};

// ─── Main Admin Dashboard ─────────────────────────────────────────────────────
export default function AdminDashboard({ token }) {
  return (
    <Tab.Navigator screenOptions={{ headerTitleAlign: 'center', tabBarActiveTintColor: colors.admin, tabBarLabelStyle: { fontSize: 11 } }}>
      <Tab.Screen name="Overview" options={{ title: 'Overview' }}>
        {() => <OverviewTab token={token} />}
      </Tab.Screen>
      <Tab.Screen name="Teams" options={{ title: 'Teams' }}>
        {() => <TeamsTab token={token} />}
      </Tab.Screen>
      <Tab.Screen name="Finance" options={{ title: 'Financials' }}>
        {() => <FinanceTab token={token} />}
      </Tab.Screen>
      <Tab.Screen name="Audit" options={{ title: 'Audit Logs' }}>
        {() => <AuditTab token={token} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heading: { fontSize: 20, fontWeight: 'bold', color: colors.dark, marginBottom: 12 },
  card: { backgroundColor: colors.card, borderRadius: 10, padding: 16, marginBottom: 12, elevation: 2 },
  row: { flexDirection: 'row', marginBottom: 4 },
  name: { fontSize: 15, fontWeight: 'bold', color: colors.dark },
  sub: { fontSize: 13, color: colors.muted, marginTop: 2 },
  label: { fontSize: 12, color: colors.muted },
  bigNum: { fontSize: 28, fontWeight: 'bold', color: colors.dark },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 40 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  badgeGreen: { backgroundColor: '#c6f6d5' },
  badgeRed: { backgroundColor: '#fed7d7' },
  badgeText: { fontSize: 11, fontWeight: 'bold' },
});
