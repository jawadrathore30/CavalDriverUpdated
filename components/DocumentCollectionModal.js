import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext';
import { storage } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getAuth } from 'firebase/auth';

const DocumentCollectionModal = ({ visible, onComplete }) => {
  const { colors } = useTheme();
  const [licenseImage, setLicenseImage] = useState(null);
  const [carteGriseImage, setCarteGriseImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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
          setLicenseImage(result.assets[0].uri);
        } else {
          setCarteGriseImage(result.assets[0].uri);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const handleSubmit = async () => {
    if (!licenseImage || !carteGriseImage) {
      return;
    }

    setUploading(true);
    const auth = getAuth();
    const userId = auth.currentUser.uid;

    try {
      // Upload license image
      const licenseResponse = await fetch(licenseImage);
      const licenseBlob = await licenseResponse.blob();
      const licenseRef = ref(storage, `documents/${userId}/license.jpg`);
      await uploadBytes(licenseRef, licenseBlob);
      const licenseUrl = await getDownloadURL(licenseRef);

      // Upload carte grise image
      const carteGriseResponse = await fetch(carteGriseImage);
      const carteGriseBlob = await carteGriseResponse.blob();
      const carteGriseRef = ref(storage, `documents/${userId}/carte_grise.jpg`);
      await uploadBytes(carteGriseRef, carteGriseBlob);
      const carteGriseUrl = await getDownloadURL(carteGriseRef);

      // Update user document in Firestore
      const userRef = doc(db, 'Drivers', userId);
      await updateDoc(userRef, {
        documentsSubmitted: true,
        licenseImageUrl: licenseUrl,
        carteGriseImageUrl: carteGriseUrl,
        documentsSubmittedAt: new Date().toISOString(),
        documentsStatus: 'pending_review'
      });

      onComplete();
    } catch (error) {
      console.error('Error uploading documents:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
    >
      <View style={[styles.modalContainer, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.text }]}>
            Documents Requis
          </Text>
          
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            Pour finaliser votre inscription, veuillez fournir les documents suivants :
          </Text>

          <View style={styles.documentSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Permis de Conduire
            </Text>
            <TouchableOpacity
              style={[styles.uploadButton, { backgroundColor: colors.input }]}
              onPress={() => pickImage('license')}
            >
              {licenseImage ? (
                <Image source={{ uri: licenseImage }} style={styles.previewImage} />
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <Ionicons name="camera" size={24} color={colors.primary} />
                  <Text style={[styles.uploadText, { color: colors.text }]}>
                    Ajouter une photo
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.documentSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Carte Grise
            </Text>
            <TouchableOpacity
              style={[styles.uploadButton, { backgroundColor: colors.input }]}
              onPress={() => pickImage('carteGrise')}
            >
              {carteGriseImage ? (
                <Image source={{ uri: carteGriseImage }} style={styles.previewImage} />
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <Ionicons name="camera" size={24} color={colors.primary} />
                  <Text style={[styles.uploadText, { color: colors.text }]}>
                    Ajouter une photo
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <Text style={[styles.note, { color: colors.textSecondary }]}>
            Note: Vous pouvez continuer à utiliser l'application pendant que nous vérifions vos documents.
          </Text>

          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: colors.primary },
              (!licenseImage || !carteGriseImage) && styles.disabledButton
            ]}
            onPress={handleSubmit}
            disabled={!licenseImage || !carteGriseImage || uploading}
          >
            {uploading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>
                Soumettre les Documents
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    borderRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  documentSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  uploadButton: {
    height: 150,
    borderRadius: 10,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadPlaceholder: {
    alignItems: 'center',
  },
  uploadText: {
    marginTop: 8,
    fontSize: 16,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  note: {
    fontSize: 14,
    marginTop: 10,
    marginBottom: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  submitButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DocumentCollectionModal; 