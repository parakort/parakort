import React, { useState, useEffect } from 'react';
import { View, Image, Text, StyleSheet, Animated, SafeAreaView, TouchableOpacity, Linking } from 'react-native';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';
import app_styles from '../styles';
import config from "../app.json"
import SocialButtons from '../Components/SocialButtons';
import SkillLevels from '../Components/SkillLevels';
import NoUsers from '../Components/NoUsers';
import Loading from '../Components/Loading'
import RetryableImage from '../Components/RetryableImage';
import NoTokens from '../Components/NoTokens';



const SwipeableCard = (props) => {

  // Current displayed media
  const [mediaIndex, setMediaIndex] = useState(0)
  useEffect(() => {
    translateX.setValue(0);
    opacity.setValue(1);
  }, [props.currentSuggestion])
  
  

  const styles = StyleSheet.create({
    skillContainer: {

      position: "absolute",
      width: "85%",
      height: "8%",
      alignSelf: "center",
      bottom: "-3%",
      padding: "0.5%"

    },
    imageContainer: {
      flex: 1,
      marginBottom: 20, // 20px space between image and description
      
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
      bottom: 30,
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
      width: "75%"
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
    inputRange: [-600, 0, 600],
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
        toValue: -600,
        duration: 300,
        useNativeDriver: true,
      }).start(() => replaceCard(false));
    }
  };

  // Callback for swiping, match if right
  function swipe(right)
  {
    props.swiped(right)
    setMediaIndex(0)
  }

  // called when swiping.
  const replaceCard = (right) => {
    
    // Stop and reset the animations
    translateX.stopAnimation();
    opacity.stopAnimation();

    // Reset translate and opacity values
    translateX.setValue(0);
    opacity.setValue(1);

    Animated.sequence([
      // First animation: reset translation
      resetTranslateAnimation,
      // Second animation: fade back in
      fadeInAnimation,
    ]).start(); // Start the sequence


    swipe(right);
    

  };


  if (props.currentSuggestion)
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
              <RetryableImage
                uri= {props.currentSuggestion.media[mediaIndex]?.uri}
                style={styles.image}
                useLoading={true}
              />

              {/* Left Arrow */}
              <TouchableOpacity style={[styles.arrowButton, styles.leftArrow]} onPress={() => setMediaIndex(mediaIndex - 1)}>
                <Text style={styles.arrowText}>{"<"}</Text>
              </TouchableOpacity>
              
              {/* Right Arrow */}
              <TouchableOpacity style={[styles.arrowButton, styles.rightArrow]} onPress={() => setMediaIndex(mediaIndex + 1)}>
                <Text style={styles.arrowText}>{">"}</Text>
              </TouchableOpacity>
             
              
              <Text style={styles.name}>{props.currentSuggestion.profile.firstName} {props.currentSuggestion.profile.lastName}, {props.currentSuggestion.profile.age}</Text>

              

              <View style = {styles.skillContainer}>
                <SkillLevels sports = {props.currentSuggestion.sports}></SkillLevels>
              </View>

            </View>
            <View style={styles.descriptionContainer}>
              <Text style={styles.description}>{props.currentSuggestion?.profile.bio}</Text>
              <SocialButtons socials = {props.currentSuggestion?.profile.socials}></SocialButtons>
            </View>
          </Animated.View>
        </PanGestureHandler>
      </GestureHandlerRootView>
    </SafeAreaView>
  );

  else if (!props.currentSuggestion)
  {
    if (props.haltSuggestLoop)
    {
      if (props.tokens > 0)
      {
        return (
          <NoUsers resumeSuggestLoop = {props.resumeSuggestLoop}></NoUsers>
        )
      }
      else
      {
        return (
          <NoTokens showPaywall = {props.showPaywall}></NoTokens>
        )
      }
    }
    

    return <Loading></Loading>
    
  }

  // Error loading media: downloadAgain
  else
  {
    props.refreshSuggestion()
    
  }
  

};



export default SwipeableCard;
