import React, { useState, useRef, useEffect } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, TextInput, StyleSheet, Image, Animated, Keyboard, Alert, ScrollView, StatusBar } from 'react-native';
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
  const [tutorialStep, setTutorialStep] = useState(0);
  const tutorialData = [
    {
      title: "Welcome to the App!",
      content: "Get ready to connect with others who share your interests.",
      image: require('../assets/parakort-trans.png'),


    },
    {
      title: "Create Your Profile",
      content: "Add your socials, or update photos / bio. Remember to set your filters!",
      image: require('../assets/parakort-trans.png'),

    },
    {
      title: "Find Your Match",
      content: "Swipe right on profiles you like, left on those you don't.",
      image: require('../assets/parakort-trans.png'),
    },
    {
      title: "Start Chatting",
      content: "Once you match with someone, you can start a conversation!",
      image: require('../assets/parakort-trans.png'),

    }
  ];

  const handleNext = () => {
    if (step === 1) { // Last step of profile setup
      makeProfile(userDetails);
    } else if (step === 2 && tutorialStep < tutorialData.length - 1) {
      // In tutorial mode, move to next tutorial step
      setTutorialStep(prevStep => prevStep + 1);
      return;
    } else if (step === 2 && tutorialStep === tutorialData.length - 1) {
      // Finished tutorial
      play();
      return;
    }
    
    // Otherwise go to next step
    fadeOut(() => setStep((prev) => prev + 1));
  };

  // Switches UI to main app content
  const play = () => {
    props.finishedSetup();
  };

  // Saves user info in database and marks as complete
  const makeProfile = () => {
    props.makeProfile(userDetails);
  };

  const handleBack = () => {
    fadeOut(() => {
      if (step === 2) {
        // In tutorial mode
        if (tutorialStep > 0) {
          // Go back to previous tutorial step
          setTutorialStep(prevStep => prevStep - 1);
          fadeIn();
          return;
        } else {
          // Skip tutorial completely
          play();
          return;
        }
      }
      
      if (step > 0) {
        setStep((prev) => prev - 1);
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
  function onRemoveMedia(index) {
    setUserDetails((prevState) => ({
      ...prevState,
      media: [
        ...prevState.media.slice(0, index), 
        ...prevState.media.slice(index + 1)
      ],
    }));
  }

  // We submitted media from the Media component
  function onSubmitMedia(index, new_media) {
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
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <View style={styles.stepContainer}>
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Personal Information</Text>
                <Text style={styles.label}>Enter your name:</Text>
                <View style={styles.nameContainer}>
                  <TextInput
                    style={[styles.input, styles.nameInput]}
                    placeholder="First Name"
                    value={userDetails.firstName}
                    onChangeText={(text) => handleInputChange('firstName', text)}
                    placeholderTextColor="#aaa"
                  />
                  <TextInput
                    style={[styles.input, styles.nameInput]}
                    placeholder="Last Name"
                    value={userDetails.lastName}
                    onChangeText={(text) => handleInputChange('lastName', text)}
                    placeholderTextColor="#aaa"
                  />
                </View>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.label}>Enter your birthdate:</Text>
                <TouchableOpacity
                  onPress={() => {setOpen(true); Keyboard.dismiss()}}
                  style={styles.input}
                >
                  <Text style={birthdateChanged ? styles.inputText : styles.placeholderText}>
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

              <View style={styles.formSection}>
                <Text style={styles.label}>Select your gender:</Text>
                <View style={styles.genderContainer}>
                  <TouchableOpacity
                    style={[
                      styles.genderOption,
                      userDetails.isMale === true && styles.selectedGender,
                    ]}
                    onPress={() => handleInputChange('isMale', true)}
                  >
                    <Text style={userDetails.isMale === true ? styles.selectedGenderText : styles.genderText}>Male</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.genderOption,
                      userDetails.isMale === false && styles.selectedGender,
                    ]}
                    onPress={() => handleInputChange('isMale', false)}
                  >
                    <Text style={userDetails.isMale === false ? styles.selectedGenderText : styles.genderText}>Female</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        );
      case 1:
        return (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <View style={styles.stepContainer}>
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>About You</Text>
                <Text style={styles.label}>Tell us about yourself:</Text>
                <TextInput
                  style={[styles.input, styles.bioInput]}
                  placeholder="Your bio (300 characters max)"
                  value={userDetails.bio}
                  onChangeText={(text) => handleInputChange('bio', text)}
                  maxLength={300}
                  multiline={true}
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                  blurOnSubmit={true}
                  placeholderTextColor="#aaa"
                />
                <Text style={styles.characterCount}>{userDetails.bio.length}/300</Text>
              </View>

              <View style={styles.mediaSection}>
                <Text style={styles.mediaPrompt}>Now let's see that pretty face!</Text>
                <Media media={userDetails.media} onSubmitMedia={onSubmitMedia} onRemoveMedia={onRemoveMedia}></Media>
              </View>
            </View>
          </ScrollView>
        );
      case 2:
        return (
          <View style={styles.tutorialContainer}>
            <Image
              source={tutorialData[tutorialStep].image}
              style={styles.tutorialImage}
              resizeMode="contain"
            />
            <View style={styles.tutorialContent}>
              <Text style={styles.tutorialTitle}>{tutorialData[tutorialStep].title}</Text>
              <Text style={styles.tutorialText}>{tutorialData[tutorialStep].content}</Text>
              <View style={styles.tutorialDots}>
                {tutorialData.map((_, index) => (
                  <View 
                    key={index} 
                    style={[
                      styles.tutorialDot, 
                      index === tutorialStep && styles.activeTutorialDot
                    ]} 
                  />
                ))}
              </View>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.header}>
        <Image
          source={require('../assets/parakort-trans.png')}
          style={styles.logo}
        />
        <Text style={styles.title}>{config.expo.name}</Text>
      </View>
      <Animated.View style={[styles.contentContainer, { opacity: fadeAnim }]}>
        {renderStepContent()}
      </Animated.View>
      <View style={styles.buttonContainer}>
        {(step > 0 || (step === 2 && tutorialStep > 0)) && (
          <TouchableOpacity
            onPress={handleBack}
            style={[styles.backButton, { backgroundColor: config.app.theme.grey }]}
          >
            <Text style={styles.buttonText}>
              {step < 2 ? 'Back' : (tutorialStep === 0 ? 'Skip Tutorial' : 'Back')}
            </Text>
          </TouchableOpacity>
        )}
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
              : step === 1 && !(userDetails.bio && userDetails.media.length > 0)
          }
        >
          <Text style={styles.buttonText}>
            {step === 1 
              ? "Let's Play!" 
              : (step === 2 
                ? (tutorialStep === tutorialData.length - 1 ? 'Finish' : 'Next') 
                : 'Next')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: '200',
    textAlign: 'center',
    color: config.app.theme.blue,
  },
  contentContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  formSection: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '300',
    marginBottom: 15,
    color: config.app.theme.blue,
  },
  label: {
    fontSize: 16,
    fontWeight: '300',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderColor: '#e0e0e0',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 15,
    backgroundColor: '#fafafa',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputText: {
    color: '#333',
  },
  placeholderText: {
    color: '#aaa',
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
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginHorizontal: 6,
    backgroundColor: '#fafafa',
  },
  selectedGender: {
    backgroundColor: config.app.theme.blue,
    borderColor: config.app.theme.blue,
  },
  genderText: {
    fontSize: 16,
    fontWeight: '300',
    color: '#333',
  },
  selectedGenderText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  bioInput: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  characterCount: {
    alignSelf: 'flex-end',
    color: '#888',
    marginTop: -10,
    marginBottom: 10,
  },
  mediaSection: {
    marginTop: 10,
  },
  mediaPrompt: {
    fontSize: 18,
    marginBottom: 10,
    fontWeight: '300',
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  nextButton: {
    backgroundColor: config.app.theme.blue,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  backButton: {
    backgroundColor: config.app.theme.grey,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  tutorialContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  tutorialImage: {
    width: 180,
    height: 180,
    marginBottom: 30,
  },
  tutorialContent: {
    alignItems: 'center',
  },
  tutorialTitle: {
    fontSize: 26,
    fontWeight: '300',
    marginBottom: 15,
    color: config.app.theme.blue,
    textAlign: 'center',
  },
  tutorialText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
    color: '#555',
  },
  tutorialDots: {
    flexDirection: 'row',
    marginTop: 20,
  },
  tutorialDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 5,
  },
  activeTutorialDot: {
    backgroundColor: config.app.theme.blue,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});

export default Setup;