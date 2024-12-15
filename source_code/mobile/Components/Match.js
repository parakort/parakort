import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Animated,
  PanResponder,
  StyleSheet,
  Image,
  TouchableOpacity
} from 'react-native';
import config from "../app.json";
import SocialButtons from './SocialButtons';
import SkillLevels from './SkillLevels';
import RetryableImage from './RetryableImage';

const Match = (props) => {
  const triggerThreshold = -150; // Distance to trigger swipe action
  const translateX = useRef(new Animated.Value(0)).current;

  const [mediaIndex, setMediaIndex] = useState(0)

  const styles = StyleSheet.create({
    arrowButton: {
        position: 'absolute',
        top: '60%',
        backgroundColor: 'gray',
        width: 20,
        height: 20,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        transform: [{ translateY: -20 }], // centers vertically
        opacity: 0.7,
        },
        leftArrow: {
        display: mediaIndex > 0 ? "flex" : "none",
        left: 5,
        },
        rightArrow: {
        display: mediaIndex < props.media.media.length - 1 ? "flex" : "none",
        right: 5,
        },
        arrowText: {
        color: 'white',
        fontSize: 15,
        fontWeight: 'bold',
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
      style={{ transform: [{ translateX }] }}
      {...panResponder.panHandlers}
    >
      <View style={styles.container}>
      <View style={styles.imageContainer}>
            <RetryableImage
              uri={props.media.media[mediaIndex].uri }
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
            {props.media.profile.firstName} {props.media.profile.lastName}, {props.media.profile.age}
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



export default Match;
