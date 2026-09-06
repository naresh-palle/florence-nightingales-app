import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, ScrollView, ImageBackground, RefreshControl } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Tab = createBottomTabNavigator();
const API = 'https://florence-nightingales-app.onrender.com';

function useFetch(url, token) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const load = (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(j => { setData(j); setLoading(false); setRefreshing(false); })
      .catch(() => { setLoading(false); setRefreshing(false); });
  };
  useEffect(() => { load(); }, [url]);
  return { data, loading, refreshing, onRefresh: () => load(true) };
}

const DashHeader = ({ title, subtitle }) => (
  <ImageBackground source={require('../../assets/dashboard_header.jpg')} style={hdr.wrap} resizeMode="cover">
    <View style={[hdr.overlay, { backgroundColor: '#1a4a6bCC' }]} />
    <View style={hdr.inner}>
      <Text style={hdr.title}>{title}</Text>
      {subtitle ? <Text style={hdr.sub}>{subtitle}</Text> : null}
    </View>
  </ImageBackground>
);
const hdr = StyleSheet.create({ wrap: { height: 110, justifyContent: 'flex-end' }, overlay: { ...StyleSheet.absoluteFillObject }, inner: { padding: 16 }, title: { fontSize: 22, fontWeight: '800', color: '#fff' }, sub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 } });

const StatusBadge = ({ label }) => {
  const colors = { ACTIVE: ['#c6f6d5','#276749'], IN_PROGRESS: ['#bee3f8','#2b6cb0'], ASSIGNED: ['#e9d8fd','#553c9a'], OVERDUE: ['#fed7d7','#c53030'], PENDING: ['#fefcbf','#744210'], PARTIALLY_PAID: ['#fbd38d','#744210'], PAID: ['#c6f6d5','#276749'], TODO: ['#e2e8f0','#4a5568'], COMPLETED: ['#c6f6d5','#276749'] };
  const [bg, fg] = colors[label] || ['#e2e8f0','#4a5568'];
  return <View style={[s.badge, { backgroundColor: bg }]}><Text style={[s.badgeText, { color: fg }]}>{label?.replace('_',' ')}</Text></View>;
};

const Loading = () => <View style={s.center}><ActivityIndicator size="large" color="#3182ce" /><Text style={[s.muted,{marginTop:12}]}>Loading...</Text></View>;
const Empty = ({ msg }) => <View style={s.emptyWrap}><Text style={{ fontSize: 48 }}>📭</Text><Text style={s.emptyText}>{msg || 'No records found'}</Text></View>;
const Divider = () => <View style={{ height: 1, backgroundColor: '#edf2f7', marginHorizontal: 16 }} />;

// ── CUSTOMERS ─────────────────────────────────────────────────────────────────
const CustomersTab = ({ token }) => {
  const { data, loading, refreshing, onRefresh } = useFetch(`${API}/api/operations/customers`, token);
  if (loading) return <Loading />;
  const customers = Array.isArray(data) ? data : [];
  return (
    <FlatList
      style={s.screen}
      data={customers}
      keyExtractor={i => i.id}
      ItemSeparatorComponent={Divider}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListHeaderComponent={() => (
        <>
          <DashHeader title="My Customers" subtitle={`${customers.length} active patients`} />
          <View style={s.body}><Text style={s.sectionTitle}>Patient Roster</Text></View>
        </>
      )}
      ListEmptyComponent={<Empty msg="No customers in your team" />}
      renderItem={({ item }) => (
        <View style={s.rowCard}>
          <View style={[s.avatar, { backgroundColor: '#bee3f8' }]}>
            <Text style={s.avatarText}>{item.full_name?.charAt(0)}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={s.name}>{item.full_name}</Text>
            <Text style={s.muted}>📞 {item.phone}</Text>
            {item.service_type && <Text style={s.muted}>🏥 {item.service_type}</Text>}
            {item.address && <Text style={s.muted} numberOfLines={1}>📍 {item.address}</Text>}
          </View>
          <StatusBadge label={item.status} />
        </View>
      )}
      contentContainerStyle={{ paddingBottom: 40 }}
    />
  );
};

// ── STAFF ─────────────────────────────────────────────────────────────────────
const StaffTab = ({ token }) => {
  const { data, loading, refreshing, onRefresh } = useFetch(`${API}/api/operations/employees`, token);
  if (loading) return <Loading />;
  const staff = Array.isArray(data) ? data : [];
  return (
    <FlatList
      style={s.screen}
      data={staff}
      keyExtractor={i => i.id}
      ItemSeparatorComponent={Divider}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListHeaderComponent={() => (
        <>
          <DashHeader title="My Team Staff" subtitle={`${staff.length} team members`} />
          <View style={s.body}><Text style={s.sectionTitle}>Team Members</Text></View>
        </>
      )}
      ListEmptyComponent={<Empty msg="No staff in your team" />}
      renderItem={({ item }) => (
        <View style={s.rowCard}>
          <View style={[s.avatar, { backgroundColor: '#c6f6d5' }]}>
            <Text style={s.avatarText}>{item.full_name?.charAt(0)}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={s.name}>{item.full_name}</Text>
            <Text style={s.muted}>✉️ {item.email}</Text>
            {item.phone && <Text style={s.muted}>📞 {item.phone}</Text>}
            {item.designation && <Text style={s.muted}>🏷️ {item.designation}</Text>}
          </View>
          <StatusBadge label={item.status} />
        </View>
      )}
      contentContainerStyle={{ paddingBottom: 40 }}
    />
  );
};

// ── ASSIGNMENTS ───────────────────────────────────────────────────────────────
const AssignmentsTab = ({ token }) => {
  const { data, loading, refreshing, onRefresh } = useFetch(`${API}/api/operations/assignments`, token);
  if (loading) return <Loading />;
  const items = Array.isArray(data) ? data : [];
  return (
    <FlatList
      style={s.screen}
      data={items}
      keyExtractor={i => i.id}
      ItemSeparatorComponent={Divider}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListHeaderComponent={() => (
        <>
          <DashHeader title="Care Assignments" subtitle="Active patient-staff pairings" />
          <View style={s.body}><Text style={s.sectionTitle}>Active Assignments ({items.length})</Text></View>
        </>
      )}
      ListEmptyComponent={<Empty msg="No assignments yet" />}
      renderItem={({ item }) => (
        <View style={[s.rowCard, { alignItems: 'flex-start' }]}>
          <Text style={{ fontSize: 28, marginRight: 12 }}>🏥</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.name}>{item.customer?.full_name}</Text>
            <Text style={s.muted}>👤 {item.employee?.full_name || 'Unassigned'}</Text>
            <Text style={s.muted}>🏷️ {item.service_type}</Text>
            {item.start_time && <Text style={s.muted}>🕐 {item.start_time} – {item.end_time || 'Open'}</Text>}
            {item.notes && <Text style={[s.muted, { marginTop: 4, fontStyle: 'italic' }]} numberOfLines={2}>{item.notes}</Text>}
            <View style={{ marginTop: 6 }}><StatusBadge label={item.status} /></View>
          </View>
        </View>
      )}
      contentContainerStyle={{ paddingBottom: 40 }}
    />
  );
};

// ── PAYMENTS ──────────────────────────────────────────────────────────────────
const PaymentsTab = ({ token }) => {
  const { data, loading, refreshing, onRefresh } = useFetch(`${API}/api/operations/invoices`, token);
  if (loading) return <Loading />;
  const invoices = Array.isArray(data) ? data : [];
  const totalDue = invoices.reduce((a, i) => {
    const paid = i.payments?.filter(p => p.status === 'CONFIRMED').reduce((s, p) => s + Number(p.amount), 0) || 0;
    return a + (Number(i.total_amount) - paid);
  }, 0);

  return (
    <FlatList
      style={s.screen}
      data={invoices}
      keyExtractor={i => i.id}
      ItemSeparatorComponent={Divider}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListHeaderComponent={() => (
        <>
          <DashHeader title="Payment Collections" subtitle="Team invoice & collection status" />
          <View style={s.body}>
            <View style={[s.card, { backgroundColor: '#fff5f5', borderLeftWidth: 4, borderLeftColor: '#c53030' }]}>
              <Text style={s.muted}>Total Outstanding (My Team)</Text>
              <Text style={[s.bigMoney, { color: '#c53030' }]}>₹{totalDue.toLocaleString('en-IN')}</Text>
            </View>
            <Text style={s.sectionTitle}>Invoices ({invoices.length})</Text>
          </View>
        </>
      )}
      ListEmptyComponent={<Empty msg="No invoices for your team" />}
      renderItem={({ item }) => {
        const paid = item.payments?.filter(p => p.status === 'CONFIRMED').reduce((a, p) => a + Number(p.amount), 0) || 0;
        const outstanding = Number(item.total_amount) - paid;
        const pct = Number(item.total_amount) > 0 ? Math.round((paid / Number(item.total_amount)) * 100) : 0;
        const isOverdue = outstanding > 0 && new Date(item.due_date) < new Date();
        return (
          <View style={[s.invoiceCard, isOverdue && { borderLeftWidth: 3, borderLeftColor: '#c53030' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={s.name}>{item.customer?.full_name}</Text>
              <StatusBadge label={item.status} />
            </View>
            <Text style={s.muted}>#{item.invoice_number}</Text>
            <View style={s.progressTrack}>
              <View style={[s.progressFill, { width: `${Math.min(pct, 100)}%`, backgroundColor: pct >= 100 ? '#38a169' : '#d69e2e' }]} />
            </View>
            <Text style={s.muted}>Collected {pct}% · ₹{paid.toLocaleString('en-IN')} of ₹{Number(item.total_amount).toLocaleString('en-IN')}</Text>
            {outstanding > 0 && <Text style={[s.muted, { color: '#c53030', fontWeight: '700', marginTop: 2 }]}>⚠️ Due: ₹{outstanding.toLocaleString('en-IN')}</Text>}
            <Text style={s.muted}>📅 {new Date(item.due_date).toLocaleDateString('en-IN')}</Text>
            {item.payments?.length > 0 && (
              <View style={{ marginTop: 8 }}>
                <Text style={[s.muted, { fontWeight: '700', marginBottom: 4 }]}>Payment History:</Text>
                {item.payments.filter(p => p.status === 'CONFIRMED').map(p => (
                  <Text key={p.id} style={s.muted}>  ✅ ₹{Number(p.amount).toLocaleString('en-IN')} via {p.payment_method} · {new Date(p.payment_date).toLocaleDateString('en-IN')}</Text>
                ))}
              </View>
            )}
          </View>
        );
      }}
      contentContainerStyle={{ paddingBottom: 40 }}
    />
  );
};

export default function TeamLeadDashboard({ token }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#3182ce',
        tabBarInactiveTintColor: '#a0aec0',
        tabBarStyle: { borderTopWidth: 0, elevation: 10, shadowOpacity: 0.1 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color }) => {
          const icons = { Customers: '🤝', Staff: '👥', Assignments: '📋', Payments: '💳' };
          return <Text style={{ fontSize: 20, color }}>{icons[route.name]}</Text>;
        }
      })}
    >
      <Tab.Screen name="Customers">{() => <CustomersTab token={token} />}</Tab.Screen>
      <Tab.Screen name="Staff">{() => <StaffTab token={token} />}</Tab.Screen>
      <Tab.Screen name="Assignments">{() => <AssignmentsTab token={token} />}</Tab.Screen>
      <Tab.Screen name="Payments">{() => <PaymentsTab token={token} />}</Tab.Screen>
    </Tab.Navigator>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f7fafc' },
  body: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#2d3748', marginBottom: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  rowCard: { backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', padding: 16 },
  invoiceCard: { backgroundColor: '#fff', padding: 16 },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontWeight: '800', color: '#2d3748' },
  name: { fontSize: 15, fontWeight: '700', color: '#2d3748' },
  muted: { fontSize: 13, color: '#718096', marginTop: 1 },
  bigMoney: { fontSize: 30, fontWeight: '900', marginTop: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  progressTrack: { height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, marginVertical: 8, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  emptyWrap: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#718096', textAlign: 'center', marginTop: 8 },
});
