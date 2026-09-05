import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
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
    // In a real app, we would load the token from SecureStore here
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

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
            {(props) => <LoginScreen {...props} setAuth={(token, role) => {
              setUserToken(token);
              setUserRole(role);
            }} />}
          </Stack.Screen>
        ) : (
          // User is signed in, route based on role
          <>
            {userRole === 'ADMIN' && <Stack.Screen name="AdminDashboard">{(props) => <AdminDashboard {...props} token={userToken} />}</Stack.Screen>}
            {userRole === 'TEAM_LEAD' && <Stack.Screen name="TeamLeadDashboard">{(props) => <TeamLeadDashboard {...props} token={userToken} />}</Stack.Screen>}
            {userRole === 'EMPLOYEE' && <Stack.Screen name="EmployeeDashboard">{(props) => <EmployeeDashboard {...props} token={userToken} />}</Stack.Screen>}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
