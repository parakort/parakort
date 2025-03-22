import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import config from "../app.json";
import Slider from '@react-native-community/slider';
import sportIcons from '../utils/icons';

// When the level changes, we need to call updateFilter function from App.js, which is exposed to Profile.js
const SkillPicker = (props) => {
  let imageSource;
  const [mySkillLevel, setMySkillLevel] = useState(props.sport.my_level); // 0: None, 1: Beginner, 2: Intermediate, 3: Advanced
  const [matchSkillLevels, setMatchSkillLevels] = useState(props.sport.match_level);
  
  const skillLevels = ["None", 'Beginner', 'Average', 'Advanced'];

  // When sport is changed (through slider use) propogate update to database
  // if ignores the first state load (not a user change)
  useEffect(() => {
    if (matchSkillLevels)
      props.updateFilter('sports', { index: props.index, data: { match_level: matchSkillLevels } });
    
  }, [matchSkillLevels])

  // Check if the sport has a corresponding local asset
  if (sportIcons[props.sport.sportId.name.toLowerCase()]) {
    imageSource = sportIcons[props.sport.sportId.name.toLowerCase()]; // Use local asset if it exists
  } else {
    imageSource = { uri: props.sport.sportId.image }; // Fallback to URL image if local asset not found
  }

  // Pressed a button for levels
  function handleLevelPress(level) {
    // toggle this level
    if (matchSkillLevels.includes(level)) setMatchSkillLevels(prevItems => prevItems.filter(item => item !== level));
    else setMatchSkillLevels(prevItems => [...prevItems, level]);
  }

  return (
    <View style={styles.skillContainer}>
      <View style={styles.sportInfoContainer}>
        <View style={styles.sportHeaderContainer}>
          <Image style={styles.image} source={imageSource} />
          <Text style={styles.skillLabel}>{props.sport.sportId.name}</Text>
        </View>

        {(mySkillLevel > 0) && (
          <View style={styles.matchLevelContainer}>
            <Text>Looking for:</Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.levelButton,
                  { backgroundColor: matchSkillLevels.includes(1) ? config.app.theme.blue : config.app.theme.grey }
                ]}
                onPress={() => handleLevelPress(1)}
              >
                <Text style={{ color: config.app.theme.black }}>BEG</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.levelButton,
                  { backgroundColor: matchSkillLevels.includes(2) ? config.app.theme.blue : config.app.theme.grey }
                ]}
                onPress={() => handleLevelPress(2)}
              >
                <Text style={{ color: config.app.theme.black }}>INT</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.levelButton,
                  { backgroundColor: matchSkillLevels.includes(3) ? config.app.theme.blue : config.app.theme.grey }
                ]}
                onPress={() => handleLevelPress(3)}
              >
                <Text style={{ color: config.app.theme.black }}>ADV</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      <View style={styles.sliderContainer}>
        <Text>My level: {skillLevels[mySkillLevel]}</Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={3}
          step={1}
          value={mySkillLevel}
          onValueChange={value => setMySkillLevel(value)} // Update state on slider change
          onSlidingComplete={value => props.updateFilter('sports', { index: props.index, data: { my_level: value } })}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  skillContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: config.app.theme.creme,
    borderRadius: 15,
    borderColor: config.app.theme.black,
    borderWidth: 1,
    minHeight: 100,
    marginVertical: 8,
    paddingHorizontal: "3%",
    paddingVertical: 10,
  },
  sportInfoContainer: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "space-between",
    marginRight: 10,
  },
  sportHeaderContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  matchLevelContainer: {
    flexDirection: "column",
    marginBottom: 5,
  },
  sliderContainer: {
    width: "40%",
    justifyContent: "center",
    alignItems: "center",
  },
  slider: {
    width: "100%",
  },
  buttonContainer: {
    flexDirection: "row",
    marginTop: 5,
    gap: 5,
  },
  levelButton: {
    width: 60,
    padding: 4,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    height: 30,
    width: 30,
    aspectRatio: 1,
    resizeMode: 'contain',
  },
  skillLabel: {
    fontSize: 20,
    marginLeft: 10,
    fontWeight: "100",
  }
});

export default SkillPicker;