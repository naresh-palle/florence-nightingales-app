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
    <View style={[hdr.overlay, { backgroundColor: '#1a5c2eCC' }]} />
    <View style={hdr.inner}>
      <Text style={hdr.title}>{title}</Text>
      {subtitle ? <Text style={hdr.sub}>{subtitle}</Text> : null}
    </View>
  </ImageBackground>
);
const hdr = StyleSheet.create({ wrap: { height: 110, justifyContent: 'flex-end' }, overlay: { ...StyleSheet.absoluteFillObject }, inner: { padding: 16 }, title: { fontSize: 22, fontWeight: '800', color: '#fff' }, sub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 } });

const StatusBadge = ({ label }) => {
  const colors = { IN_PROGRESS: ['#bee3f8','#2b6cb0'], ASSIGNED: ['#e9d8fd','#553c9a'], TODO: ['#e2e8f0','#4a5568'], COMPLETED: ['#c6f6d5','#276749'], CANCELLED: ['#fed7d7','#c53030'] };
  const [bg, fg] = colors[label] || ['#e2e8f0','#4a5568'];
  return <View style={[s.badge, { backgroundColor: bg }]}><Text style={[s.badgeText, { color: fg }]}>{label?.replace('_', ' ')}</Text></View>;
};

const Loading = () => <View style={s.center}><ActivityIndicator size="large" color="#38a169" /><Text style={[s.muted,{marginTop:12}]}>Loading...</Text></View>;
const Empty = ({ msg }) => <View style={s.emptyWrap}><Text style={{ fontSize: 48 }}>📭</Text><Text style={s.emptyText}>{msg}</Text></View>;
const Divider = () => <View style={{ height: 1, backgroundColor: '#edf2f7', marginHorizontal: 16 }} />;

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
          <DashHeader title="My Assignments" subtitle="Today's care schedule" />
          <View style={s.body}><Text style={s.sectionTitle}>Active Duties ({items.length})</Text></View>
        </>
      )}
      ListEmptyComponent={<Empty msg="No assignments for you right now" />}
      renderItem={({ item }) => (
        <View style={[s.rowCard, { alignItems: 'flex-start' }]}>
          <View style={[s.timeBox]}>
            <Text style={s.timeText}>{item.start_time || '--'}</Text>
            <Text style={s.timeSep}>│</Text>
            <Text style={s.timeText}>{item.end_time || '--'}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={s.name}>{item.customer?.full_name}</Text>
            <Text style={s.muted}>📍 {item.customer?.address || 'Address not set'}</Text>
            <Text style={s.muted}>📞 {item.customer?.phone}</Text>
            <Text style={s.muted}>🏥 {item.service_type}</Text>
            {item.notes && <Text style={[s.muted, { marginTop: 4, fontStyle: 'italic', color: '#4a5568' }]} numberOfLines={2}>{item.notes}</Text>}
            <View style={{ marginTop: 6 }}><StatusBadge label={item.status} /></View>
          </View>
        </View>
      )}
      contentContainerStyle={{ paddingBottom: 40 }}
    />
  );
};

// ── TASKS ─────────────────────────────────────────────────────────────────────
const TasksTab = ({ token }) => {
  const { data, loading, refreshing, onRefresh } = useFetch(`${API}/api/operations/tasks`, token);
  if (loading) return <Loading />;
  const tasks = Array.isArray(data) ? data : [];
  const highCount = tasks.filter(t => t.priority === 'HIGH' && t.status !== 'COMPLETED').length;
  return (
    <FlatList
      style={s.screen}
      data={tasks}
      keyExtractor={i => i.id}
      ItemSeparatorComponent={Divider}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListHeaderComponent={() => (
        <>
          <DashHeader title="My Tasks" subtitle="Pending work items" />
          <View style={s.body}>
            {highCount > 0 && (
              <View style={[s.card, { backgroundColor: '#fff5f5', borderLeftWidth: 4, borderLeftColor: '#c53030', flexDirection: 'row', alignItems: 'center' }]}>
                <Text style={{ fontSize: 28, marginRight: 12 }}>🚨</Text>
                <View>
                  <Text style={[s.name, { color: '#c53030' }]}>{highCount} High Priority Task{highCount > 1 ? 's' : ''}</Text>
                  <Text style={s.muted}>Require immediate attention</Text>
                </View>
              </View>
            )}
            <Text style={s.sectionTitle}>All Tasks ({tasks.length})</Text>
          </View>
        </>
      )}
      ListEmptyComponent={<Empty msg="No tasks. Great work! 🎉" />}
      renderItem={({ item }) => {
        const priorityConfig = { HIGH: { color: '#c53030', icon: '🔴' }, MEDIUM: { color: '#d69e2e', icon: '🟡' }, LOW: { color: '#38a169', icon: '🟢' } };
        const p = priorityConfig[item.priority] || { color: '#718096', icon: '⚪' };
        return (
          <View style={[s.rowCard, { alignItems: 'flex-start', borderLeftWidth: 3, borderLeftColor: p.color }]}>
            <Text style={{ fontSize: 22, marginRight: 10 }}>{p.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{item.title}</Text>
              {item.description && <Text style={s.muted} numberOfLines={2}>{item.description}</Text>}
              {item.due_date && <Text style={[s.muted, { marginTop: 4 }]}>📅 Due: {new Date(item.due_date).toLocaleDateString('en-IN')}</Text>}
              <View style={{ marginTop: 6 }}><StatusBadge label={item.status} /></View>
            </View>
          </View>
        );
      }}
      contentContainerStyle={{ paddingBottom: 40 }}
    />
  );
};

// ── ATTENDANCE ────────────────────────────────────────────────────────────────
const AttendanceTab = ({ token }) => {
  const { data, loading, refreshing, onRefresh } = useFetch(`${API}/api/operations/attendance`, token);
  if (loading) return <Loading />;
  const records = Array.isArray(data) ? data : [];
  const presentDays = records.filter(r => r.check_in).length;
  return (
    <FlatList
      style={s.screen}
      data={records}
      keyExtractor={i => i.id}
      ItemSeparatorComponent={Divider}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListHeaderComponent={() => (
        <>
          <DashHeader title="Attendance" subtitle="Your work hour history" />
          <View style={s.body}>
            <View style={[s.card, { backgroundColor: '#f0fff4', borderLeftWidth: 4, borderLeftColor: '#38a169', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
              <View>
                <Text style={s.muted}>Days Present</Text>
                <Text style={[s.bigNum, { color: '#276749' }]}>{presentDays} / {records.length}</Text>
              </View>
              <Text style={{ fontSize: 44 }}>📅</Text>
            </View>
            <Text style={s.sectionTitle}>Recent History</Text>
          </View>
        </>
      )}
      ListEmptyComponent={<Empty msg="No attendance records yet" />}
      renderItem={({ item }) => {
        const checkIn = item.check_in ? new Date(item.check_in).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';
        const checkOut = item.check_out ? new Date(item.check_out).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';
        const hours = item.check_in && item.check_out ? Math.round((new Date(item.check_out) - new Date(item.check_in)) / 3600000 * 10) / 10 : null;
        return (
          <View style={s.rowCard}>
            <View style={[s.avatar, { backgroundColor: '#c6f6d5' }]}>
              <Text style={s.avatarText}>✅</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.name}>{new Date(item.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}</Text>
              <View style={{ flexDirection: 'row', gap: 16, marginTop: 4 }}>
                <Text style={s.muted}>🟢 In: {checkIn}</Text>
                <Text style={s.muted}>🔴 Out: {checkOut}</Text>
              </View>
              {hours && <Text style={s.muted}>⏱️ {hours} hours worked</Text>}
            </View>
          </View>
        );
      }}
      contentContainerStyle={{ paddingBottom: 40 }}
    />
  );
};

// ── PROFILE ───────────────────────────────────────────────────────────────────
const ProfileTab = ({ token }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(j => { setProfile(j); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);
  if (loading) return <Loading />;
  const fields = [
    { icon: '✉️', label: 'Email', value: profile?.email },
    { icon: '📞', label: 'Phone', value: profile?.phone || 'Not set' },
    { icon: '🏷️', label: 'Role', value: profile?.role },
    { icon: '💼', label: 'Designation', value: profile?.designation || 'Not set' },
    { icon: '🎓', label: 'Qualification', value: profile?.qualification || 'Not set' },
    { icon: '⏳', label: 'Experience', value: profile?.experience || 'Not set' },
    { icon: '📅', label: 'Joined', value: profile?.joining_date ? new Date(profile.joining_date).toLocaleDateString('en-IN') : 'Not set' },
  ];
  return (
    <ScrollView style={s.screen}>
      <DashHeader title="My Profile" subtitle="Account information" />
      <View style={s.body}>
        <View style={[s.card, { alignItems: 'center', paddingVertical: 28, backgroundColor: '#f0fff4' }]}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#38a169', justifyContent: 'center', alignItems: 'center', marginBottom: 14 }}>
            <Text style={{ fontSize: 36, color: '#fff', fontWeight: '800' }}>{profile?.full_name?.charAt(0)}</Text>
          </View>
          <Text style={{ fontSize: 22, fontWeight: '800', color: '#1a365d' }}>{profile?.full_name}</Text>
          <Text style={{ color: '#718096', marginTop: 4 }}>{profile?.role}</Text>
          <View style={[s.badge, { backgroundColor: '#c6f6d5', marginTop: 8 }]}>
            <Text style={[s.badgeText, { color: '#276749' }]}>ACTIVE</Text>
          </View>
        </View>
        <Text style={s.sectionTitle}>Account Details</Text>
        {fields.map(f => (
          <View key={f.label} style={[s.card, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 }]}>
            <Text style={s.muted}>{f.icon}  {f.label}</Text>
            <Text style={{ fontWeight: '700', color: '#2d3748', maxWidth: '55%', textAlign: 'right' }}>{f.value}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

export default function EmployeeDashboard({ token }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#38a169',
        tabBarInactiveTintColor: '#a0aec0',
        tabBarStyle: { borderTopWidth: 0, elevation: 10, shadowOpacity: 0.1 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color }) => {
          const icons = { Assignments: '📋', Tasks: '✅', Attendance: '📅', Profile: '👤' };
          return <Text style={{ fontSize: 20, color }}>{icons[route.name]}</Text>;
        }
      })}
    >
      <Tab.Screen name="Assignments">{() => <AssignmentsTab token={token} />}</Tab.Screen>
      <Tab.Screen name="Tasks">{() => <TasksTab token={token} />}</Tab.Screen>
      <Tab.Screen name="Attendance">{() => <AttendanceTab token={token} />}</Tab.Screen>
      <Tab.Screen name="Profile">{() => <ProfileTab token={token} />}</Tab.Screen>
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
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontWeight: '800', color: '#2d3748' },
  name: { fontSize: 15, fontWeight: '700', color: '#2d3748' },
  muted: { fontSize: 13, color: '#718096', marginTop: 1 },
  bigNum: { fontSize: 36, fontWeight: '900', marginTop: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  timeBox: { alignItems: 'center', backgroundColor: '#ebf8ff', borderRadius: 10, padding: 8, minWidth: 52 },
  timeText: { fontSize: 12, fontWeight: '700', color: '#2b6cb0' },
  timeSep: { color: '#90cdf4', fontSize: 12 },
  emptyWrap: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#718096', textAlign: 'center', marginTop: 8 },
});
