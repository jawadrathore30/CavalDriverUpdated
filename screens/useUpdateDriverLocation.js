import { useEffect, useCallback, useRef } from "react";
import * as Location from "expo-location";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "../config/firebase";
import { useNavigation, useRoute } from "@react-navigation/native";

const useUpdateDriverLocation = () => {
  const auth = getAuth();
  const navigation = useNavigation();
  const route = useRoute();
  
  // Use refs to store subscriptions
  const subscriptions = useRef({
    location: null,
    onlineStatus: null,
    auth: null
  });

  const cleanup = useCallback(() => {
    const { location, onlineStatus, auth } = subscriptions.current;
    
    if (location) {
      location.remove();
      subscriptions.current.location = null;
    }
    
    if (onlineStatus) {
      clearInterval(onlineStatus);
      subscriptions.current.onlineStatus = null;
    }
    
    if (auth) {
      auth();
      subscriptions.current.auth = null;
    }
  }, []);

  useEffect(() => {
    const startLocationUpdates = async (user) => {
      if (!user) {
        console.log('No authenticated user, skipping location updates');
        return;
      }

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.error('Location permission not granted');
          return;
        }

        const driverRef = doc(db, "Drivers", user.uid);
        
        // Get current driver status
        const driverDoc = await getDoc(driverRef);
        if (!driverDoc.exists()) {
          console.error('Driver document not found');
          return;
        }

        const driverData = driverDoc.data();
        const isDriverOnline = driverData.isOnline;

        // Initial location update
        const currentLocation = await Location.getCurrentPositionAsync({});
        await updateDoc(driverRef, {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          lastLocationUpdate: new Date().toISOString(),
          isOnline: isDriverOnline
        });

        // Set up location subscription
        const locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000,
            distanceInterval: 10,
          },
          async (location) => {
            try {
              const { latitude, longitude } = location.coords;
              const driverRef = doc(db, "Drivers", user.uid);
              const driverDoc = await getDoc(driverRef);
              
              if (driverDoc.exists()) {
                const driverData = driverDoc.data();
                await updateDoc(driverRef, {
                  latitude,
                  longitude,
                  lastLocationUpdate: new Date().toISOString(),
                  isOnline: driverData.isOnline
                });
              }
            } catch (error) {
              console.error('Error updating location:', error);
            }
          }
        );

        // Store the location subscription
        subscriptions.current.location = locationSubscription;

        // Set up periodic online status check
        const onlineStatusInterval = setInterval(async () => {
          try {
            const driverRef = doc(db, "Drivers", user.uid);
            const driverDoc = await getDoc(driverRef);
            
            if (driverDoc.exists()) {
              const driverData = driverDoc.data();
              const lastUpdate = driverData.lastLocationUpdate;
              const now = new Date();
              const lastUpdateTime = new Date(lastUpdate);
              const timeDiff = (now - lastUpdateTime) / 1000;

              if (timeDiff > 30 && driverData.isOnline) {
                await updateDoc(driverRef, {
                  isOnline: false,
                  lastOnlineUpdate: new Date().toISOString()
                });
              }
            }
          } catch (error) {
            console.error('Error in online status check:', error);
          }
        }, 10000);

        // Store the online status interval
        subscriptions.current.onlineStatus = onlineStatusInterval;

      } catch (error) {
        console.error('Error in location updates:', error);
        cleanup(); // Clean up on error
      }
    };

    // Get current user and start updates if authenticated
    const currentUser = auth.currentUser;
    if (currentUser) {
      startLocationUpdates(currentUser);
    }

    // Subscribe to auth state changes
    const authUnsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        startLocationUpdates(user);
      } else {
        cleanup();
      }
    });

    // Store the auth unsubscribe function
    subscriptions.current.auth = authUnsubscribe;

    // Return cleanup function
    return cleanup;
  }, [auth, cleanup]);

  return { cleanup };
};

export default useUpdateDriverLocation;