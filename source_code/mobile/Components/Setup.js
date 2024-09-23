import React, { useState, useRef } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, TextInput, StyleSheet, Image, Animated, Keyboard, Alert } from 'react-native';
import DatePicker from 'react-native-date-picker';
import Media from './Media';
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

  // We deleted media item from media component
  function onRemoveMedia(index)
  {
    setUserDetails((prevState) => ({
      ...prevState,
      media: [
        ...prevState.media.slice(0, index), 
        ...prevState.media.slice(index + 1)
      ],
    }));
  }

  // We submitted media from the Media component
  // For setup, we just update the media part of our user details (to be profile)
  function onSubmitMedia(index, new_media)
  {
    setUserDetails((prevState) => ({
      ...prevState,
      media: [
        ...prevState.media.slice(0, index), 
        new_media, 
        ...prevState.media.slice(index + 1)
      ],
    }));

  }


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

            <View style={styles.mediaContainer}>
              <Text style={styles.mediaPrompt}>Now let's see that pretty face!</Text>
              <Media media = {userDetails.media} onSubmitMedia = {onSubmitMedia} onRemoveMedia = {onRemoveMedia}></Media>
            </View>
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
