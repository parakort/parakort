import React, { useState, useEffect } from 'react';
import { View, Text, PanResponder, Animated, StyleSheet, Image, TouchableOpacity } from 'react-native';
import config from "../app.json";
import SocialButtons from './SocialButtons';
import SkillLevels from './SkillLevels';

const Liker = (props) => {
  const [pan, setPan] = useState(new Animated.ValueXY());  // Animated value for pan responder
  const [mediaIndex, setMediaIndex] = useState(0)

  const styles = StyleSheet.create({
    arrowButton: {
      position: 'absolute',
      top: '50%',
      backgroundColor: 'gray',
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      transform: [{ translateY: -20 }], // centers vertically
      opacity: 0.7,
    },
    leftArrow: {
      display: mediaIndex > 0 ? "flex" : "none",
      left: 10,
    },
    rightArrow: {
      display: mediaIndex < props.currentSuggestion?.media.length - 1 ? "flex" : "none",
      right: 10,
    },
    arrowText: {
      color: 'white',
      fontSize: 20,
      fontWeight: 'bold',
    },
    imageContainer: {
      
    },
    container: {
      display: "flex",
      flexDirection: "row",
      justifyContent: "space-between",
      backgroundColor: config.app.theme.creme,
      borderRadius: 15,
      borderColor: config.app.theme.black,
      borderWidth: 1,
      height: "40%",
      marginVertical: 5,
      padding: "3%",
    },
    imageStyle: {
      aspectRatio: 0.7,
      borderColor: config.app.theme.black,
      borderWidth: 1,
      borderRadius: 10,
    },
    skillContainer: {
      width: "100%",
      height: "10%",
    },
  });
  


  const resetSwipe = () => {
    // Reset the position of the card when it is not swiped enough
    Animated.spring(pan, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: true,
    }).start();
  };

  const swipeLeft = () => {
    props.onSwipeLeft(props.liker);
  };

  const swipeRight = () => {
    props.onSwipeRight(props.liker);
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: (evt, gestureState) => true,
    onPanResponderMove: (evt, gestureState) => {
      // Only allow horizontal movement, reset vertical movement (gestureState.dy to 0)
      pan.setValue({ x: gestureState.dx, y: 0 });
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (gestureState.dx < -150) {
        swipeLeft(); // Trigger left swipe action
      } else if (gestureState.dx > 150) {
        swipeRight(); // Trigger right swipe action
      } else {
        resetSwipe(); // Reset position if not swiped enough
      }
    },
  });

  return (
      <Animated.View
        style={[styles.container, { transform: [{ translateX: pan.x }, { translateY: pan.y }] }]}
        {...panResponder.panHandlers}
      >
        <View style = {{display: "flex", flexDirection: "column"}}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: props.media.media[0].uri }}
            style={styles.imageStyle}
          />

          {/* Left Arrow */}
          <TouchableOpacity style={[styles.arrowButton, styles.leftArrow]} onPress={() => setMediaIndex(mediaIndex - 1)}>
            <Text style={styles.arrowText}>{"<"}</Text>
          </TouchableOpacity>
          
          {/* Right Arrow */}
          <TouchableOpacity style={[styles.arrowButton, styles.rightArrow]} onPress={() => setMediaIndex(mediaIndex + 1)}>
            <Text style={styles.arrowText}>{">"}</Text>
          </TouchableOpacity>

          

        </View>

    <SocialButtons horizontal = {true} socials={props.media.profile.socials} />

        </View>

        <View style={{ display: "flex", flexDirection: "column"}}>
          <Text>{props.media.profile.firstName} {props.media.profile.lastName}</Text>
          <View style = {styles.skillContainer}>
            <SkillLevels sports = {props.media.sports}></SkillLevels>
          </View>

        </View>

        
      </Animated.View>
  );
};


export default Liker;
