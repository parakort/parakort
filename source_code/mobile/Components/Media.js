import React, { useState } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, TextInput, StyleSheet, Image, Animated, Keyboard, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from "../app.json";

const Media= (props) => {

    // Array of media to display
    // Defaults to the provided media source, the array which we read / write to
    // This is just a cosmetic copy to display instant feedback


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

        // disabled videos
        mediaTypes: ImagePicker.MediaTypeOptions.Images, //index ? ImagePicker.MediaTypeOptions.All : ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
        videoMaxDuration: 5,

      });

      // Append index to name 
      result.assets[0].fileName = String(index) + result.assets[0].fileName

      if (!result.canceled) {
       
        // Use the prop callback to decide what to do once we choose an image
        props.onSubmitMedia(index, result.assets[0])

      }
    }
  };

    return (
      <View style={styles.mediaContainer}>
        <View style={styles.mediaGrid}>
          {Array.from({ length: 3 }).map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.mediaBox,
                props.media[index] && styles.mediaFilled,
              ]}
              onPress={() => {pickMedia(index)}}
              disabled={index > (props.media? props.media.length : 0)}
            >
              {props.media[index] ? (
                <Image
                  source={{ uri: props.media[index].uri }}
                  style={styles.mediaPreview}
                />
              ) : (
                <Text style={styles.plusSign}>+</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

const styles = StyleSheet.create({
  
  mediaContainer: {
    marginTop: 20,
  },
  mediaGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mediaBox: {
    width: '30%',
    height: 100,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaFilled: {
    borderWidth: 2,
    borderColor: config.app.theme.blue,
  },
  plusSign: {
    fontSize: 24,
    color: '#808080',
  },
  mediaPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  }
});

export default Media;
