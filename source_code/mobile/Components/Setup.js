import React, { useState, useRef } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, TextInput, StyleSheet, Image, Animated, Keyboard, Alert } from 'react-native';
import DatePicker from 'react-native-date-picker';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from "../app.json";

const Setup = (props) => {
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 18);

  const [step, setStep] = useState(0);
  const [userDetails, setUserDetails] = useState({
    birthdate: maxDate,
    firstName: '',
    lastName: '',
    isMale: null,
    bio: '',
    media: [], // To store the selected media
  });
  const [open, setOpen] = useState(false);
  const [birthdateChanged, setBirthdateChanged] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const handleNext = () => {
    
    if (step == 1) // Last step
    {
        
        makeProfile(userDetails)
    }

    // Otherwise go to next step
    fadeOut(() => setStep((prev) => prev + 1));
  };

  // Switches UI to main app content
  const play = () => {
    props.finishedSetup()
  }

  // Saves user info in database and marks as complete
  const makeProfile = () => {
    props.makeProfile(userDetails)

  }

  const handleBack = () => {
    fadeOut(() => {
        if (step < 2)
        {
            setStep((prev) => prev - 1)
        }
        else
        {
            // skip tutorial
            play()
        }
        
    });
  };

  const fadeOut = (callback) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      callback();
      fadeIn();
    });
  };

  const fadeIn = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleInputChange = (field, value) => {
    setUserDetails({ ...userDetails, [field]: value });
  };

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
        mediaTypes: index ? ImagePicker.MediaTypeOptions.All : ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
        videoMaxDuration: 30,
      });

      if (!result.canceled) {
        setUserDetails((prevState) => ({
          ...prevState,
          media: [...prevState.media, result.assets[0]],
        }));
      }
    }
  };

  const renderMediaUpload = () => {
    return (
      <View style={styles.mediaContainer}>
        <Text style={styles.mediaPrompt}>Now let's see that pretty face!</Text>
        <View style={styles.mediaGrid}>
          {Array.from({ length: 3 }).map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.mediaBox,
                userDetails.media[index] && styles.mediaFilled,
              ]}
              onPress={() => {pickMedia(index)}}
              disabled={index > (props.media?.get(props.user._id)?.media ? props.media?.get(props.user._id)?.media.length : 0)}
            >
              {userDetails.media[index] ? (
                <Image
                  source={{ uri: userDetails.media[index].uri }}
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
  };

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <View style={{ display: "flex", flexDirection: "column", height: "70%", justifyContent: "space-between" }}>
            <View>
              <Text style={styles.label}>Enter your name:</Text>
              <View style={styles.nameContainer}>
                <TextInput
                  style={[styles.input, styles.nameInput]}
                  placeholder="First Name"
                  value={userDetails.firstName}
                  onChangeText={(text) => handleInputChange('firstName', text)}
                />
                <TextInput
                  style={[styles.input, styles.nameInput]}
                  placeholder="Last Name"
                  value={userDetails.lastName}
                  onChangeText={(text) => handleInputChange('lastName', text)}
                />
              </View>
            </View>

            <View>
              <Text style={styles.label}>Enter your birthdate:</Text>
              <TouchableOpacity
                onPress={() => {setOpen(true); Keyboard.dismiss()}}
                style={styles.input}
              >
                <Text>
                  {birthdateChanged
                    ? userDetails.birthdate.toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                    : 'Enter Birthday'}
                </Text>
              </TouchableOpacity>
              <DatePicker
                modal
                open={open}
                date={userDetails.birthdate}
                mode="date"
                maximumDate={maxDate}
                onConfirm={(date) => {
                  Keyboard.dismiss();
                  setOpen(false);
                  handleInputChange('birthdate', date);
                  setBirthdateChanged(true);
                }}
                onCancel={() => { Keyboard.dismiss(); setOpen(false) }}
              />
            </View>

            <View>
              <Text style={styles.label}>Select your gender:</Text>
              <View style={styles.genderContainer}>
                <TouchableOpacity
                  style={[
                    styles.genderOption,
                    userDetails.isMale === true && styles.selectedGender,
                  ]}
                  onPress={() => handleInputChange('isMale', true)}
                >
                  <Text style={styles.genderText}>Male</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.genderOption,
                    userDetails.isMale === false && styles.selectedGender,
                  ]}
                  onPress={() => handleInputChange('isMale', false)}
                >
                  <Text style={styles.genderText}>Female</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );
      case 1:
        return (
        <View style={{ display: "flex", flexDirection: "column", height: "95%", justifyContent: "space-between" }}>
            <View>
                <Text style={styles.label}>Tell us about yourself (300 characters max):</Text>
                <TextInput
                style={[styles.input, styles.bioInput]}
                placeholder="Your bio"
                value={userDetails.bio}
                onChangeText={(text) => handleInputChange('bio', text)}
                maxLength={300}
                multiline={false}
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
                />
            </View>

            {renderMediaUpload()}
          </View>
        );
      case 2:
        return (
          <View style={styles.finishedContainer}>
            <Image
              source={require('../assets/wave.gif')}
              style={styles.finishedLogo}
            />
            <Text style={styles.finishedText}>{`Welcome, ${userDetails.firstName}!`}</Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require('../assets/icon.png')}
          style={styles.logo}
        />
        <Text style={styles.title}>{config.expo.name}</Text>
      </View>
      <Animated.View style={[styles.contentContainer, { opacity: fadeAnim }]}>
        {renderStepContent()}
      </Animated.View>
      <View style={styles.buttonContainer}>
        {step > 0 && (
          <TouchableOpacity
            onPress={handleBack}
            style={[styles.backButton, { backgroundColor: config.app.theme.grey }]}
          >
            <Text style={styles.buttonText}>{step < 2 ? 'Back' : 'Skip Tutorial'}</Text>
          </TouchableOpacity>
        )}
        {(
          <TouchableOpacity
            onPress={handleNext}
            style={[
              styles.nextButton,
              {
                backgroundColor:
                  (step === 0 && userDetails.firstName && userDetails.lastName && birthdateChanged && userDetails.isMale !== null) ||
                  (step === 1 && userDetails.bio && userDetails.media.length > 0) ||
                  (step === 2)
                    ? config.app.theme.blue
                    : config.app.theme.grey,
              },
            ]}
            disabled={
              step === 0
                ? !(userDetails.firstName && userDetails.lastName && birthdateChanged && userDetails.isMale !== null)
                : step === 1 && userDetails.media.length === 0
            }
          >
            <Text style={styles.buttonText}>{step === 1 ? "Let's Play!" : (step === 2 ? 'Watch Tutorial' : 'Next')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30
  },
  logo: {
    width: 50,
    height: 50,
    marginRight: 10,
  },
  title: {
    fontSize: 29,
    fontWeight: '100',
    textAlign: 'center',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  label: {
    fontSize: 18,
    fontWeight: '100',
    marginBottom: 10,
  },
  input: {
    borderColor: config.app.theme.grey,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 20,
  },
  nameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nameInput: {
    width: '48%',
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  genderOption: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: config.app.theme.grey,
    marginHorizontal: 10
  },
  selectedGender: {
    backgroundColor: config.app.theme.creme,
  },
  genderText: {
    fontSize: 18,
    fontWeight: '100',
  },
  bioInput: {
    height: 200,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  nextButton: {
    backgroundColor: '#808080',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  backButton: {
    backgroundColor: '#d3d3d3',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    flex: 1,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  mediaContainer: {
    marginTop: 20,
  },
  mediaPrompt: {
    fontSize: 18,
    marginBottom: 10,
    fontWeight: '100',
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
  },
  finishedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishedLogo: {
    width: 150,
    height: 150,
    marginBottom: 10
  },
  finishedText: {
    fontSize: 24,
    color: config.app.theme.blue
  },
});

export default Setup;
