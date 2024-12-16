import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from "../app.json";
import RetryableImage from './RetryableImage';

const Media = (props) => {
  const requestPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permission Denied", "You need to grant media access permission.");
      return false;
    }
    await AsyncStorage.setItem('mediaPermission', status);
    return true;
  };

  const pickMedia = async (index) => {
    const permission = await AsyncStorage.getItem('mediaPermission') || await requestPermission();
    if (permission) {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
        videoMaxDuration: 5,
      });

      result.assets[0].fileName = String(index) + result.assets[0].fileName;

      if (!result.canceled) {
        props.onSubmitMedia(index, result.assets[0]);
      }
    }
  };

  const handleRemoveMedia = (index) => {
    props.onRemoveMedia(index);
  };

  return (
    <View style={styles.mediaContainer}>
      <View style={styles.mediaGrid}>
        {Array.from({ length: 3 }).map((_, index) => (
          <View key={index} style={styles.mediaBoxContainer}>
            <TouchableOpacity
              style={[
                styles.mediaBox,
                props.media[index] && styles.mediaFilled,
                // Below line can make a new style for inaccessible media buttons
                // index > (props.media ? props.media.length : 0) && styles.mediaDisabled
              ]}
              onPress={() => { pickMedia(index); }}
              disabled={index > (props.media ? props.media.length : 0)}
            >
                {/* Show the image for all images */}
              {props.media[index] ? (
                <Image
                  source={{ uri: props.media[index].uri }}
                  style={styles.mediaPreview}
                />
                // <RetryableImage
                //   uri={ props.media[index].uri }
                //   style={styles.mediaPreview}
                //   bro={true}
                // />
                // Show a plus sign for the box which is for adding the next media item
              ) : (
                !(index > (props.media ? props.media.length : 0)) && <Text style={styles.plusSign}>+</Text>
              )}
              {(index > 0 && props.media[index]) && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveMedia(index)}
                >
                  <Text style={styles.removeText}>−</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mediaContainer: {
    marginTop: 20,
  },
  mediaGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mediaBoxContainer: {
    position: 'relative',
    width: '30%',
  },
  mediaBox: {
    height: 100,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaDisabled: {
    backgroundColor: '#d1d1d1',
  },
  mediaFilled: {
    borderWidth: 2,
    borderColor: config.app.theme.creme,
  },
  plusSign: {
    fontSize: 24,
    color: '#808080',
  },
  mediaPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    top: 0,
    left: 0,
  },
  removeButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: config.app.theme.red,
    borderRadius: 50,
    width: 25,
    height: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: {
    color: 'white',
    fontSize: 20,
  },
});

export default Media;
