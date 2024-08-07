import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const getLocation = async () => {
  try {
    // Check if permission has already been granted
    const permissionGranted = await AsyncStorage.getItem('locationPermissionGranted');
    if (permissionGranted !== 'true') {
      // Request permission if not granted
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Permission to access location was denied');
      }
      await AsyncStorage.setItem('locationPermissionGranted', 'true');
    }

    // Get the current location
    const location = await Location.getCurrentPositionAsync({});
    return { location, error: null };
  } catch (error) {
    return { location: null, error: error.message };
  }
};
