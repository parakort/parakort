import React, { useState, useEffect } from 'react';
import { View, Text, PanResponder, Animated, StyleSheet, Image } from 'react-native';
import config from "../app.json";
import SocialButtons from './SocialButtons';
import SkillLevels from './SkillLevels';

const Liker = (props) => {
  const [pan, setPan] = useState(new Animated.ValueXY());  // Animated value for pan responder

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
    <View >
      <Animated.View
        style={[styles.container, { transform: [{ translateX: pan.x }, { translateY: pan.y }] }]}
        {...panResponder.panHandlers}
      >
        <Image style={styles.imageStyle} source={{ uri: props.media.media[0].uri }} />

        <View style={{ display: "flex", flexDirection: "column", width: "50%", height: "100%", justifyContent: "space-evenly", alignItems: "center" }}>
          <Text>{props.media.profile.firstName} {props.media.profile.lastName}</Text>

          <View style={styles.skillContainer}>
            <SkillLevels sports={props.media.sports} />
          </View>
        </View>

        <SocialButtons socials={props.media.profile.socials} />
      </Animated.View>
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
    alignItems: "center",
  },
  imageStyle: {
    height: "90%",
    aspectRatio: 1,
    borderColor: config.app.theme.black,
    borderWidth: 1,
    borderRadius: 10,
  },
  skillContainer: {
    width: "100%",
    height: "30%",
  },
});

export default Liker;
