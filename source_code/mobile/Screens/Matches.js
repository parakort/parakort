import React, { useRef } from 'react';
import {
  View,
  Text,
  Animated,
  PanResponder,
  StyleSheet,
} from 'react-native';
import styles from '../styles.js';
import Match from '../Components/Match.js';

const Matches = (props) => {
  const triggerThreshold = -150; // Distance to trigger swipe action

  const renderSwipeableMatch = (match, index) => {
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
            props.onSwipeLeft(match);
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
        key={index}
        style={[styles.swipeableContainer, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <Match
          index={index}
          match={match}
          media={props.media.get(match.uid)}
        />
      </Animated.View>
    );
  };

  if (props.matches) {
    return (
      <View style={styles.screen}>
        <Text style={{ fontSize: 25, fontWeight: '100', paddingBottom: 10 }}>
          My Matches
        </Text>
        {props.matches
          .filter((match) => match.mutual) // Filter to include only matches with mutual: true
          .map(renderSwipeableMatch)}
      </View>
    );
  }
  return null;
};

export default Matches;
