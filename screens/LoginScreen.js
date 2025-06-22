import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithCredential, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth, db } from "../config/firebase";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import PrivacyPolicyModal from "../components/PrivacyPolicyModal";
import CavalLogo from "../assets/Caval_courrier_logo-removebg-preview.png";
import { LinearGradient } from "expo-linear-gradient";

function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [authStateReady, setAuthStateReady] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);
  const navigation = useNavigation();
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Clear auth state when the login screen is focused
  useFocusEffect(
    React.useCallback(() => {
      const checkAndClearAuth = async () => {
        setAuthStateReady(false);
        // Clear stored user data
        await AsyncStorage.removeItem('driverInfo');
        await AsyncStorage.removeItem('driverUID');
        
        // Ensure user is signed out when coming to login screen
        if (auth.currentUser) {
          await signOut(auth);
        }
        
        // Short delay to ensure auth state is cleared before re-enabling auth state monitoring
        setTimeout(() => {
          setAuthStateReady(true);
        }, 300);
      };
      
      checkAndClearAuth();
      
      return () => {
        // Cleanup if needed
      };
    }, [])
  );

  const handlePrivacyPolicyAccept = async () => {
    try {
      await AsyncStorage.setItem('privacyPolicyAccepted', 'true');
      setShowPrivacyPolicy(false);
      navigation.navigate("HomeScreenWithMap");
    } catch (error) {
      console.error("Error saving privacy policy acceptance:", error);
      Alert.alert("Error", "Failed to save privacy policy acceptance. Please try again.");
    }
  };

  const checkPrivacyPolicyAndProceed = async (user) => {
    try {
      const hasAccepted = await AsyncStorage.getItem('privacyPolicyAccepted');
      
      if (hasAccepted === 'true') {
        // User has already accepted, proceed with navigation
        navigation.navigate("HomeScreenWithMap");
      } else {
        // Show privacy policy modal and store pending user
        setPendingUser(user);
        setShowPrivacyPolicy(true);
      }
    } catch (error) {
      console.error("Error checking privacy policy acceptance:", error);
      Alert.alert("Error", "Failed to check privacy policy acceptance. Please try again.");
    }
  };

  useEffect(() => {
    let unsubscribe = () => {};
    
    if (authStateReady) {
      unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          try {
            console.log("User authenticated:", user.uid);
            setLoading(true);
            
            // Fetch driver information from Firestore
            const driverDoc = await getDoc(doc(db, "Drivers", user.uid));
            console.log("Driver document exists:", driverDoc.exists());
            
            if (!driverDoc.exists()) {
              navigation.navigate("RegisterScreen");
              setLoading(false);
              return;
            }

            // Store driver information in AsyncStorage
            const driverData = driverDoc.data();
            console.log("Driver data to store:", driverData);
            await AsyncStorage.setItem('driverInfo', JSON.stringify(driverData));
            await AsyncStorage.setItem('driverUID', user.uid);
            
            // Verify storage
            const storedData = await AsyncStorage.getItem('driverInfo');
            console.log("Stored driver data:", JSON.parse(storedData));
            
            // Check privacy policy acceptance before proceeding
            await checkPrivacyPolicyAndProceed(user);
          } catch (error) {
            console.error("Error fetching driver information:", error);
            Alert.alert("Error", "Failed to fetch driver information. Please try again.");
            await signOut(auth);
          } finally {
            setLoading(false);
          }
        }
      });
    }
    
    return () => unsubscribe();
  }, [auth, navigation, authStateReady]);

  const handleLogin = async () => {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.log(error.message);
      Alert.alert("Error", error.message);
      setLoading(false);
    }
  };

  const { colors, toggleTheme, isDarkMode } = useTheme();

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  return (
    <KeyboardAvoidingView
      style={[
        styles.container,
        { backgroundColor: colors.background },
        keyboardVisible && Platform.OS === 'android' && styles.containerWithKeyboard
      ]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === 'android' ? 0 : 60}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.innerContainer}>
          <TouchableOpacity
            style={styles.themeToggle}
            onPress={toggleTheme}
          >
            <Ionicons
              name={isDarkMode ? "sunny" : "moon"}
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>

          <Image style={styles.logo} source={CavalLogo} />

          <Text style={[styles.driverOnlyText, { color: colors.text }]}>
            Cette application est réservée uniquement aux chauffeurs Caval Courier
          </Text>

          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.input,
                color: colors.inputText,
                borderColor: colors.border,
              }]}
              placeholder="Email"
              placeholderTextColor={colors.placeholder}
              onChangeText={setEmail}
              value={email}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.input,
                color: colors.inputText,
                borderColor: colors.border,
              }]}
              placeholder="Mot de passe"
              placeholderTextColor={colors.placeholder}
              onChangeText={setPassword}
              value={password}
              secureTextEntry
            />

            <TouchableOpacity 
              style={[styles.button, { backgroundColor: colors.primary }]} 
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Connexion</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Register Button - outlined, secondary style */}
          <TouchableOpacity
            style={[styles.registerButton, { borderColor: colors.primary }]}
            activeOpacity={0.85}
            onPress={() => navigation.navigate("RegisterScreen")}
          >
            <View style={styles.registerButtonContent}>
              <Ionicons name="person-add-outline" size={20} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.registerButtonText, { color: colors.primary }]}>Pas de compte ? Inscrivez-vous ici</Text>
            </View>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>

      <PrivacyPolicyModal
        visible={showPrivacyPolicy}
        onAccept={handlePrivacyPolicyAccept}
      />
    </KeyboardAvoidingView>
  );
}

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 10 : 15,
  },
  containerWithKeyboard: {
    justifyContent: 'flex-start',
  },
  innerContainer: {
    width: '100%',
    alignItems: 'center',
  },
  themeToggle: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 5 : 10,
    right: 20,
    padding: 10,
    borderRadius: 20,
  },
  logo: {
    width: 260,
    height: 260,
    marginBottom: 10,
    resizeMode: "contain",
  },
  card: {
    width: "100%",
    padding: 18,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 12,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  button: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 6,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  linkText: {
    fontSize: 16,
    marginTop: 10,
    textAlign: "center",
  },
  driverOnlyText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 12,
    marginBottom: 10,
  },
  registerButton: {
    width: '100%',
    marginTop: 36, // more space above
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    paddingHorizontal: 10,
    flexDirection: 'row',
    shadowColor: 'transparent', // remove shadow for clean look
    elevation: 0,
  },
  registerButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});