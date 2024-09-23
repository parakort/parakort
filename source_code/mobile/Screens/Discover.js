import React, { useState, useEffect } from 'react';
import { View, Image, Text, StyleSheet, Animated, SafeAreaView } from 'react-native';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';
import app_styles from '../styles';
import config from "../app.json"



const SwipeableCard = (props) => {


  const [translateX] = useState(new Animated.Value(0));
  const [opacity] = useState(new Animated.Value(1));
  const SWIPE_THRESH = 25;

  const resetTranslateAnimation = Animated.timing(translateX, {
    toValue: 0,
    duration: 0,
    useNativeDriver: true,
  });

  const fadeInAnimation = Animated.timing(opacity, {
    toValue: 1,
    duration: 140,
    useNativeDriver: true,
  });


  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: true }
  );

  const rotateCard = translateX.interpolate({
    inputRange: [-500, 0, 500],
    outputRange: ['-30deg', '0deg', '30deg'],
    extrapolate: 'clamp',
  });

  const onGestureEnd = () => {
    if (translateX._value <= SWIPE_THRESH && translateX._value >= -SWIPE_THRESH) {
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    } else if (translateX._value > 0) {
      Animated.timing(translateX, {
        toValue: 500,
        duration: 300,
        useNativeDriver: true,
      }).start(() => replaceCard(true));
    } else if (translateX._value < 0) {
      Animated.timing(translateX, {
        toValue: -500,
        duration: 300,
        useNativeDriver: true,
      }).start(() => replaceCard(false));
    }
  };

  // Callback for swiping, match if right
  function swipe(right)
  {
    props.swiped(right)
  }

  // called when swiping.
  const replaceCard = (right) => {
    
    opacity.setValue(0);

    Animated.sequence([
      // First animation: reset translation
      resetTranslateAnimation,
      // Second animation: fade back in
      fadeInAnimation,
    ]).start(); // Start the sequence

    //resetTranslateAnimation.start();

    swipe(right);
    

  };

  const handleImageLoad = () => {
    // I now instead fade in each swipe

    //fadeInAnimation.start();
    //console.log("image loaded")
  };

  if (props.currentSuggestion?.media[0]?.uri)
  return (
    <SafeAreaView style={app_styles.screen}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <PanGestureHandler
          onGestureEvent={onGestureEvent}
          onHandlerStateChange={() => {
            onGestureEnd();
          }}
        >
          <Animated.View
            style={[
              {
                opacity: opacity,
                transform: [{ translateX: translateX }, { rotate: rotateCard }],
                flex: 1,
              },
            ]}
          >
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: props.currentSuggestion.media[0].uri }}
                style={styles.image}
                onLoad={handleImageLoad}
              />
             
              <Text style={styles.name}>{props.currentSuggestion.profile.firstName}, {props.currentSuggestion.profile.age}</Text>
            </View>
            <View style={styles.descriptionContainer}>
              <Text style={styles.description}>{props.currentSuggestion?.profile.bio}</Text>
            </View>
          </Animated.View>
        </PanGestureHandler>
      </GestureHandlerRootView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  imageContainer: {
    flex: 1,
    marginBottom: 20, // 20px space between image and description
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    borderWidth: 2,
    borderColor: 'black',
    borderRadius: 10,
    resizeMode: 'cover',
  },
  name: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',

  },
  descriptionContainer: {
    height: '30%',
    
    backgroundColor: config.app.theme.creme,
    borderWidth: 2,
    borderColor: 'black',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    
  },
  description: {
    fontSize: 15,
    textAlign: 'center',
  },
});

export default SwipeableCard;
