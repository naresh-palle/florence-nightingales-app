import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, ScrollView } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Tab = createBottomTabNavigator();
const API = 'https://florence-nightingales-app.onrender.com';
const colors = { accent: '#3182ce', bg: '#f7fafc', card: '#fff', muted: '#718096', dark: '#1a365d' };

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

// ─── Customers ────────────────────────────────────────────────────────────────
const CustomersTab = ({ token }) => {
  const { data, loading, error } = useFetch(`${API}/api/operations/customers`, token);
  return (
    <Screen loading={loading} error={error}>
      <FlatList
        style={s.container}
        data={Array.isArray(data) ? data : []}
        keyExtractor={i => i.id}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={<Text style={s.heading}>My Team's Customers</Text>}
        ListEmptyComponent={<Text style={s.empty}>No customers assigned to your team</Text>}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={s.name}>{item.full_name}</Text>
              <View style={[s.badge, item.status === 'ACTIVE' ? s.badgeGreen : s.badgeGrey]}>
                <Text style={s.badgeText}>{item.status}</Text>
              </View>
            </View>
            <Text style={s.sub}>📞 {item.phone}</Text>
            {item.email && <Text style={s.sub}>✉️ {item.email}</Text>}
            {item.address && <Text style={s.sub}>📍 {item.address}</Text>}
            {item.service_type && <Text style={s.sub}>🏥 {item.service_type}</Text>}
          </View>
        )}
      />
    </Screen>
  );
};

// ─── Employees ────────────────────────────────────────────────────────────────
const EmployeesTab = ({ token }) => {
  const { data, loading, error } = useFetch(`${API}/api/operations/employees`, token);
  return (
    <Screen loading={loading} error={error}>
      <FlatList
        style={s.container}
        data={Array.isArray(data) ? data : []}
        keyExtractor={i => i.id}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={<Text style={s.heading}>My Team's Staff</Text>}
        ListEmptyComponent={<Text style={s.empty}>No staff in your team yet</Text>}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={s.name}>{item.full_name}</Text>
              <View style={[s.badge, item.status === 'ACTIVE' ? s.badgeGreen : s.badgeRed]}>
                <Text style={s.badgeText}>{item.status}</Text>
              </View>
            </View>
            <Text style={s.sub}>✉️ {item.email}</Text>
            {item.phone && <Text style={s.sub}>📞 {item.phone}</Text>}
            {item.designation && <Text style={s.sub}>🏷️ {item.designation}</Text>}
          </View>
        )}
      />
    </Screen>
  );
};

// ─── Payments ─────────────────────────────────────────────────────────────────
const PaymentsTab = ({ token }) => {
  const { data, loading, error } = useFetch(`${API}/api/operations/invoices`, token);
  return (
    <Screen loading={loading} error={error}>
      <FlatList
        style={s.container}
        data={Array.isArray(data) ? data : []}
        keyExtractor={i => i.id}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={<Text style={s.heading}>Team Payment Collections</Text>}
        ListEmptyComponent={<Text style={s.empty}>No invoices for your team</Text>}
        renderItem={({ item }) => {
          const paid = item.payments?.filter(p => p.status === 'CONFIRMED').reduce((a, p) => a + Number(p.amount), 0) || 0;
          const outstanding = Number(item.total_amount) - paid;
          const isOverdue = outstanding > 0 && new Date(item.due_date) < new Date();
          return (
            <View style={[s.card, isOverdue && { borderLeftWidth: 3, borderLeftColor: '#e53e3e' }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={s.name}>{item.customer?.full_name}</Text>
                <Text style={[s.badgeText, { color: outstanding <= 0 ? '#38a169' : '#e53e3e', fontWeight: 'bold' }]}>
                  {outstanding <= 0 ? 'PAID' : isOverdue ? 'OVERDUE' : 'PENDING'}
                </Text>
              </View>
              <Text style={s.sub}>Invoice: {item.invoice_number}</Text>
              <Text style={s.sub}>Total: ₹{Number(item.total_amount).toLocaleString('en-IN')}</Text>
              <Text style={s.sub}>Collected: ₹{paid.toLocaleString('en-IN')}</Text>
              <Text style={[s.sub, { color: outstanding > 0 ? '#e53e3e' : '#38a169', fontWeight: 'bold' }]}>
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

// ─── Assignments ──────────────────────────────────────────────────────────────
const AssignmentsTab = ({ token }) => {
  const { data, loading, error } = useFetch(`${API}/api/operations/assignments`, token);
  return (
    <Screen loading={loading} error={error}>
      <FlatList
        style={s.container}
        data={Array.isArray(data) ? data : []}
        keyExtractor={i => i.id}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={<Text style={s.heading}>Care Assignments</Text>}
        ListEmptyComponent={<Text style={s.empty}>No active assignments</Text>}
        renderItem={({ item }) => (
          <View style={s.card}>
            <Text style={s.name}>{item.customer?.full_name}</Text>
            <Text style={s.sub}>Staff: {item.employee?.full_name || 'Unassigned'}</Text>
            <Text style={s.sub}>Service: {item.service_type}</Text>
            <Text style={s.sub}>Start: {new Date(item.start_date).toLocaleDateString('en-IN')}</Text>
            {item.start_time && <Text style={s.sub}>Time: {item.start_time} – {item.end_time || '?'}</Text>}
            <View style={[s.badge, s.badgeBlue, { alignSelf: 'flex-start', marginTop: 4 }]}>
              <Text style={s.badgeText}>{item.status}</Text>
            </View>
          </View>
        )}
      />
    </Screen>
  );
};

export default function TeamLeadDashboard({ token }) {
  return (
    <Tab.Navigator screenOptions={{ headerTitleAlign: 'center', tabBarActiveTintColor: colors.accent, tabBarLabelStyle: { fontSize: 11 } }}>
      <Tab.Screen name="Customers" options={{ title: 'Customers' }}>
        {() => <CustomersTab token={token} />}
      </Tab.Screen>
      <Tab.Screen name="Employees" options={{ title: 'My Staff' }}>
        {() => <EmployeesTab token={token} />}
      </Tab.Screen>
      <Tab.Screen name="Assignments" options={{ title: 'Assignments' }}>
        {() => <AssignmentsTab token={token} />}
      </Tab.Screen>
      <Tab.Screen name="Payments" options={{ title: 'Payments' }}>
        {() => <PaymentsTab token={token} />}
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
  badgeGreen: { backgroundColor: '#c6f6d5' },
  badgeRed: { backgroundColor: '#fed7d7' },
  badgeGrey: { backgroundColor: '#e2e8f0' },
  badgeBlue: { backgroundColor: '#bee3f8' },
  badgeText: { fontSize: 11, fontWeight: 'bold' },
});
