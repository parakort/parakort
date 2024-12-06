import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import config from "../app.json";
import Slider from '@react-native-community/slider';

// When the level changes, we need to call updateFilter function from App.js, which is exposed to Profile.js
const DemographicPicker = (props) => {


  const [minAge, setMinAge] = useState(props.age.min)
  const [maxAge, setMaxAge] = useState(props.age.max)
  const [male, setMale] = useState(props.male)
  const [female, setFemale] = useState(props.female)
  const [radius, setRadius] = useState(props.radius)


  
  // // Pressed a button for levels
  // function handleLevelPress(level)
  // {
  //   // toggle this level
  //   if (matchSkillLevels.includes(level)) setMatchSkillLevels(prevItems => prevItems.filter(item => item !== level));
  //   else setMatchSkillLevels(prevItems => [...prevItems, level]);

  // }

  return (
    <View style = {styles.skillContainer}>
      

      <View style = {{display: "flex", flexDirection: "row", justifyContent: "space-between"}}>
          <View style = {styles.ageContainer}>
            <Text >Min Age: {minAge}</Text>

            <Slider
              minimumValue={18}
              maximumValue={99}
              step={1}
              value={minAge}
              onValueChange={value => {
                setMinAge(value); 
                
              
              }} // Update state on slider change
              onSlidingComplete={value => {
                props.updateFilter('age.min', value);
                if (value > maxAge) setMaxAge(minAge)
              }}
            />

            <Text >Max Age: {maxAge}</Text>

            <Slider
              minimumValue={minAge}
              maximumValue={99}
              step={1}
              value={maxAge}
              onValueChange={value => setMaxAge(value)} // Update state on slider change
              onSlidingComplete={value => props.updateFilter('age.max', value)}
            />
          </View>

          {/* Male / female */}
          <View style = {styles.genderContainer}>

            <TouchableOpacity
                style={[
                  styles.levelButton,
                  { backgroundColor: male ? config.app.theme.blue : config.app.theme.grey }
                ]}
                onPress={() => {
                  props.updateFilter('male', !male)
                  setMale(!male);
                }}
              >
                <Text style={{ color: config.app.theme.black }}> Male </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.levelButton,
                  { backgroundColor: female ? config.app.theme.blue : config.app.theme.grey }
                ]}
                onPress={() => {
                  props.updateFilter('female', !female)
                  setFemale(!female);
                }}
              >
                <Text style={{ color: config.app.theme.black }}>Female</Text>
              </TouchableOpacity>

            </View>

            </View>

            <Text>Search Radius: {radius} miles</Text>

            <Slider
              minimumValue={1}
              maximumValue={99}
              step={1}
              value={radius}
              onValueChange={value => {
                setRadius(value); 
                
              
              }} // Update state on slider change
              onSlidingComplete={value => {
                props.updateFilter('radius', value);
              }}
            />
        </View>
      
  );
};

const styles = StyleSheet.create({
  genderContainer: {
    justifyContent: "space-around",
    alignContent: "center",
    borderWidth: "2px",
    borderColor: "red"
  },
  levelButton: {
    width: 60, // Adjust width as needed
    padding: 2,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  skillContainer: {
    display: "flex",
    flexDirection: "column",
    backgroundColor: config.app.theme.creme,
    borderRadius: 15,
    borderColor: config.app.theme.black,
    borderWidth: 1,
    height: "60%",
    marginVertical: 5,
    padding: "3%",
  },

  ageContainer: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-evely",
    width: "75%"
  },

  skillLabel: {
    fontSize: 20,
    marginLeft: 10,
    fontWeight: "100",
  }
});

export default DemographicPicker;
