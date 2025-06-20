import React, { useState, useEffect } from "react";
import { Platform, StyleSheet, View, ActivityIndicator, Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Ionicons from "react-native-vector-icons/Ionicons"; // For icons
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { StripeProvider } from '@stripe/stripe-react-native';
import { auth, db } from './config/firebase';

// Import Screens
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import HomeScreenWithMap from "./screens/HomeScreenWithMap";
import RideInProgressScreen from "./screens/RideInProgressScreen";
import ProfileScreen from "./screens/ProfileScreen";
import SettingsScreen from "./screens/SettingsScreen";
import RideOptionsScreen from "./screens/RideOptionsScreen";
import EarningsScreen from "./screens/EarningsScreen";
import ModifyInfo from "./screens/ModifyInfo";
import PaymentScreen from "./screens/PaymentScreen";
import DriverInboxScreen from "./screens/DriverInboxScreen";
import "react-native-get-random-values";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom Tab Navigator (Home and Profile only)
function HomeTabs() {
  const { user } = useAuth();
  
  if (!user) {
    return null;
  }

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
          }
          return <Ionicons name={iconName} size={30} color={color} />;
        },
        tabBarActiveTintColor: "#ff9f43",
        tabBarInactiveTintColor: "gray",
        tabBarStyle: {
          backgroundColor: "#1e1e1e",
          borderTopColor: "transparent",
          position: "absolute",
          bottom: 0,
          height: Platform.OS === 'android' ? 100 : 70,
          paddingBottom: Platform.OS === 'android' ? 60 : 10,
          zIndex: 10,
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
        },
      })}
    >
      <Tab.Screen
        name="Home"
        options={{ headerShown: false }}
      >
        {() => <HomeScreenWithMap />}
      </Tab.Screen>
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
    </Tab.Navigator>
  );
}

// Create a wrapper component to use the auth context
const AppContent = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#ff9f43" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={user ? "HomeScreenWithMap" : "LoginScreen"}
        screenOptions={{
          headerShown: false,
          gestureEnabled: false // Disable swipe back gesture
        }}
      >
        {/* Authentication Screens */}
        <Stack.Screen
          name="LoginScreen"
          component={LoginScreen}
          options={{ 
            headerShown: false,
            gestureEnabled: false
          }}
        />
        <Stack.Screen
          name="RegisterScreen"
          component={RegisterScreen}
          options={{ 
            headerShown: false,
            gestureEnabled: false
          }}
        />

        {/* Bottom Tabs (Home and Profile) */}
        {user && (
          <Stack.Screen
            name="HomeScreenWithMap"
            component={HomeTabs}
            options={{ 
              headerShown: false,
              gestureEnabled: false,
              headerLeft: () => null
            }}
          />
        )}
        
        {/* Rest of the screens */}
        <Stack.Screen
          name="RideInProgressScreen"
          component={RideInProgressScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="DriverInboxScreen"
          component={DriverInboxScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="RideOptionsScreen"
          component={RideOptionsScreen}
          options={{
            headerTitle: "Ride Options",
            headerStyle: { backgroundColor: "#ff9f43" },
            headerTintColor: "#fff",
            headerTitleAlign: "center",
          }}
        />
        <Stack.Screen
          name="EarningsScreen"
          component={EarningsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ModifyInfo"
          component={ModifyInfo}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="PaymentScreen"
          component={PaymentScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SettingsScreen"
          component={SettingsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Profile" 
          component={ProfileScreen} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  const [isFirebaseInitialized, setIsFirebaseInitialized] = useState(false);
  const [initError, setInitError] = useState(null);

  useEffect(() => {
    const checkFirebaseInitialization = () => {
      try {
        // Check if auth is initialized
        if (auth) {
          setIsFirebaseInitialized(true);
        } else {
          setInitError("Firebase Auth not initialized");
        }
      } catch (error) {
        console.error("Firebase initialization check error:", error);
        setInitError(error.message);
      }
    };

    checkFirebaseInitialization();
  }, []);

  if (initError) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error initializing Firebase: {initError}</Text>
      </View>
    );
  }

  if (!isFirebaseInitialized) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#ff9f43" />
        <Text style={styles.loadingText}>Initializing Firebase...</Text>
      </View>
    );
  }

  return (
    <StripeProvider publishableKey="pk_live_51R9ek8CmEzIPQVTO8V3wcapg87N24eNFOCaJ4dz2krvfKSBaNe5g0vYAW4XBHESTYpQBi6fdz7GA4fPGJh4BlGIW00L1KYPz6m">
      <AuthProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </AuthProvider>
    </StripeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1e1e1e",
  },
  loadingText: {
    color: "#ff9f43",
    marginTop: 10,
    fontSize: 16,
  },
  errorText: {
    color: "#ff4444",
    marginTop: 10,
    fontSize: 16,
    textAlign: "center",
    padding: 20,
  },
});
