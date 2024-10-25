import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import config from "../app.json";
import Slider from '@react-native-community/slider';

// When the level changes, we need to call updateFilter function from App.js, which is exposed to Profile.js
const SkillPicker = (props) => {



  //console.log(props.sport.sportId.name, props.sport)
  let imageSource;
  const [mySkillLevel, setMySkillLevel] = useState(props.sport.my_level); // 0: Beginner, 1: Intermediate, 2: Advanced
  const [matchSkillLevels, setMatchSkillLevels] = useState(props.sport.match_level);
  

  const skillLevels = ['Beginner', 'Intermediate', 'Advanced'];

  // When sport is changed (through slider use) propogate update to database
  // if ignores the first state load (not a user change)

  useEffect(() => {
    if (matchSkillLevels)
      props.updateFilter('sports', { index: props.index, data: { match_level: matchSkillLevels } });
    
  }, [matchSkillLevels])


  // Preload known assets (local sport icons)
  const assetMap = {
    golf: require('../assets/sport-icons/golf.png'),
    tennis: require('../assets/sport-icons/tennis.png'),
    pickleball: require('../assets/sport-icons/pickleball.png'),
  };

  // Check if the sport has a corresponding local asset
  if (assetMap[props.sport.sportId.name.toLowerCase()]) {
    imageSource = assetMap[props.sport.sportId.name.toLowerCase()]; // Use local asset if it exists
  } else {
    imageSource = { uri: props.sport.sportId.image }; // Fallback to URL image if local asset not found
  }

  // Pressed a button for levels
  function handleLevelPress(level)
  {
    // toggle this level
    if (matchSkillLevels.includes(level)) setMatchSkillLevels(prevItems => prevItems.filter(item => item !== level));
    else setMatchSkillLevels(prevItems => [...prevItems, level]);

  }

  return (
    <View style = {styles.skillContainer}>
      <View style = {{display: "flex", flexDirection: "row", height: "100%", alignItems: "center", marginHorizontal: 10, justifyContent: "space-between"}}>
        
        {/* <View style = {{display: "flex", flexDirection: "column", alignItems: "center"}}>
          <Image style={styles.image}  source = { imageSource }></Image>
          <Text style = {styles.skillLabel}>{props.sport.sportId.name}</Text>
          
        </View> */}


        <View style = {{display: "flex", flexDirection: "column"}}>
          <Text style={styles.skillText}>Looking for:</Text>

          <View style = {{display: "flex", flexDirection: "row"}}>
          <TouchableOpacity
                  style={{...styles.levelButton, backgroundColor: matchSkillLevels.includes(0) ? config.app.theme.blue: config.app.theme.grey}}
                  onPress={() => handleLevelPress(0)}
                >
                <Text style={{color: config.app.theme.black}}>BEG</Text>
            </TouchableOpacity>

            <TouchableOpacity
                  style={{...styles.levelButton, backgroundColor: matchSkillLevels.includes(1) ? config.app.theme.blue: config.app.theme.grey}}
                  onPress={() => handleLevelPress(1)}
                >
                <Text style={{color: config.app.theme.black}}>INT</Text>
            </TouchableOpacity>

            <TouchableOpacity
                  style={{...styles.levelButton, backgroundColor: matchSkillLevels.includes(2) ? config.app.theme.blue: config.app.theme.grey}}
                  onPress={() => handleLevelPress(2)}
                >
                <Text>ADV</Text>
            </TouchableOpacity>
          </View>


        </View>



        <View style = {{display: "flex", flexDirection: "column"}}>
          <Text style={styles.skillText}>My level: {skillLevels[mySkillLevel]}</Text>

          <Slider
            minimumValue={0}
            maximumValue={2}
            step={1}
            value={mySkillLevel}
            onValueChange={value => setMySkillLevel(value)} // Update state on slider change
            onSlidingComplete={value => props.updateFilter('sports', { index: props.index, data: { my_level: value } })}
          />
        </View>
      </View>
      
    </View>
  );
};

const styles = StyleSheet.create({
  levelButton: {
    padding: 0,
    margin: 0,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  image: {
    height: '50%',            // Set height to 50% of the parent container
    width: '50%',             // Set width to match height
    aspectRatio: 1,           // Maintain a 1:1 aspect ratio
    resizeMode: 'contain',    // Maintain the image's aspect ratio while fitting within the dimensions
  },
  skillContainer: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    backgroundColor: config.app.theme.creme,
    borderRadius: 15,
    borderColor: config.app.theme.black,
    borderWidth: 1,
    height: 125,
    marginVertical: 5
  },

  skillLabel: {
    fontSize: 20,
    marginTop: 3,
    fontWeight: 100,
  }
});

export default SkillPicker;
