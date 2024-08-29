import React, { useState } from 'react';
import { SafeAreaView, View, Text, Button, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
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

  const handleNext = () => setStep((prev) => prev + 1);

  const handleInputChange = (field, value) => {
    setUserDetails({ ...userDetails, [field]: value });
  };

     

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <>
            <Text style={styles.label}>Enter your birthdate:</Text>
            <TouchableOpacity
              onPress={() => setOpen(true)}
              style={styles.input}
            >
              <Text>{userDetails.birthdate.toDateString()}</Text>
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
              }}
              onCancel={() => setOpen(false)}
            />
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
      <View style={styles.contentContainer}>{renderStepContent()}</View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
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
    padding: 20,
    backgroundColor: '#f5f5f5',
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
    marginRight: 10, // Add margin between first and last name fields
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
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  skipButton: {
    backgroundColor: '#aaa',
    padding: 15,
    borderRadius: 5,
    flex: 1,
    marginRight: 10,
  },
  nextButton: {
    backgroundColor: '#007bff',
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
