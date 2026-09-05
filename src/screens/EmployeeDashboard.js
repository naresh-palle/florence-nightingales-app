import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Tab = createBottomTabNavigator();

const Home = () => <View style={styles.center}><Text>My Upcoming Assignments</Text></View>;
const Tasks = () => <View style={styles.center}><Text>Pending Tasks</Text></View>;
const Profile = () => <View style={styles.center}><Text>My Profile</Text></View>;

export default function EmployeeDashboard() {
  return (
    <Tab.Navigator screenOptions={{ headerTitleAlign: 'center', tabBarActiveTintColor: '#38a169' }}>
      <Tab.Screen name="Home" component={Home} options={{ title: 'Assignments' }} />
      <Tab.Screen name="Tasks" component={Tasks} options={{ title: 'Tasks' }} />
      <Tab.Screen name="Profile" component={Profile} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({ center: { flex: 1, justifyContent: 'center', alignItems: 'center' } });
