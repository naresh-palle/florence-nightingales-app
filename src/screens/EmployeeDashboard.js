import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, ScrollView } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Tab = createBottomTabNavigator();
const API = 'https://florence-nightingales-app.onrender.com';
const colors = { accent: '#38a169', bg: '#f7fafc', card: '#fff', muted: '#718096', dark: '#1a365d' };

function useFetch(url, token) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(j => { setData(j); setLoading(false); })
      .catch(() => { setError('Could not load data'); setLoading(false); });
  }, [url]);
  return { data, loading, error };
}

function Screen({ loading, error, children }) {
  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={colors.accent} /></View>;
  if (error) return <View style={s.center}><Text style={{ color: 'red' }}>{error}</Text></View>;
  return children;
}

// ─── Assignments (Home) ───────────────────────────────────────────────────────
const AssignmentsTab = ({ token }) => {
  const { data, loading, error } = useFetch(`${API}/api/operations/assignments`, token);
  return (
    <Screen loading={loading} error={error}>
      <FlatList
        style={s.container}
        data={Array.isArray(data) ? data : []}
        keyExtractor={i => i.id}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={<Text style={s.heading}>My Assignments</Text>}
        ListEmptyComponent={<Text style={s.empty}>No assignments yet</Text>}
        renderItem={({ item }) => (
          <View style={s.card}>
            <Text style={s.name}>{item.customer?.full_name}</Text>
            <Text style={s.sub}>📍 {item.customer?.address || 'Address not set'}</Text>
            <Text style={s.sub}>📞 {item.customer?.phone}</Text>
            <Text style={s.sub}>🏥 {item.service_type}</Text>
            <Text style={s.sub}>📅 {new Date(item.start_date).toLocaleDateString('en-IN')}</Text>
            {item.start_time && (
              <Text style={s.sub}>🕐 {item.start_time} – {item.end_time || 'Open-ended'}</Text>
            )}
            <View style={[s.badge, { alignSelf: 'flex-start', marginTop: 6, backgroundColor: '#c6f6d5' }]}>
              <Text style={s.badgeText}>{item.status}</Text>
            </View>
          </View>
        )}
      />
    </Screen>
  );
};

// ─── Tasks ────────────────────────────────────────────────────────────────────
const TasksTab = ({ token }) => {
  const { data, loading, error } = useFetch(`${API}/api/operations/tasks`, token);
  return (
    <Screen loading={loading} error={error}>
      <FlatList
        style={s.container}
        data={Array.isArray(data) ? data : []}
        keyExtractor={i => i.id}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={<Text style={s.heading}>My Tasks</Text>}
        ListEmptyComponent={<Text style={s.empty}>No pending tasks. Great job! 🎉</Text>}
        renderItem={({ item }) => {
          const priorityColor = item.priority === 'HIGH' ? '#e53e3e' : item.priority === 'MEDIUM' ? '#d69e2e' : '#38a169';
          return (
            <View style={[s.card, { borderLeftWidth: 4, borderLeftColor: priorityColor }]}>
              <Text style={s.name}>{item.title}</Text>
              {item.description && <Text style={s.sub}>{item.description}</Text>}
              {item.priority && <Text style={[s.sub, { color: priorityColor, fontWeight: 'bold' }]}>Priority: {item.priority}</Text>}
              {item.due_date && <Text style={s.sub}>Due: {new Date(item.due_date).toLocaleDateString('en-IN')}</Text>}
              <View style={[s.badge, { alignSelf: 'flex-start', marginTop: 6, backgroundColor: '#bee3f8' }]}>
                <Text style={s.badgeText}>{item.status}</Text>
              </View>
            </View>
          );
        }}
      />
    </Screen>
  );
};

// ─── Attendance ───────────────────────────────────────────────────────────────
const AttendanceTab = ({ token }) => {
  const { data, loading, error } = useFetch(`${API}/api/operations/attendance`, token);
  return (
    <Screen loading={loading} error={error}>
      <FlatList
        style={s.container}
        data={Array.isArray(data) ? data : []}
        keyExtractor={i => i.id}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={<Text style={s.heading}>Attendance History</Text>}
        ListEmptyComponent={<Text style={s.empty}>No attendance records yet</Text>}
        renderItem={({ item }) => {
          const checkIn = item.check_in ? new Date(item.check_in).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';
          const checkOut = item.check_out ? new Date(item.check_out).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';
          return (
            <View style={s.card}>
              <Text style={s.name}>{new Date(item.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                <Text style={s.sub}>🟢 In: {checkIn}</Text>
                <Text style={s.sub}>🔴 Out: {checkOut}</Text>
              </View>
            </View>
          );
        }}
      />
    </Screen>
  );
};

// ─── Profile ──────────────────────────────────────────────────────────────────
const ProfileTab = ({ token }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(j => { setProfile(j); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={colors.accent} /></View>;

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={s.heading}>My Profile</Text>
      <View style={[s.card, { alignItems: 'center', paddingVertical: 24 }]}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#c6f6d5', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontSize: 32 }}>👤</Text>
        </View>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.dark }}>{profile?.full_name || '—'}</Text>
        <Text style={{ color: colors.muted, marginTop: 4 }}>{profile?.role}</Text>
      </View>
      {[
        { label: '✉️ Email', value: profile?.email },
        { label: '📞 Phone', value: profile?.phone || 'Not set' },
        { label: '🏷️ Designation', value: profile?.designation || 'Not set' },
        { label: '🎓 Qualification', value: profile?.qualification || 'Not set' },
        { label: '📅 Joined', value: profile?.joining_date ? new Date(profile.joining_date).toLocaleDateString('en-IN') : 'Not set' },
      ].map(row => (
        <View key={row.label} style={[s.card, { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 }]}>
          <Text style={s.sub}>{row.label}</Text>
          <Text style={{ fontWeight: '600', color: colors.dark }}>{row.value}</Text>
        </View>
      ))}
    </ScrollView>
  );
};

export default function EmployeeDashboard({ token }) {
  return (
    <Tab.Navigator screenOptions={{ headerTitleAlign: 'center', tabBarActiveTintColor: colors.accent, tabBarLabelStyle: { fontSize: 11 } }}>
      <Tab.Screen name="Assignments" options={{ title: 'Assignments' }}>
        {() => <AssignmentsTab token={token} />}
      </Tab.Screen>
      <Tab.Screen name="Tasks" options={{ title: 'Tasks' }}>
        {() => <TasksTab token={token} />}
      </Tab.Screen>
      <Tab.Screen name="Attendance" options={{ title: 'Attendance' }}>
        {() => <AttendanceTab token={token} />}
      </Tab.Screen>
      <Tab.Screen name="Profile" options={{ title: 'Profile' }}>
        {() => <ProfileTab token={token} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heading: { fontSize: 20, fontWeight: 'bold', color: colors.dark, marginBottom: 12 },
  card: { backgroundColor: colors.card, borderRadius: 10, padding: 16, marginBottom: 12, elevation: 2 },
  name: { fontSize: 15, fontWeight: 'bold', color: colors.dark },
  sub: { fontSize: 13, color: colors.muted, marginTop: 2 },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 40 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: 'bold' },
});
