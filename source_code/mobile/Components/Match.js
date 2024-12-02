import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import config from "../app.json";

const Match = (props) => {
    console.log(props.media.media[0].uri)

  return (
    <View style = {styles.container}>
      <Image source={{uri : props.media.media[0].uri}}></Image>
    </View>
      
  );
};

const styles = StyleSheet.create({
  
  container: {
    display: "flex",
    flexDirection: "row",
    backgroundColor: config.app.theme.creme,
    borderRadius: 15,
    borderColor: config.app.theme.black,
    borderWidth: 1,
    height: 125,
    marginVertical: 5,
    padding: "3%",
  },
});

export default Match;
