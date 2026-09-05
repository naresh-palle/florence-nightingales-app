import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Tab = createBottomTabNavigator();

// Mock Screens for Dashboard
const Overview = () => <View style={styles.center}><Text>Operations & Financial KPIs</Text></View>;
const Teams = () => <View style={styles.center}><Text>Manage 4 Active Team Leads</Text></View>;
const Finance = () => <View style={styles.center}><Text>Organization Payments & Invoices</Text></View>;
const Audit = () => <View style={styles.center}><Text>Append-Only Audit Logs</Text></View>;

export default function AdminDashboard() {
  return (
    <Tab.Navigator screenOptions={{ headerTitleAlign: 'center', tabBarActiveTintColor: '#e53e3e' }}>
      <Tab.Screen name="Overview" component={Overview} options={{ title: 'Admin Dashboard' }} />
      <Tab.Screen name="Teams" component={Teams} options={{ title: 'Teams & Leads' }} />
      <Tab.Screen name="Finance" component={Finance} options={{ title: 'Financials' }} />
      <Tab.Screen name="Audit" component={Audit} options={{ title: 'Security Logs' }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({ center: { flex: 1, justifyContent: 'center', alignItems: 'center' } });
