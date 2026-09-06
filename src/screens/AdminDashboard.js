import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, ScrollView, ImageBackground, TouchableOpacity, RefreshControl } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Tab = createBottomTabNavigator();
const API = 'https://florence-nightingales-app.onrender.com';

function useFetch(url, token) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(j => { setData(j); setLoading(false); setRefreshing(false); })
      .catch(() => { setError('Could not load data'); setLoading(false); setRefreshing(false); });
  };

  useEffect(() => { load(); }, [url]);
  return { data, loading, error, refreshing, onRefresh: () => load(true) };
}

const DashHeader = ({ title, subtitle, color1 = '#1a365d', color2 = '#2c5282' }) => (
  <ImageBackground source={require('../../assets/dashboard_header.jpg')} style={[hdr.wrap]} resizeMode="cover">
    <View style={[hdr.overlay, { backgroundColor: color1 + 'CC' }]} />
    <View style={hdr.inner}>
      <Text style={hdr.title}>{title}</Text>
      {subtitle ? <Text style={hdr.sub}>{subtitle}</Text> : null}
    </View>
  </ImageBackground>
);

const hdr = StyleSheet.create({
  wrap: { height: 110, justifyContent: 'flex-end' },
  overlay: { ...StyleSheet.absoluteFillObject },
  inner: { padding: 16, paddingBottom: 14 },
  title: { fontSize: 22, fontWeight: '800', color: '#fff' },
  sub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
});

const Loading = ({ color }) => (
  <View style={s.center}><ActivityIndicator size="large" color={color || '#1a365d'} /><Text style={[s.muted, { marginTop: 12 }]}>Loading...</Text></View>
);

const Empty = ({ msg }) => (
  <View style={s.emptyWrap}>
    <Text style={s.emptyIcon}>📭</Text>
    <Text style={s.emptyText}>{msg || 'No records found'}</Text>
  </View>
);

const StatusBadge = ({ label }) => {
  const colors = { ACTIVE: ['#c6f6d5','#276749'], PAID: ['#c6f6d5','#276749'], IN_PROGRESS: ['#bee3f8','#2b6cb0'], ASSIGNED: ['#e9d8fd','#553c9a'], OVERDUE: ['#fed7d7','#c53030'], PENDING: ['#fefcbf','#744210'], PARTIALLY_PAID: ['#fbd38d','#744210'], INACTIVE: ['#e2e8f0','#4a5568'], TODO: ['#e2e8f0','#4a5568'], CANCELLED: ['#fed7d7','#c53030'], FAILED: ['#fed7d7','#c53030'], SUCCESS: ['#c6f6d5','#276749'] };
  const [bg, fg] = colors[label] || ['#e2e8f0','#4a5568'];
  return <View style={[s.badge, { backgroundColor: bg }]}><Text style={[s.badgeText, { color: fg }]}>{label}</Text></View>;
};

const SeparatorLine = () => <View style={{ height: 1, backgroundColor: '#edf2f7', marginHorizontal: 16 }} />;

// ── OVERVIEW ──────────────────────────────────────────────────────────────────
const OverviewTab = ({ token }) => {
  const { data: stats, loading } = useFetch(`${API}/api/admin/stats`, token);
  const statItems = [
    { icon: '👥', label: 'Active Users', value: stats?.totalUsers, color: '#3182ce' },
    { icon: '🏥', label: 'Teams', value: stats?.totalTeams, color: '#805ad5' },
    { icon: '🤝', label: 'Customers', value: stats?.totalCustomers, color: '#38a169' },
    { icon: '🧾', label: 'Invoices', value: stats?.totalInvoices, color: '#d69e2e' },
  ];
  if (loading) return <Loading color="#c53030" />;
  return (
    <ScrollView style={s.screen}>
      <DashHeader title="Admin Overview" subtitle="Florence Nightingales Operations" color1="#7b0000" color2="#c53030" />
      <View style={s.body}>
        <Text style={s.sectionTitle}>Key Metrics</Text>
        <View style={s.grid}>
          {statItems.map(item => (
            <View key={item.label} style={[s.statCard, { borderTopColor: item.color, borderTopWidth: 3 }]}>
              <Text style={s.statIcon}>{item.icon}</Text>
              <Text style={[s.statVal, { color: item.color }]}>{item.value ?? '—'}</Text>
              <Text style={s.statLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        <Text style={s.sectionTitle}>Financial Summary</Text>
        <View style={[s.card, { backgroundColor: '#fff5f5', borderLeftWidth: 4, borderLeftColor: '#c53030' }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={s.muted}>Total Outstanding Balance</Text>
              <Text style={[s.bigMoney, { color: '#c53030' }]}>
                ₹{Number(stats?.pendingAmount || 0).toLocaleString('en-IN')}
              </Text>
            </View>
            <Text style={{ fontSize: 40 }}>💰</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={[s.card, { flex: 1, alignItems: 'center', backgroundColor: '#f0fff4' }]}>
            <Text style={{ fontSize: 28 }}>✅</Text>
            <Text style={s.muted}>Fully Paid</Text>
          </View>
          <View style={[s.card, { flex: 1, alignItems: 'center', backgroundColor: '#fffff0' }]}>
            <Text style={{ fontSize: 28 }}>⏳</Text>
            <Text style={s.muted}>Pending/Partial</Text>
          </View>
          <View style={[s.card, { flex: 1, alignItems: 'center', backgroundColor: '#fff5f5' }]}>
            <Text style={{ fontSize: 28 }}>🚨</Text>
            <Text style={s.muted}>Overdue</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

// ── TEAMS ─────────────────────────────────────────────────────────────────────
const TeamsTab = ({ token }) => {
  const { data, loading, refreshing, onRefresh } = useFetch(`${API}/api/admin/team-leads`, token);
  const { data: allUsers, loading: usersLoading } = useFetch(`${API}/api/operations/employees`, token);

  if (loading || usersLoading) return <Loading color="#c53030" />;
  return (
    <FlatList
      style={s.screen}
      data={Array.isArray(allUsers) ? allUsers : []}
      keyExtractor={i => i.id}
      ItemSeparatorComponent={SeparatorLine}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListHeaderComponent={() => (
        <>
          <DashHeader title="Team Directory" subtitle="All users across the organization" color1="#1a365d" />
          <View style={s.body}>
            <Text style={s.sectionTitle}>All Personnel ({Array.isArray(allUsers) ? allUsers.length : 0})</Text>
          </View>
        </>
      )}
      ListEmptyComponent={<Empty msg="No users found" />}
      renderItem={({ item }) => (
        <View style={[s.rowCard]}>
          <View style={[s.avatar, { backgroundColor: item.role === 'ADMIN' ? '#fed7d7' : item.role === 'TEAM_LEAD' ? '#bee3f8' : '#c6f6d5' }]}>
            <Text style={s.avatarText}>{item.full_name?.charAt(0)}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={s.name}>{item.full_name}</Text>
            <Text style={s.muted}>{item.email}</Text>
            {item.designation && <Text style={s.muted}>🏷️ {item.designation}</Text>}
          </View>
          <StatusBadge label={item.role === 'ADMIN' ? 'ADMIN' : item.role === 'TEAM_LEAD' ? 'LEAD' : 'STAFF'} />
        </View>
      )}
      contentContainerStyle={{ paddingBottom: 40 }}
    />
  );
};

// ── FINANCIALS ────────────────────────────────────────────────────────────────
const FinanceTab = ({ token }) => {
  const { data, loading, refreshing, onRefresh } = useFetch(`${API}/api/admin/invoices`, token);
  if (loading) return <Loading color="#c53030" />;
  const invoices = Array.isArray(data) ? data : [];
  const totalBilled = invoices.reduce((a, i) => a + Number(i.total_amount), 0);
  const totalCollected = invoices.reduce((a, i) => a + (i.payments?.filter(p => p.status === 'CONFIRMED').reduce((s, p) => s + Number(p.amount), 0) || 0), 0);
  const outstanding = totalBilled - totalCollected;

  return (
    <FlatList
      style={s.screen}
      data={invoices}
      keyExtractor={i => i.id}
      ItemSeparatorComponent={SeparatorLine}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListHeaderComponent={() => (
        <>
          <DashHeader title="Financial Management" subtitle="Invoices, collections & outstanding" color1="#1a3a1a" />
          <View style={s.body}>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
              <View style={[s.card, { flex: 1, backgroundColor: '#f0fff4' }]}>
                <Text style={s.muted}>Collected</Text>
                <Text style={[s.money, { color: '#276749' }]}>₹{totalCollected.toLocaleString('en-IN')}</Text>
              </View>
              <View style={[s.card, { flex: 1, backgroundColor: '#fff5f5' }]}>
                <Text style={s.muted}>Outstanding</Text>
                <Text style={[s.money, { color: '#c53030' }]}>₹{outstanding.toLocaleString('en-IN')}</Text>
              </View>
            </View>
            <Text style={s.sectionTitle}>All Invoices ({invoices.length})</Text>
          </View>
        </>
      )}
      ListEmptyComponent={<Empty msg="No invoices found" />}
      renderItem={({ item }) => {
        const paid = item.payments?.filter(p => p.status === 'CONFIRMED').reduce((a, p) => a + Number(p.amount), 0) || 0;
        const outstanding = Number(item.total_amount) - paid;
        const pct = Math.round((paid / Number(item.total_amount)) * 100);
        return (
          <View style={s.invoiceCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text style={s.name}>{item.customer?.full_name}</Text>
                <Text style={s.muted}>#{item.invoice_number}</Text>
              </View>
              <StatusBadge label={item.status} />
            </View>
            <View style={s.progressTrack}>
              <View style={[s.progressFill, { width: `${Math.min(pct, 100)}%`, backgroundColor: pct >= 100 ? '#38a169' : pct > 0 ? '#d69e2e' : '#e2e8f0' }]} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
              <Text style={s.muted}>Total: <Text style={s.bold}>₹{Number(item.total_amount).toLocaleString('en-IN')}</Text></Text>
              <Text style={s.muted}>Paid: <Text style={[s.bold, { color: '#276749' }]}>₹{paid.toLocaleString('en-IN')}</Text></Text>
              <Text style={s.muted}>Due: <Text style={[s.bold, { color: '#c53030' }]}>₹{outstanding.toLocaleString('en-IN')}</Text></Text>
            </View>
            <Text style={[s.muted, { marginTop: 4 }]}>📅 Due: {new Date(item.due_date).toLocaleDateString('en-IN')}</Text>
          </View>
        );
      }}
      contentContainerStyle={{ paddingBottom: 40 }}
    />
  );
};

// ── AUDIT LOGS ────────────────────────────────────────────────────────────────
const AuditTab = ({ token }) => {
  const { data, loading, refreshing, onRefresh } = useFetch(`${API}/api/admin/audit-logs`, token);
  if (loading) return <Loading color="#c53030" />;
  return (
    <FlatList
      style={s.screen}
      data={Array.isArray(data) ? data : []}
      keyExtractor={i => i.id}
      ItemSeparatorComponent={SeparatorLine}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListHeaderComponent={() => (
        <>
          <DashHeader title="Security Audit Logs" subtitle="All sensitive system actions recorded" color1="#2d2d2d" />
          <View style={s.body}><Text style={s.sectionTitle}>Recent Activity</Text></View>
        </>
      )}
      ListEmptyComponent={<Empty msg="No audit logs yet" />}
      renderItem={({ item }) => {
        const isSuccess = item.result === 'SUCCESS';
        return (
          <View style={[s.rowCard, { borderLeftWidth: 3, borderLeftColor: isSuccess ? '#38a169' : '#c53030' }]}>
            <Text style={{ fontSize: 24, marginRight: 12 }}>{isSuccess ? '✅' : '❌'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{item.action.replace(/_/g, ' ')}</Text>
              <Text style={s.muted}>By: {item.actor?.full_name || 'System'}</Text>
              <Text style={s.muted}>🕒 {new Date(item.timestamp).toLocaleString('en-IN')}</Text>
            </View>
            <StatusBadge label={item.result} />
          </View>
        );
      }}
      contentContainerStyle={{ paddingBottom: 40 }}
    />
  );
};

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function AdminDashboard({ token }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#c53030',
        tabBarInactiveTintColor: '#a0aec0',
        tabBarStyle: { borderTopWidth: 0, elevation: 10, shadowOpacity: 0.1 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color }) => {
          const icons = { Overview: '📊', Teams: '👥', Finance: '💰', Audit: '🔐' };
          return <Text style={{ fontSize: 20, color }}>{icons[route.name]}</Text>;
        }
      })}
    >
      <Tab.Screen name="Overview">{() => <OverviewTab token={token} />}</Tab.Screen>
      <Tab.Screen name="Teams">{() => <TeamsTab token={token} />}</Tab.Screen>
      <Tab.Screen name="Finance">{() => <FinanceTab token={token} />}</Tab.Screen>
      <Tab.Screen name="Audit" options={{ title: 'Audit' }}>{() => <AuditTab token={token} />}</Tab.Screen>
    </Tab.Navigator>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f7fafc' },
  body: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#2d3748', marginBottom: 12, marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, width: '47%', alignItems: 'center', elevation: 2 },
  statIcon: { fontSize: 28, marginBottom: 4 },
  statVal: { fontSize: 28, fontWeight: '800' },
  statLabel: { fontSize: 12, color: '#718096', marginTop: 2 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  rowCard: { backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', padding: 16 },
  invoiceCard: { backgroundColor: '#fff', padding: 16 },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontWeight: '800', color: '#2d3748' },
  name: { fontSize: 15, fontWeight: '700', color: '#2d3748' },
  muted: { fontSize: 13, color: '#718096', marginTop: 1 },
  bold: { fontWeight: '700' },
  money: { fontSize: 20, fontWeight: '800', marginTop: 4 },
  bigMoney: { fontSize: 32, fontWeight: '900', marginTop: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  progressTrack: { height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, marginTop: 10, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  emptyWrap: { padding: 40, alignItems: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: '#718096', textAlign: 'center' },
});
