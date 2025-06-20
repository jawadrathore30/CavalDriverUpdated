import React from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

const PrivacyPolicyModal = ({ visible, onAccept }) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
    >
      <BlurView intensity={20} style={styles.container}>
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['#FF6B00', '#FF8C00']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.header}
          >
            <Text style={styles.title}>Politique de confidentialité</Text>
          </LinearGradient>

          <ScrollView style={styles.scrollView}>
            <View style={styles.contentContainer}>
              <Text style={styles.sectionTitle}>AVIS JURIDIQUE</Text>
              <Text style={styles.text}>
                Les informations contenues dans la présente Politique de Confidentialité sont fournies uniquement à titre informatif général et ne constituent pas un conseil juridique. CAVAL, une application mobile développée et exploitée par CAVAL (« la Société »), est destinée à être utilisée en tant que service de transport à la demande en Djibouti et est fournie « telle quelle », sans aucune garantie, expresse ou implicite. En accédant à ou en utilisant l'Application, vous reconnaissez avoir lu, compris et accepté d'être lié(e) par les termes de la présente Politique de Confidentialité, ainsi que par toute modification future.
              </Text>

              <Text style={styles.sectionTitle}>PRIVACY POLICY - THE BASICS</Text>
              <Text style={styles.text}>
                Chez CAVAL, nous nous engageons à protéger la confidentialité et la sécurité de vos données personnelles. Cette section expose les principes fondamentaux régissant la collecte, l'utilisation et la protection de vos informations lorsque vous utilisez notre application.
              </Text>

              <Text style={styles.subsectionTitle}>Collecte d'informations personnelles</Text>
              <Text style={styles.text}>
                Nous recueillons les données strictement nécessaires à la fourniture de nos services de transport. Cela inclut, par exemple, votre nom, numéro de téléphone, adresse électronique, informations de paiement, ainsi que des données de localisation afin de vous offrir une expérience adaptée et sécurisée.
              </Text>

              <Text style={styles.subsectionTitle}>Utilisation de la caméra</Text>
              <Text style={styles.text}>
                Notre application peut demander l'accès à la caméra de votre appareil. Cet accès est strictement limité aux fonctionnalités nécessitant la prise de photos ou la capture d'images, par exemple pour permettre la vérification d'identité, la prise de photos de documents ou de véhicules, ou toute autre fonctionnalité explicitement proposée dans l'application.
              </Text>

              <Text style={styles.subsectionTitle}>Utilisation des informations</Text>
              <Text style={styles.text}>
                Les données collectées sont utilisées pour :
                {'\n'}- Faciliter et gérer vos réservations et trajets
                {'\n'}- Personnaliser et améliorer votre expérience utilisateur
                {'\n'}- Assurer la sécurité de nos services et prévenir toute utilisation frauduleuse
                {'\n'}- Vous informer, avec votre consentement préalable, des mises à jour, promotions ou informations importantes relatives à l'application
              </Text>

              <Text style={styles.subsectionTitle}>Sécurité des données</Text>
              <Text style={styles.text}>
                CAVAL met en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos informations contre tout accès non autorisé, perte, divulgation ou altération. Nous nous engageons à maintenir des standards de sécurité conformes aux meilleures pratiques et aux exigences légales en vigueur.
              </Text>
            </View>
          </ScrollView>

          <TouchableOpacity
            style={styles.acceptButton}
            onPress={onAccept}
          >
            <LinearGradient
              colors={['#FF6B00', '#FF8C00']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              <Text style={styles.acceptButtonText}>J'accepte la politique de confidentialité</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: Dimensions.get('window').width * 0.9,
    maxHeight: Dimensions.get('window').height * 0.8,
    backgroundColor: 'white',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  scrollView: {
    maxHeight: Dimensions.get('window').height * 0.6,
  },
  contentContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
    color: '#FF6B00',
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
    color: '#FF8C00',
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
    color: '#444',
    marginBottom: 10,
  },
  acceptButton: {
    margin: 20,
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  gradientButton: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default PrivacyPolicyModal; 