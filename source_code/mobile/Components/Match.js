import React, { useRef } from 'react';
import {
  View,
  Text,
  Animated,
  PanResponder,
  StyleSheet,
} from 'react-native';
import config from "../app.json";
import SocialButtons from './SocialButtons';
import SkillLevels from './SkillLevels';

const Match = (props) => {
  const triggerThreshold = -150; // Distance to trigger swipe action
  const translateX = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 10, // Start responding to horizontal movement
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          // Allow only left swiping
          translateX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < triggerThreshold) {
          // Trigger action when swiped past the threshold
          props.onSwipeLeft(props.match);
          Animated.timing(translateX, {
            toValue: -300, // Move it completely out of view
            duration: 200,
            useNativeDriver: true,
          }).start();
        } else {
          // Snap back to the original position
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  return (
    <Animated.View
      style={[styles.swipeableContainer, { transform: [{ translateX }] }]}
      {...panResponder.panHandlers}
    >
      <View style={styles.container}>
        <Image style={styles.imageStyle} source={{ uri: props.media.media[0].uri }} />
        <View
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '50%',
            height: '100%',
            justifyContent: 'space-evenly',
            alignItems: 'center',
          }}
        >
          <Text>
            {props.media.profile.firstName} {props.media.profile.lastName}
          </Text>

          <View style={styles.skillContainer}>
            <SkillLevels sports={props.media.sports} />
          </View>
        </View>
        <SocialButtons socials={props.media.profile.socials} />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  swipeableContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: config.app.theme.creme,
    borderRadius: 15,
    borderColor: config.app.theme.black,
    borderWidth: 1,
    height: 125,
    marginVertical: 5,
    padding: '3%',
    alignItems: 'center',
  },
  container: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: config.app.theme.creme,
    borderRadius: 15,
    borderColor: config.app.theme.black,
    borderWidth: 1,
    height: 125,
    marginVertical: 5,
    padding: '3%',
    alignItems: 'center',
  },
  imageStyle: {
    height: '90%',
    aspectRatio: 1,
    borderColor: config.app.theme.black,
    borderWidth: 1,
    borderRadius: 10,
  },
  skillContainer: {
    width: '100%',
    height: '30%',
  },
});

export default Match;
