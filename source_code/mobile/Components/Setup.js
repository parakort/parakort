import React, { useState } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, TextInput, StyleSheet, Image } from 'react-native';
import DatePicker from 'react-native-date-picker';

const Setup = () => {
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 18);

  const [step, setStep] = useState(0);
  const [userDetails, setUserDetails] = useState({
    birthdate: maxDate,
    firstName: '',
    lastName: '',
    gender: '',
    bio: '',
  });
  const [open, setOpen] = useState(false);
  const [birthdateChanged, setBirthdateChanged] = useState(false);

  const handleNext = () => {
    if (
      userDetails.firstName &&
      userDetails.lastName &&
      birthdateChanged &&
      userDetails.gender
    ) {
      setStep((prev) => prev + 1);
    }
  };

  const handleInputChange = (field, value) => {
    setUserDetails({ ...userDetails, [field]: value });
  };

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <>
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

            <Text style={styles.label}>Enter your birthdate:</Text>
            <TouchableOpacity
              onPress={() => setOpen(true)}
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
                setOpen(false);
                handleInputChange('birthdate', date);
                setBirthdateChanged(true);
              }}
              onCancel={() => setOpen(false)}
            />

            <Text style={styles.label}>Select your gender:</Text>
            <View style={styles.genderContainer}>
              <TouchableOpacity
                style={[
                  styles.genderOption,
                  userDetails.gender === 'male' && styles.selectedGender,
                ]}
                onPress={() => handleInputChange('gender', 'male')}
              >
                <Text style={styles.genderText}>Male</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.genderOption,
                  userDetails.gender === 'female' && styles.selectedGender,
                ]}
                onPress={() => handleInputChange('gender', 'female')}
              >
                <Text style={styles.genderText}>Female</Text>
              </TouchableOpacity>
            </View>
          </>
        );
      case 1:
        return (
          <>
            <Text style={styles.label}>Tell us about yourself (300 characters max):</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              placeholder="Your bio"
              value={userDetails.bio}
              onChangeText={(text) => handleInputChange('bio', text)}
              maxLength={300}
              multiline
            />
          </>
        );
      case 2:
        return <Text style={styles.finishedText}>Finished!</Text>;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Image
          source={{ uri: 'https://png.pngtree.com/png-vector/20220712/ourmid/pngtree-playing-tennis-ball-png-image_5906916.png' }} // Replace with your image URL or local path
          style={styles.logo}
        />
        <Text style={styles.title}>TheClubhouse</Text>
      </View>
      <View style={styles.contentContainer}>{renderStepContent()}</View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPress={handleNext}
          style={[
            styles.nextButton,
            {
              backgroundColor:
                userDetails.firstName &&
                userDetails.lastName &&
                birthdateChanged &&
                userDetails.gender
                  ? '#007bff'
                  : '#ccc',
            },
          ]}
          disabled={
            !(
              userDetails.firstName &&
              userDetails.lastName &&
              birthdateChanged &&
              userDetails.gender
            )
          }
        >
          <Text style={styles.buttonText}>{step === 1 ? 'Finish' : 'Next'}</Text>
        </TouchableOpacity>
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
    justifyContent: 'center', // Center the header content
    padding: 20,
    backgroundColor: '#ffffff',
  },
  logo: {
    width: 40, // Adjust the size as needed
    height: 40, // Adjust the size as needed
    marginRight: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '100', // Set font weight to 100
  },
  contentContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  label: {
    fontSize: 18,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 20,
    borderRadius: 5,
    fontSize: 16,
  },
  nameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nameInput: {
    flex: 1,
    marginRight: 10,
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
  },
  genderOption: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 15,
    borderRadius: 5,
    width: '40%',
    alignItems: 'center',
  },
  selectedGender: {
    backgroundColor: '#d3d3d3',
  },
  genderText: {
    fontSize: 16,
  },
  buttonContainer: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nextButton: {
    padding: 15,
    borderRadius: 5,
    flex: 1,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
  },
  finishedText: {
    fontSize: 24,
    textAlign: 'center',
  },
});

export default Setup;
