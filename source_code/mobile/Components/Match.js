import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import config from "../app.json";
import SocialButtons from './SocialButtons';
import SkillLevels from './SkillLevels';

const Match = (props) => {

  return (
    <View style = {styles.container}>
            <Image style = {styles.imageStyle} source={{uri : props.media.media[0].uri}}></Image>

        <View style = {{display: "flex", flexDirection: "column", width: "50%", height: "100%", justifyContent: "space-evenly", alignItems: "center"}}>
            <Text>{props.media.profile.firstName} {props.media.profile.lastName}</Text>
            
            <View style = {styles.skillContainer}>
                <SkillLevels sports = {props.media.sports}></SkillLevels>
            </View>


        </View>

        <SocialButtons socials = {props.media.profile.socials} ></SocialButtons>
    </View>
      
  );
};

const styles = StyleSheet.create({
  
  container: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: config.app.theme.creme,
    borderRadius: 15,
    borderColor: config.app.theme.black,
    borderWidth: 1,
    height: 125,
    marginVertical: 5,
    padding: "3%",
    alignItems: "center"
  },
  imageStyle: {
    height: "90%",
    aspectRatio: 1,
    borderColor: config.app.theme.black,
    borderWidth: 1,
    borderRadius: 10

  },
  skillContainer: {

    width: "100%",
    height: "30%",

  },
});

export default Match;
