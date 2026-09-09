import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginScreen from './src/screens/LoginScreen';
import AdminDashboard from './src/screens/AdminDashboard';
import TeamLeadDashboard from './src/screens/TeamLeadDashboard';
import EmployeeDashboard from './src/screens/EmployeeDashboard';
import { ActivityIndicator, View } from 'react-native';

const Stack = createNativeStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'ADMIN', 'TEAM_LEAD', 'EMPLOYEE'

  useEffect(() => {
    const loadStorage = async () => {
      try {
        const token = await AsyncStorage.getItem('@userToken');
        const role = await AsyncStorage.getItem('@userRole');
        if (token && role) {
          setUserToken(token);
          setUserRole(role);
        }
      } catch (e) {
        console.error("Failed to load session", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadStorage();
  }, []);

  const handleLogout = async () => {
    setIsLoading(true);
    await AsyncStorage.removeItem('@userToken');
    await AsyncStorage.removeItem('@userRole');
    setUserToken(null);
    setUserRole(null);
    setIsLoading(false);
  };

  const handleAuth = async (token, role) => {
    await AsyncStorage.setItem('@userToken', token);
    await AsyncStorage.setItem('@userRole', role);
    setUserToken(token);
    setUserRole(role);
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {userToken == null ? (
          // No token found, user isn't signed in
          <Stack.Screen name="Login">
            {(props) => <LoginScreen {...props} setAuth={handleAuth} />}
          </Stack.Screen>
        ) : (
          // User is signed in, route based on role
          <>
            {userRole === 'ADMIN' && <Stack.Screen name="AdminDashboard">{(props) => <AdminDashboard {...props} token={userToken} onLogout={handleLogout} />}</Stack.Screen>}
            {userRole === 'TEAM_LEAD' && <Stack.Screen name="TeamLeadDashboard">{(props) => <TeamLeadDashboard {...props} token={userToken} onLogout={handleLogout} />}</Stack.Screen>}
            {userRole === 'EMPLOYEE' && <Stack.Screen name="EmployeeDashboard">{(props) => <EmployeeDashboard {...props} token={userToken} onLogout={handleLogout} />}</Stack.Screen>}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
