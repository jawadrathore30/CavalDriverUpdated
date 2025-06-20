import { Platform } from 'react-native';
import { GOOGLE_MAPS_API_KEY } from '@env';

export const MAP_INITIAL_CONFIG = {
  latitude: -18.8792,  // Default to Antananarivo
  longitude: 47.5079,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

export const getMapConfig = () => {
  if (Platform.OS === 'android') {
    return {
      apiKey: GOOGLE_MAPS_API_KEY,
      libraries: ['places'],
    };
  }
  return {};
};

export const handleMapError = (error) => {
  console.error('Map Error:', error);
  // Add any additional error handling logic here
}; 