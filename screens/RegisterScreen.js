import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
  Image,
  Modal,
} from "react-native";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import { useNavigation } from "@react-navigation/native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CavalLogo from "../assets/Caval_courrier_logo-removebg-preview.png";
import { useTheme } from "../context/ThemeContext";
import { APP_CONFIG } from "../constants/appConfig";
import PrivacyPolicyModal from "../components/PrivacyPolicyModal";
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../config/firebase";

function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [typeDeVehicule, setTypeDeVehicule] = useState("Caval Privé");
  const [isLoading, setIsLoading] = useState(false);
  const [ville, setVille] = useState("");
  const [pays, setPays] = useState("");
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);
  
  // New state variables for documents and payment methods
  const [driverLicense, setDriverLicense] = useState(null);
  const [carteGrise, setCarteGrise] = useState(null);
  const [facePhoto, setFacePhoto] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState({
    dmoney: false,
    cacpay: false,
    waafi: false
  });

  const navigation = useNavigation();

  const formatPhoneNumber = (text) => {
    // Remove any non-digit characters
    const cleaned = text.replace(/\D/g, '');
    
    // If the number starts with 253, remove it as we'll add it back
    let number = cleaned;
    if (number.startsWith('253')) {
      number = number.substring(3);
    }
    
    // Limit to 8 digits (Djibouti numbers are typically 8 digits after country code)
    number = number.substring(0, 8);
    
    // Format the number with spaces
    let formatted = '';
    for (let i = 0; i < number.length; i++) {
      if (i === 2 || i === 4) {
        formatted += ' ';
      }
      formatted += number[i];
    }
    
    return formatted;
  };

  const handlePhoneChange = (text) => {
    const formatted = formatPhoneNumber(text);
    setTelephone(formatted);
  };

  const handlePrivacyPolicyAccept = async () => {
    try {
      await AsyncStorage.setItem('privacyPolicyAccepted', 'true');
      setShowPrivacyPolicy(false);
      
      // Add a small delay to ensure all data is properly saved
      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'HomeScreenWithMap' }],
        });
      }, 500);
    } catch (error) {
      console.error("Error saving privacy policy acceptance:", error);
      Alert.alert("Error", "Failed to save privacy policy acceptance. Please try again.");
    }
  };

  const takeFacePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is required to take your photo.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled) {
        setFacePhoto(result.assets[0]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const pickImage = async (type) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        if (type === 'license') {
          setDriverLicense(result.assets[0]);
        } else if (type === 'carteGrise') {
          setCarteGrise(result.assets[0]);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const togglePaymentMethod = (method) => {
    setPaymentMethods(prev => ({
      ...prev,
      [method]: !prev[method]
    }));
  };

  const uploadImageToStorage = async (uri, path) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, blob);
      
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw new Error("Failed to upload image");
    }
  };

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword || !prenom || !nom || !telephone || !driverLicense || !carteGrise || !facePhoto) {
      Alert.alert(
        "Informations manquantes",
        "Veuillez remplir tous les champs obligatoires et télécharger tous les documents requis",
        [{ text: "OK" }]
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(
        "Erreur de mot de passe",
        "Les mots de passe ne correspondent pas. Veuillez vérifier et réessayer.",
        [{ text: "OK" }]
      );
      return;
    }

    if (!paymentMethods.dmoney && !paymentMethods.cacpay && !paymentMethods.waafi) {
      Alert.alert(
        "Méthodes de paiement requises",
        "Veuillez sélectionner au moins une méthode de paiement",
        [{ text: "OK" }]
      );
      return;
    }

    setIsLoading(true);

    try {
      // First create the user account
      const userCredential = await createUserWithEmailAndPassword(
        getAuth(),
        email,
        password
      );
      const user = userCredential.user;
      console.log("User created with UID:", user.uid);

      // Upload images to Firebase Storage
      console.log("Starting image uploads...");
      const [driverLicenseURL, carteGriseURL, facePhotoURL] = await Promise.all([
        uploadImageToStorage(driverLicense.uri, `drivers/${user.uid}/license`),
        uploadImageToStorage(carteGrise.uri, `drivers/${user.uid}/carteGrise`),
        uploadImageToStorage(facePhoto.uri, `drivers/${user.uid}/profile_photo`)
      ]);
      console.log("All images uploaded successfully");
      console.log("Face photo URL:", facePhotoURL);

      // Enregistrer l'UID du chauffeur dans AsyncStorage
      try {
        await AsyncStorage.setItem('driverUID', user.uid);
        console.log("Driver UID saved to AsyncStorage");
      } catch (e) {
        console.log("Erreur lors de l'enregistrement de l'UID dans AsyncStorage:", e);
      }

      // Enregistrer les informations utilisateur dans Firestore
      const driverData = {
        email: user.email,
        firstName: prenom,
        lastName: nom,
        phoneNumber: telephone,
        vehicleType: typeDeVehicule,
        city: ville,
        country: pays,
        rating: 0,
        rideCount: 0,
        onlineTime: 0,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
        earnings: 0,
        totalEarnings: 0,
        weeklyEarnings: 0,
        dailyEarnings: 0,
        lastOnline: new Date(),
        isOnline: false,
        driverType: typeDeVehicule,
        driverLicense: driverLicenseURL,
        carteGrise: carteGriseURL,
        photo: facePhotoURL, // Save face photo as profile photo
        paymentMethods: paymentMethods,
        documentsVerified: false,
      };

      console.log("Driver data prepared for Firestore:", driverData);

      try {
        // Save to Firestore first
        await setDoc(doc(db, "Drivers", user.uid), driverData);
        console.log("Data saved to Firestore successfully");
        
        // Then save to AsyncStorage
        await AsyncStorage.setItem('driverInfo', JSON.stringify(driverData));
        console.log("Data saved to AsyncStorage successfully");
        
        // Show privacy policy modal after successful registration
        setPendingUser(user);
        setShowPrivacyPolicy(true);
        setIsLoading(false);
      } catch (firestoreError) {
        console.error("Error saving to Firestore:", firestoreError);
        // If Firestore update fails, delete the user account
        await user.delete();
        throw firestoreError;
      }
    } catch (error) {
      setIsLoading(false);
      console.error("Registration error:", error);
      Alert.alert(
        "Échec de l'inscription", 
        error.message || "Une erreur est survenue lors de l'inscription. Veuillez réessayer.",
        [{ text: "OK" }]
      );
    }
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <LinearGradient
        colors={["#121212", "#1F1F1F"]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.logoContainer}>
          <Image 
            source={CavalLogo} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidingView}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <ScrollView
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.header}>
              <Text style={styles.title}>Créer un compte chauffeur</Text>
              <Text style={styles.subtitle}>
                Rejoignez l'équipe Caval et commencez à gagner dès aujourd'hui
              </Text>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Type de véhicule</Text>
                <View style={styles.buttonGroup}>
                  {[
                    "Caval Privé",
                    `${APP_CONFIG.displayName} moto`
                  ].map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeButton,
                        typeDeVehicule === type && styles.selectedButton,
                      ]}
                      onPress={() => setTypeDeVehicule(type)}
                    >
                      <MaterialIcons
                        name={type.includes("moto") ? "two-wheeler" : "directions-car"}
                        size={24}
                        color={typeDeVehicule === type ? "#FFFFFF" : "#FF8C00"}
                        style={styles.typeIcon}
                      />
                      <Text
                        style={[
                          styles.typeButtonText,
                          typeDeVehicule === type && styles.selectedButtonText,
                        ]}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Documents Section */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Documents requis</Text>
                
                {/* Driver's License */}
                <View style={styles.documentSection}>
                  <Text style={styles.documentLabel}>Permis de conduire</Text>
                  <TouchableOpacity
                    style={styles.documentUploadButton}
                    onPress={() => pickImage('license')}
                  >
                    {driverLicense ? (
                      <Image source={{ uri: driverLicense.uri }} style={styles.documentPreview} />
                    ) : (
                      <View style={styles.uploadPlaceholder}>
                        <MaterialIcons name="add-photo-alternate" size={24} color="#FF8C00" />
                        <Text style={styles.uploadText}>Télécharger le permis</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Carte Grise */}
                <View style={styles.documentSection}>
                  <Text style={styles.documentLabel}>Carte grise</Text>
                  <TouchableOpacity
                    style={styles.documentUploadButton}
                    onPress={() => pickImage('carteGrise')}
                  >
                    {carteGrise ? (
                      <Image source={{ uri: carteGrise.uri }} style={styles.documentPreview} />
                    ) : (
                      <View style={styles.uploadPlaceholder}>
                        <MaterialIcons name="add-photo-alternate" size={24} color="#FF8C00" />
                        <Text style={styles.uploadText}>Télécharger la carte grise</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Face Photo */}
                <View style={styles.documentSection}>
                  <Text style={styles.documentLabel}>Photo de votre visage</Text>
                  <TouchableOpacity
                    style={styles.documentUploadButton}
                    onPress={takeFacePhoto}
                  >
                    {facePhoto ? (
                      <View style={styles.photoPreviewContainer}>
                        <Image source={{ uri: facePhoto.uri }} style={styles.facePhotoPreview} />
                        <TouchableOpacity
                          style={styles.retakeButton}
                          onPress={takeFacePhoto}
                        >
                          <MaterialIcons name="camera-alt" size={20} color="#FFFFFF" />
                          <Text style={styles.retakeText}>Reprendre</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.uploadPlaceholder}>
                        <MaterialIcons name="face" size={24} color="#FF8C00" />
                        <Text style={styles.uploadText}>Prendre une photo</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Payment Methods Section */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Méthodes de paiement acceptées</Text>
                <View style={styles.paymentMethodsContainer}>
                  {[
                    { id: 'dmoney', label: 'D-money', icon: 'phone-android' },
                    { id: 'cacpay', label: 'Cac pay', icon: 'payment' },
                    { id: 'waafi', label: 'Waafi', icon: 'smartphone' }
                  ].map((method) => (
                    <TouchableOpacity
                      key={method.id}
                      style={[
                        styles.paymentMethodButton,
                        paymentMethods[method.id] && styles.selectedPaymentMethod
                      ]}
                      onPress={() => togglePaymentMethod(method.id)}
                    >
                      <MaterialIcons
                        name={method.icon}
                        size={24}
                        color={paymentMethods[method.id] ? '#FFFFFF' : '#FF8C00'}
                      />
                      <Text
                        style={[
                          styles.paymentMethodText,
                          paymentMethods[method.id] && styles.selectedPaymentMethodText
                        ]}
                      >
                        {method.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Informations personnelles</Text>
                <View style={styles.inputRow}>
                  <View style={[styles.inputContainer, styles.halfWidth]}>
                    <Text style={styles.inputLabel}>Prénom</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons
                        name="person-outline"
                        size={20}
                        color="#a0a0a0"
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Entrez votre prénom"
                        placeholderTextColor="#757575"
                        onChangeText={setPrenom}
                        value={prenom}
                      />
                    </View>
                  </View>

                  <View style={[styles.inputContainer, styles.halfWidth]}>
                    <Text style={styles.inputLabel}>Nom</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons
                        name="person-outline"
                        size={20}
                        color="#a0a0a0"
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Entrez votre nom"
                        placeholderTextColor="#757575"
                        onChangeText={setNom}
                        value={nom}
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="mail-outline"
                      size={20}
                      color="#a0a0a0"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Entrez votre email"
                      placeholderTextColor="#757575"
                      onChangeText={setEmail}
                      value={email}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Téléphone</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="call-outline"
                      size={20}
                      color="#a0a0a0"
                      style={styles.inputIcon}
                    />
                    <Text style={styles.countryCode}>+253</Text>
                    <TextInput
                      style={[styles.input, styles.phoneInput]}
                      placeholder="XX XX XX XX"
                      placeholderTextColor="#757575"
                      onChangeText={handlePhoneChange}
                      value={telephone}
                      keyboardType="phone-pad"
                      maxLength={11} // 8 digits + 2 spaces
                    />
                  </View>
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputContainer, styles.halfWidth]}>
                    <Text style={styles.inputLabel}>Ville</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons
                        name="location-outline"
                        size={20}
                        color="#a0a0a0"
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Votre ville"
                        placeholderTextColor="#757575"
                        onChangeText={setVille}
                        value={ville}
                      />
                    </View>
                  </View>

                  <View style={[styles.inputContainer, styles.halfWidth]}>
                    <Text style={styles.inputLabel}>Pays</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons
                        name="earth-outline"
                        size={20}
                        color="#a0a0a0"
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Votre pays"
                        placeholderTextColor="#757575"
                        onChangeText={setPays}
                        value={pays}
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Mot de passe</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color="#a0a0a0"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Créez un mot de passe"
                      placeholderTextColor="#757575"
                      onChangeText={setPassword}
                      value={password}
                      secureTextEntry
                    />
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Confirmer le mot de passe</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color="#a0a0a0"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Confirmez votre mot de passe"
                      placeholderTextColor="#757575"
                      onChangeText={setConfirmPassword}
                      value={confirmPassword}
                      secureTextEntry
                    />
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.button}
                onPress={handleRegister}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <View style={styles.buttonContent}>
                    <Text style={styles.buttonText}>Créer un compte</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.buttonIcon} />
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.loginLink}
                onPress={() => navigation.navigate("LoginScreen")}
              >
                <Text style={styles.loginText}>
                  Vous avez déjà un compte ?{" "}
                  <Text style={styles.loginLinkText}>Se connecter</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>

      <PrivacyPolicyModal
        visible={showPrivacyPolicy}
        onAccept={handlePrivacyPolicyAccept}
      />
    </View>
  );
}

export default RegisterScreen;

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#121212",
  },
  gradient: {
    flex: 1,
  },
  logoContainer: {
    paddingTop: 40,
    paddingLeft: 20,
    paddingBottom: 10,
  },
  logo: {
    width: 120,
    height: 40,
  },
  container: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    marginBottom: 30,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.7)",
    letterSpacing: 0.3,
  },
  formContainer: {
    flex: 1,
  },
  card: {
    backgroundColor: "#252525",
    borderRadius: 16,
    padding: 22,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 20,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  buttonGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
    gap: 15,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 15,
    borderRadius: 12,
    backgroundColor: "#333333",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedButton: {
    backgroundColor: "#FF6B00",
    borderColor: "#FF6B00",
    transform: [{ scale: 1.02 }],
    shadowColor: "#FF6B00",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  typeButtonText: {
    fontSize: 16,
    color: "#BBBBBB",
    fontWeight: "600",
    marginTop: 8,
    textAlign: 'center',
  },
  selectedButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  typeIcon: {
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfWidth: {
    width: "48%",
  },
  inputContainer: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 14,
    color: "#A0A0A0",
    marginBottom: 8,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#333333",
    borderRadius: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: "#FFFFFF",
  },
  button: {
    backgroundColor: "#FF6B00",
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 25,
    marginBottom: 20,
    shadowColor: "#FF6B00",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  buttonIcon: {
    marginLeft: 8,
  },
  loginLink: {
    alignItems: "center",
    marginBottom: 30,
  },
  loginText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 16,
  },
  loginLinkText: {
    color: "#FF6B00",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  countryCode: {
    color: "#FFFFFF",
    fontSize: 16,
    marginRight: 8,
    fontWeight: "500",
  },
  phoneInput: {
    marginLeft: 0,
  },
  documentSection: {
    marginBottom: 18,
  },
  documentLabel: {
    fontSize: 14,
    color: "#A0A0A0",
    marginBottom: 8,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  documentUploadButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#333333",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  documentPreview: {
    width: 80,
    height: 120,
    borderRadius: 8,
    marginRight: 12,
  },
  uploadPlaceholder: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    backgroundColor: "#333333",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  uploadText: {
    color: "#BBBBBB",
    fontSize: 14,
    fontWeight: "500",
  },
  paymentMethodsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  paymentMethodButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    backgroundColor: "#333333",
    marginHorizontal: 5,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  selectedPaymentMethod: {
    backgroundColor: "#FF6B00",
    borderColor: "#FF6B00",
  },
  paymentMethodText: {
    fontSize: 14,
    color: "#BBBBBB",
    fontWeight: "500",
  },
  selectedPaymentMethodText: {
    color: "#fff",
    fontWeight: "600",
  },
  photoPreviewContainer: {
    width: '100%',
    alignItems: 'center',
  },
  facePhotoPreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10,
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B00',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  retakeText: {
    color: '#FFFFFF',
    marginLeft: 5,
    fontSize: 14,
    fontWeight: '600',
  },
});