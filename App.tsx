import React, { useEffect, useState } from 'react';
import {
  NavigationContainer,
  NavigationContainerRef,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RegisterScreen from './screens/RegisterScreen';
import ChatScreen from './screens/ChatScreen';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native';

export type RootStackParamList = {
  Register: undefined;
  Chat: { name: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [initialRoute, setInitialRoute] = useState<'Register' | 'Chat' | null>(
    null,
  );
  const [username, setUsername] = useState<string>('');

  useEffect(() => {
    const checkAutoLogin = async () => {
      try {
        // Check if user was logged in before
        const savedEmail = await AsyncStorage.getItem('userEmail');
        const savedUserId = await AsyncStorage.getItem('userId');

        if (savedEmail && savedUserId) {
          // Wait for auth state
          const unsubscribe = onAuthStateChanged(auth, async user => {
            if (user && user.uid === savedUserId) {
              // User is still authenticated
              const savedUsername = await AsyncStorage.getItem(
                `username_${user.uid}`,
              );
              const displayName = savedUsername || savedEmail.split('@')[0];
              setUsername(displayName);
              setInitialRoute('Chat');
            } else {
              setInitialRoute('Register');
            }
            setInitializing(false);
            unsubscribe();
          });
        } else {
          setInitialRoute('Register');
          setInitializing(false);
        }
      } catch (error) {
        console.error('Auto-login error:', error);
        setInitialRoute('Register');
        setInitializing(false);
      }
    };

    checkAutoLogin();
  }, []);

  if (initializing || !initialRoute) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: true }}
      >
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Chat"
          component={ChatScreen}
          initialParams={{ name: username }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
