import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import config from "../app.json";

// When the level changes, we need to call updateFilter function from App.js, which is exposed to Profile.js
const SkillPicker = (props) => {

  console.log(props.sport)
  return (
    <View style = {styles.skillContainer}>
      <View style = {{display: "flex", flexDirection: "row", alignItems: "center"}}>
        <Text style = {styles.skillLabel}>{props.sport.sportId.name}</Text>
        <Image style={{ width: 20, height: 20 }}  source = { {uri: props.sport.sportId.image} }></Image>
      </View>
      
    </View>
  );
};

const styles = StyleSheet.create({
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
    margin: 5
  }
});

export default SkillPicker;
