import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TextInput, FlatList, TouchableOpacity, ActivityIndicator, Alert, Keyboard } from 'react-native';
import * as Location from 'expo-location';
import config from '../app.json';

const LocationSettings = ({ updateProfile, currentLocation, setLocation }) => {
  const [useCurrentLocation, setUseCurrentLocation] = useState(
    currentLocation?.useCurrentLocation || false
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [locationResults, setLocationResults] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(
    currentLocation?.name || ''
  );
  const [isLoading, setIsLoading] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Handle keyboard visibility
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
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  // Request location permissions
  const requestLocationPermission = async () => {
    setIsLoading(true);
    
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          "Permission Denied",
          "Please allow location access to use this feature.",
          [{ text: "OK" }]
        );
        setUseCurrentLocation(false);
        setIsLoading(false);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Error requesting location permission:", error);
      setUseCurrentLocation(false);
      setIsLoading(false);
      return false;
    }
  };

  // Get current location using Expo Location
  const getCurrentLocation = async () => {
    const hasPermission = await requestLocationPermission();
    
    if (!hasPermission) {
      return;
    }
    
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });
      
      const { latitude, longitude } = location.coords;
      
      // Get location name from coordinates
      const placemark = await reverseGeocode(latitude, longitude);
      
      // Update profile with location data
      updateProfile("location", {
        useCurrentLocation: true,
        name: placemark,
        coordinates: { latitude, longitude }
      });

      setLocation({lat: latitude, lon: longitude});
      
      setSelectedLocation(placemark);
      setIsLoading(false);
    } catch (error) {
      console.error("Error getting location:", error);
      Alert.alert(
        "Location Error",
        "Unable to get your current location. Please try again later.",
        [{ text: "OK" }]
      );
      setUseCurrentLocation(false);
      setIsLoading(false);
    }
  };

  // Reverse geocode to get location name
  const reverseGeocode = async (latitude, longitude) => {
    try {
      const result = await Location.reverseGeocodeAsync({
        latitude,
        longitude
      });
      
      if (result.length > 0) {
        const { city, region, country } = result[0];
        return [city, region, country].filter(Boolean).join(", ");
      }
      
      return "Unknown Location";
    } catch (error) {
      console.error("Error reverse geocoding:", error);
      return "Unknown Location";
    }
  };

  // Forward geocode to search for locations - using actual geocoding
  const searchLocations = async (query) => {
    setIsLoading(true);
    
    try {
      // Use actual geocoding with Expo's Location API
      const results = await Location.geocodeAsync(query);
      
      if (results.length > 0) {
        const formattedResults = await Promise.all(results.map(async (result, index) => {
          const { latitude, longitude } = result;
          const placemark = await Location.reverseGeocodeAsync({ latitude, longitude });
          const name = placemark.length > 0 
            ? [placemark[0].city, placemark[0].region, placemark[0].country].filter(Boolean).join(", ")
            : "Unknown Location";
          
          return {
            id: index.toString(),
            name,
            coordinates: { latitude, longitude }
          };
        }));
        
        setLocationResults(formattedResults);
      } else {
        setLocationResults([]);
      }
    } catch (error) {
      console.error("Error searching locations:", error);
      setLocationResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle location method
  const toggleCurrentLocation = (value) => {
    setUseCurrentLocation(value);
    
    if (value) {
      getCurrentLocation();
    } else {
      // Keep the selected location when toggling off
      updateProfile("location", {
        useCurrentLocation: false,
        name: selectedLocation,
        coordinates: currentLocation?.coordinates || null
      });

      setLocation({lat: currentLocation?.coordinates.latitude, lon: currentLocation?.coordinates.longitude});

    }
  };

  // Select location from search results
  const selectLocation = (location) => {
    setSelectedLocation(location.name);
    setSearchQuery('');
    setLocationResults([]);
    Keyboard.dismiss();
    
    updateProfile("location", {
      useCurrentLocation: false,
      name: location.name,
      coordinates: location.coordinates
    });

    setLocation({lat: location.coordinates.latitude, lon: location.coordinates.longitude});

  };

  // Search as user types (if more than 2 characters)
  useEffect(() => {
    if (searchQuery.length > 2 && !useCurrentLocation) {
      searchLocations(searchQuery);
    } else {
      setLocationResults([]);
    }
  }, [searchQuery]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Location Settings</Text>
      
      <View style={styles.switchContainer}>
        <Text style={styles.switchLabel}>Use current location</Text>
        <Switch
          value={useCurrentLocation}
          onValueChange={toggleCurrentLocation}
          trackColor={{ false: config.app.theme.grey, true: config.app.theme.red }}
          thumbColor={useCurrentLocation ? config.app.theme.creme : '#f4f3f4'}
        />
      </View>
      
      {isLoading && (
        <ActivityIndicator size="small" color={config.app.theme.red} style={styles.loader} />
      )}
      
      {/* Show selected location only when keyboard is not visible and search results are empty */}
      {selectedLocation && !keyboardVisible && locationResults.length === 0 && (
        <View style={styles.selectedLocation}>
          <Text style={styles.locationLabel}>Selected location:</Text>
          <Text style={styles.locationText}>{selectedLocation}</Text>
        </View>
      )}
      
      {!useCurrentLocation && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for a location..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="words"
            onFocus={() => setKeyboardVisible(true)}
            onBlur={() => setKeyboardVisible(false)}
          />
          
          {locationResults.length > 0 && (
            <FlatList
              data={locationResults}
              keyExtractor={(item) => item.id}
              style={styles.resultsList}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.resultItem}
                  onPress={() => selectLocation(item)}
                >
                  <Text style={styles.resultText}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 15,
    paddingHorizontal: 5,
  },
  label: {
    fontSize: 18,
    fontWeight: '200',
    marginBottom: 15,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 5,
    backgroundColor: 'rgba(200, 200, 200, 0.1)',
    borderRadius: 10,
  },
  switchLabel: {
    fontSize: 16,
  },
  searchContainer: {
    marginTop: 15,
    zIndex: 1, // Ensure search container is above other elements
  },
  searchInput: {
    borderColor: config.app.theme.grey,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    backgroundColor: config.app.theme.creme,
    fontSize: 16,
  },
  resultsList: {
    borderColor: config.app.theme.grey,
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    maxHeight: 200, // Increased height for better visibility
    backgroundColor: config.app.theme.creme,
    position: 'absolute',
    left: 0,
    right: 0,
    top: 45, // Position below search input
    zIndex: 2, // Ensure results are on top
  },
  resultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: config.app.theme.grey,
  },
  resultText: {
    fontSize: 16,
  },
  selectedLocation: {
    marginTop: 15,
    padding: 12,
    backgroundColor: 'rgba(200, 200, 200, 0.2)',
    borderRadius: 10,
  },
  locationLabel: {
    fontSize: 14,
    color: config.app.theme.gray,
    marginBottom: 5,
  },
  locationText: {
    fontSize: 16,
    fontWeight: '500',
  },
  loader: {
    marginVertical: 10,
  },
});

export default LocationSettings;