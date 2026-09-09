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

const DashHeader = ({ title, subtitle, color1 = '#1a365d', color2 = '#2c5282', onLogout }) => (
  <ImageBackground source={require('../../assets/dashboard_header.jpg')} style={[hdr.wrap]} resizeMode="cover">
    <View style={[hdr.overlay, { backgroundColor: color1 + 'CC' }]} />
    <View style={[hdr.inner, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }]}>
      <View>
        <Text style={hdr.title}>{title}</Text>
        {subtitle ? <Text style={hdr.sub}>{subtitle}</Text> : null}
      </View>
      {onLogout && (
        <TouchableOpacity style={{ backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }} onPress={onLogout}>
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Sign Out</Text>
        </TouchableOpacity>
      )}
    </View>
  </ImageBackground>
);

const hdr = StyleSheet.create({
  wrap: { height: 110, justifyContent: 'flex-end' },
  overlay: { ...StyleSheet.absoluteFillObject },
  inner: { padding: 16 },
  title: { fontSize: 20, fontWeight: '800', color: '#fff' },
  sub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
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
const OverviewTab = ({ token, onLogout, navigation }) => {
  const { data: stats, loading, refreshing, onRefresh } = useFetch(`${API}/api/admin/stats`, token);
  const [seeding, setSeeding] = useState(false);

  const statItems = [
    { icon: '👥', label: 'Active Users', value: stats?.totalUsers, color: '#3182ce', nav: 'Teams', filter: 'PERSONNEL' },
    { icon: '🏥', label: 'Teams', value: stats?.totalTeams, color: '#805ad5', nav: 'Teams', filter: 'TEAMS' },
    { icon: '🤝', label: 'Customers', value: stats?.totalCustomers, color: '#38a169', nav: 'Teams', filter: 'CUSTOMERS' },
    { icon: '🧾', label: 'Invoices', value: stats?.totalInvoices, color: '#d69e2e', nav: 'Finance', filter: 'ALL' },
  ];

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await fetch(`${API}/api/admin/seed`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setSeeding(false);
      alert('Mock Data Generated!\n' + (data.message || 'Database refreshed. Pull to refresh other tabs!'));
      onRefresh();
    } catch (e) {
      setSeeding(false);
      alert('Seeding request completed. Pull to refresh!');
      onRefresh();
    }
  };

  if (loading && !stats) return <Loading color="#c53030" />;

  return (
    <ScrollView
      style={s.screen}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <DashHeader title="Admin Overview" subtitle="Florence Nightingales Operations" color1="#7b0000" color2="#c53030" onLogout={onLogout} />
      <View style={s.body}>
        <Text style={s.sectionTitle}>Key Metrics (Tap to view details)</Text>
        <View style={s.grid}>
          {statItems.map(item => (
            <TouchableOpacity
              key={item.label}
              style={[s.statCard, { borderTopColor: item.color, borderTopWidth: 3 }]}
              onPress={() => navigation.navigate(item.nav, { filter: item.filter })}
            >
              <Text style={s.statIcon}>{item.icon}</Text>
              <Text style={[s.statVal, { color: item.color }]}>{item.value ?? '—'}</Text>
              <Text style={s.statLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.sectionTitle}>Financial Summary (Tap to filter)</Text>
        <TouchableOpacity
          style={[s.card, { backgroundColor: '#fff5f5', borderLeftWidth: 4, borderLeftColor: '#c53030' }]}
          onPress={() => navigation.navigate('Finance', { filter: 'ALL' })}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={s.muted}>Total Outstanding Balance</Text>
              <Text style={[s.bigMoney, { color: '#c53030' }]}>
                ₹{Number(stats?.pendingAmount || 0).toLocaleString('en-IN')}
              </Text>
            </View>
            <Text style={{ fontSize: 40 }}>💰</Text>
          </View>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity
            style={[s.card, { flex: 1, alignItems: 'center', backgroundColor: '#f0fff4' }]}
            onPress={() => navigation.navigate('Finance', { filter: 'PAID' })}
          >
            <Text style={{ fontSize: 28 }}>✅</Text>
            <Text style={s.muted}>Fully Paid</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.card, { flex: 1, alignItems: 'center', backgroundColor: '#fffff0' }]}
            onPress={() => navigation.navigate('Finance', { filter: 'PENDING' })}
          >
            <Text style={{ fontSize: 28 }}>⏳</Text>
            <Text style={s.muted}>Pending/Partial</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.card, { flex: 1, alignItems: 'center', backgroundColor: '#fff5f5' }]}
            onPress={() => navigation.navigate('Finance', { filter: 'OVERDUE' })}
          >
            <Text style={{ fontSize: 28 }}>🚨</Text>
            <Text style={s.muted}>Overdue</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[s.btn, { marginTop: 24, backgroundColor: '#c53030' }, seeding && { opacity: 0.6 }]}
          onPress={handleSeed}
          disabled={seeding}
        >
          <Text style={s.btnText}>{seeding ? '⏳  Seeding Mock Data...' : '🧹  Reset & Seed Fresh Mock Data'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

// ── TEAMS / DIRECTORY ─────────────────────────────────────────────────────────
const TeamsTab = ({ token, onLogout, route, navigation }) => {
  const [activeTab, setActiveTab] = useState(route?.params?.filter || 'PERSONNEL');

  useEffect(() => {
    if (route?.params?.filter) {
      setActiveTab(route.params.filter);
    }
  }, [route?.params?.filter]);

  const { data: allUsers, loading: uLoading, refreshing: refU, onRefresh: onRefU } = useFetch(`${API}/api/operations/employees`, token);
  const { data: teamsData, loading: tLoading, refreshing: refT, onRefresh: onRefT } = useFetch(`${API}/api/admin/teams`, token);
  const { data: custData, loading: cLoading, refreshing: refC, onRefresh: onRefC } = useFetch(`${API}/api/operations/customers`, token);

  const usersList = Array.isArray(allUsers) ? allUsers : [];
  const teamsList = Array.isArray(teamsData) ? teamsData : [];
  const customersList = Array.isArray(custData) ? custData : [];

  const isUsers = activeTab === 'PERSONNEL';
  const isTeams = activeTab === 'TEAMS';
  const isCustomers = activeTab === 'CUSTOMERS';

  let currentData = usersList;
  let emptyMsg = 'No personnel found';
  if (isTeams) {
    currentData = teamsList;
    emptyMsg = 'No teams configured';
  } else if (isCustomers) {
    currentData = customersList;
    emptyMsg = 'No registered customers';
  }

  const refreshing = isTeams ? refT : isCustomers ? refC : refU;
  const onRefresh = isTeams ? onRefT : isCustomers ? onRefC : onRefU;

  return (
    <FlatList
      style={s.screen}
      data={currentData}
      keyExtractor={i => i.id || String(Math.random())}
      ItemSeparatorComponent={SeparatorLine}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListHeaderComponent={() => (
        <>
          <DashHeader title="Directory & Operations" subtitle="Personnel, Teams, and Registered Customers" color1="#1a365d" onLogout={onLogout} />
          <View style={s.body}>
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
              <TouchableOpacity
                style={[s.pill, isUsers && s.pillActive]}
                onPress={() => setActiveTab('PERSONNEL')}
              >
                <Text style={[s.pillText, isUsers && s.pillTextActive]}>👥 Personnel ({usersList.length})</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.pill, isTeams && s.pillActive]}
                onPress={() => setActiveTab('TEAMS')}
              >
                <Text style={[s.pillText, isTeams && s.pillTextActive]}>🏥 Teams ({teamsList.length})</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.pill, isCustomers && s.pillActive]}
                onPress={() => setActiveTab('CUSTOMERS')}
              >
                <Text style={[s.pillText, isCustomers && s.pillTextActive]}>🤝 Customers ({customersList.length})</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
      ListEmptyComponent={<Empty msg={emptyMsg} />}
      renderItem={({ item }) => {
        if (isTeams) {
          return (
            <TouchableOpacity
              style={s.rowCard}
              onPress={() => alert(`Team: ${item.name}\nDescription: ${item.description || 'N/A'}\nLead: ${item.team_lead?.full_name || 'Unassigned'}\nStaff Members: ${item._count?.employees || 0}\nCustomers: ${item._count?.customers || 0}`)}
            >
              <View style={[s.avatar, { backgroundColor: '#e9d8fd' }]}>
                <Text style={s.avatarText}>🏥</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={s.name}>{item.name}</Text>
                <Text style={s.muted}>{item.description || 'General operations'}</Text>
                <Text style={[s.muted, { marginTop: 4, fontSize: 11 }]}>
                  Lead: <Text style={s.bold}>{item.team_lead?.full_name || 'None'}</Text> • Members: <Text style={s.bold}>{item._count?.employees || 0}</Text> • Customers: <Text style={s.bold}>{item._count?.customers || 0}</Text>
                </Text>
              </View>
              <StatusBadge label={item.status || 'ACTIVE'} />
            </TouchableOpacity>
          );
        }

        if (isCustomers) {
          return (
            <TouchableOpacity
              style={s.rowCard}
              onPress={() => alert(`Customer: ${item.full_name}\nPhone: ${item.phone}\nEmail: ${item.email || 'N/A'}\nService: ${item.service_type || 'Care Support'}\nAddress: ${item.address || 'N/A'}`)}
            >
              <View style={[s.avatar, { backgroundColor: '#c6f6d5' }]}>
                <Text style={s.avatarText}>🤝</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={s.name}>{item.full_name}</Text>
                  <StatusBadge label={item.status || 'ACTIVE'} />
                </View>
                <Text style={s.muted}>📞 {item.phone} • ✉️ {item.email || 'N/A'}</Text>
                <Text style={[s.muted, { marginTop: 2, fontSize: 11 }]}>Service: {item.service_type || 'Care Support'}</Text>
                {item.address && <Text style={[s.muted, { fontSize: 11 }]}>📍 {item.address}</Text>}
              </View>
            </TouchableOpacity>
          );
        }

        // Default: Personnel
        return (
          <TouchableOpacity
            style={[s.rowCard]}
            onPress={() => alert(`Personnel: ${item.full_name}\nRole: ${item.role}\nEmail: ${item.email}\nPhone: ${item.phone || 'N/A'}\nDesignation: ${item.designation || 'Staff'}\nQualification: ${item.qualification || 'N/A'}`)}
          >
            <View style={[s.avatar, { backgroundColor: item.role === 'ADMIN' ? '#fed7d7' : item.role === 'TEAM_LEAD' ? '#bee3f8' : '#c6f6d5' }]}>
              <Text style={s.avatarText}>{item.full_name?.charAt(0)}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.name}>{item.full_name}</Text>
              <Text style={s.muted}>{item.email} • {item.phone || 'No phone'}</Text>
              {item.designation && <Text style={s.muted}>🏷️ {item.designation}</Text>}
            </View>
            <StatusBadge label={item.role === 'ADMIN' ? 'ADMIN' : item.role === 'TEAM_LEAD' ? 'LEAD' : 'STAFF'} />
          </TouchableOpacity>
        );
      }}
      contentContainerStyle={{ paddingBottom: 40 }}
    />
  );
};

// ── FINANCIALS ────────────────────────────────────────────────────────────────
const FinanceTab = ({ token, onLogout, route }) => {
  const [filterStatus, setFilterStatus] = useState(route?.params?.filter || 'ALL');

  useEffect(() => {
    if (route?.params?.filter) {
      setFilterStatus(route.params.filter);
    }
  }, [route?.params?.filter]);

  const { data, loading, refreshing, onRefresh } = useFetch(`${API}/api/admin/invoices`, token);
  if (loading && !data) return <Loading color="#1a3a1a" />;

  const invoices = Array.isArray(data) ? data : [];
  const totalBilled = invoices.reduce((a, i) => a + Number(i.total_amount), 0);
  const totalCollected = invoices.reduce((a, i) => a + (i.payments?.filter(p => p.status === 'CONFIRMED').reduce((s, p) => s + Number(p.amount), 0) || 0), 0);
  const outstanding = totalBilled - totalCollected;

  const filteredInvoices = invoices.filter(i => {
    if (filterStatus === 'PAID') return i.status === 'PAID';
    if (filterStatus === 'PENDING') return i.status === 'PENDING' || i.status === 'PARTIALLY_PAID';
    if (filterStatus === 'OVERDUE') return i.status === 'OVERDUE';
    return true;
  });

  return (
    <FlatList
      style={s.screen}
      data={filteredInvoices}
      keyExtractor={i => i.id || String(Math.random())}
      ItemSeparatorComponent={SeparatorLine}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListHeaderComponent={() => (
        <>
          <DashHeader title="Financial Management" subtitle="Invoices, collections & outstanding" color1="#1a3a1a" onLogout={onLogout} />
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

            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
              <TouchableOpacity
                style={[s.pill, filterStatus === 'ALL' && s.pillActive]}
                onPress={() => setFilterStatus('ALL')}
              >
                <Text style={[s.pillText, filterStatus === 'ALL' && s.pillTextActive]}>All ({invoices.length})</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.pill, filterStatus === 'PAID' && s.pillActive]}
                onPress={() => setFilterStatus('PAID')}
              >
                <Text style={[s.pillText, filterStatus === 'PAID' && s.pillTextActive]}>Paid</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.pill, filterStatus === 'PENDING' && s.pillActive]}
                onPress={() => setFilterStatus('PENDING')}
              >
                <Text style={[s.pillText, filterStatus === 'PENDING' && s.pillTextActive]}>Pending</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.pill, filterStatus === 'OVERDUE' && s.pillActive]}
                onPress={() => setFilterStatus('OVERDUE')}
              >
                <Text style={[s.pillText, filterStatus === 'OVERDUE' && s.pillTextActive]}>Overdue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
      ListEmptyComponent={<Empty msg="No invoices found matching filter" />}
      renderItem={({ item }) => {
        const paid = item.payments?.filter(p => p.status === 'CONFIRMED').reduce((a, p) => a + Number(p.amount), 0) || 0;
        const bal = Number(item.total_amount) - paid;
        const pct = Math.round((paid / Number(item.total_amount)) * 100);
        return (
          <TouchableOpacity
            style={s.invoiceCard}
            onPress={() => alert(`Invoice #${item.invoice_number}\nCustomer: ${item.customer?.full_name}\nTotal: ₹${Number(item.total_amount).toLocaleString('en-IN')}\nPaid: ₹${paid.toLocaleString('en-IN')}\nBalance Due: ₹${bal.toLocaleString('en-IN')}\nStatus: ${item.status}\nDue Date: ${new Date(item.due_date).toLocaleDateString('en-IN')}`)}
          >
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
              <Text style={s.muted}>Due: <Text style={[s.bold, { color: '#c53030' }]}>₹{bal.toLocaleString('en-IN')}</Text></Text>
            </View>
            <Text style={[s.muted, { marginTop: 4 }]}>📅 Due: {new Date(item.due_date).toLocaleDateString('en-IN')}</Text>
          </TouchableOpacity>
        );
      }}
      contentContainerStyle={{ paddingBottom: 40 }}
    />
  );
};

// ── AUDIT LOGS ────────────────────────────────────────────────────────────────
const AuditTab = ({ token, onLogout }) => {
  const { data, loading, refreshing, onRefresh } = useFetch(`${API}/api/admin/audit-logs`, token);
  if (loading && !data) return <Loading color="#2d2d2d" />;

  const logs = Array.isArray(data) ? data : [];

  return (
    <FlatList
      style={s.screen}
      data={logs}
      keyExtractor={i => i.id || String(Math.random())}
      ItemSeparatorComponent={SeparatorLine}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListHeaderComponent={() => (
        <>
          <DashHeader title="Security Audit Logs" subtitle="All sensitive system actions recorded" color1="#2d2d2d" onLogout={onLogout} />
          <View style={s.body}><Text style={s.sectionTitle}>Recent Activity ({logs.length})</Text></View>
        </>
      )}
      ListEmptyComponent={<Empty msg="No audit logs yet" />}
      renderItem={({ item }) => {
        const isSuccess = item.result === 'SUCCESS';
        return (
          <TouchableOpacity
            style={[s.rowCard, { borderLeftWidth: 3, borderLeftColor: isSuccess ? '#38a169' : '#c53030' }]}
            onPress={() => alert(`Audit Event: ${item.action}\nEntity: ${item.entity_type} (${item.entity_id || 'N/A'})\nActor: ${item.actor?.full_name || 'System'}\nResult: ${item.result}\nTimestamp: ${new Date(item.timestamp).toLocaleString('en-IN')}`)}
          >
            <Text style={{ fontSize: 24, marginRight: 12 }}>{isSuccess ? '✅' : '❌'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{item.action.replace(/_/g, ' ')}</Text>
              <Text style={s.muted}>By: {item.actor?.full_name || 'System'}</Text>
              <Text style={s.muted}>🕒 {new Date(item.timestamp).toLocaleString('en-IN')}</Text>
            </View>
            <StatusBadge label={item.result} />
          </TouchableOpacity>
        );
      }}
      contentContainerStyle={{ paddingBottom: 40 }}
    />
  );
};

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function AdminDashboard({ token, onLogout }) {
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
      <Tab.Screen name="Overview">{({ navigation }) => <OverviewTab token={token} onLogout={onLogout} navigation={navigation} />}</Tab.Screen>
      <Tab.Screen name="Teams">{({ route, navigation }) => <TeamsTab token={token} onLogout={onLogout} route={route} navigation={navigation} />}</Tab.Screen>
      <Tab.Screen name="Finance">{({ route, navigation }) => <FinanceTab token={token} onLogout={onLogout} route={route} navigation={navigation} />}</Tab.Screen>
      <Tab.Screen name="Audit" options={{ title: 'Audit' }}>{() => <AuditTab token={token} onLogout={onLogout} />}</Tab.Screen>
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
  btn: { backgroundColor: '#c53030', borderRadius: 12, padding: 14, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  pill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#edf2f7' },
  pillActive: { backgroundColor: '#1a365d' },
  pillText: { fontSize: 12, fontWeight: '700', color: '#4a5568' },
  pillTextActive: { color: '#ffffff' },
});
