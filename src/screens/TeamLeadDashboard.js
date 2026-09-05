import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Tab = createBottomTabNavigator();

const Overview = () => <View style={styles.center}><Text>My Team's KPIs</Text></View>;
const Customers = () => <View style={styles.center}><Text>Manage Assigned Customers</Text></View>;
const Employees = () => <View style={styles.center}><Text>Manage Team Employees</Text></View>;
const Finance = () => <View style={styles.center}><Text>Team Payment Collections</Text></View>;

export default function TeamLeadDashboard() {
  return (
    <Tab.Navigator screenOptions={{ headerTitleAlign: 'center', tabBarActiveTintColor: '#3182ce' }}>
      <Tab.Screen name="Overview" component={Overview} options={{ title: 'Team Dashboard' }} />
      <Tab.Screen name="Customers" component={Customers} options={{ title: 'Customers' }} />
      <Tab.Screen name="Employees" component={Employees} options={{ title: 'Employees' }} />
      <Tab.Screen name="Finance" component={Finance} options={{ title: 'Payments' }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({ center: { flex: 1, justifyContent: 'center', alignItems: 'center' } });
