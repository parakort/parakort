import React, { useState, useEffect } from 'react';
import { View, Image, Text, StyleSheet, Animated, SafeAreaView, TouchableOpacity, Linking } from 'react-native';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';
import app_styles from '../styles';
import config from "../app.json"




const SwipeableCard = (props) => {

  // Current displayed media
  const [mediaIndex, setMediaIndex] = useState(0)

  const styles = StyleSheet.create({
    iconContainer: {
      borderWidth: 1,      // Add this
      borderColor: 'red',  // Add this (or any visible color)
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-evenly",
    },
    icon: {
      height: "50%",
      aspectRatio: 1,
      resizeMode: "contain",
    },
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
    name: {
      position: 'absolute',
      bottom: 10,
      left: 10,
      color: 'white',
      fontSize: 20,
      fontWeight: 'bold',
  
    },
    descriptionContainer: {
      height: '25%',
      flexDirection: 'row',
      backgroundColor: config.app.theme.creme,
      borderWidth: 2,
      borderColor: 'black',
      borderRadius: 10,
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 10,
      
    },
    description: {
      fontSize: 15,
      textAlign: 'center',
    },
  });

  


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


  const openProfile = async (url, appUrl) => {
    try {
      
      const supported = await Linking.canOpenURL(appUrl);
      await Linking.openURL(supported ? appUrl : url);
    } catch (error) {
      console.log(error);
    }
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
                source={{ uri: props.currentSuggestion.media[mediaIndex].uri }}
                style={styles.image}
                onLoad={handleImageLoad}
              />

              {/* Left Arrow */}
              <TouchableOpacity style={[styles.arrowButton, styles.leftArrow]} onPress={() => setMediaIndex(mediaIndex - 1)}>
                <Text style={styles.arrowText}>{"<"}</Text>
              </TouchableOpacity>
              
              {/* Right Arrow */}
              <TouchableOpacity style={[styles.arrowButton, styles.rightArrow]} onPress={() => setMediaIndex(mediaIndex + 1)}>
                <Text style={styles.arrowText}>{">"}</Text>
              </TouchableOpacity>
             
              <Text style={styles.name}>{props.currentSuggestion.profile.firstName}, {props.currentSuggestion.profile.age}</Text>
            </View>
            <View style={styles.descriptionContainer}>
              <Text style={styles.description}>{props.currentSuggestion?.profile.bio}</Text>
              <View style={styles.iconContainer}>
                {props.currentSuggestion?.profile.socials.instagram && (
                  <TouchableOpacity onPress={() => openProfile(`https://www.instagram.com/${props.currentSuggestion?.profile.socials.instagram}`, `instagram://user?username=${props.currentSuggestion?.profile.socials.instagram}`)}>
                  < Image style={styles.icon} source={require('../assets/social-icons/instagram.png')} />
                  </TouchableOpacity>
                )}
                
                {props.currentSuggestion?.profile.socials.linkedin && (
                  <TouchableOpacity onPress={() => openProfile(`https://www.linkedin.com/in/${props.currentSuggestion?.profile.socials.linkedin}`, `linkedin://in/${props.currentSuggestion?.profile.socials.linkedin}`)}>
                    <Image style={styles.icon} source={require('../assets/social-icons/linkedin.png')} />
                  </TouchableOpacity>
                )}
                
                {props.currentSuggestion?.profile.socials.facebook && (

                  <TouchableOpacity onPress={() => openProfile(`https://www.facebook.com/${props.currentSuggestion?.profile.socials.facebook}`, `fb://profile/${props.currentSuggestion?.profile.socials.facebook}`)}>
                    <Image style={styles.icon} source={require('../assets/social-icons/facebook.png')} />
                  </TouchableOpacity>
                )}

              </View>
            </View>
          </Animated.View>
        </PanGestureHandler>
      </GestureHandlerRootView>
    </SafeAreaView>
  );

  

};



export default SwipeableCard;
