import React, { useState, useEffect } from 'react';
import { View, Image, Text, StyleSheet, Animated, SafeAreaView, TouchableOpacity } from 'react-native';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';
import app_styles from '../styles';
import config from "../app.json";
import SocialButtons from '../Components/SocialButtons';
import SkillLevels from '../Components/SkillLevels';
import NoUsers from '../Components/NoUsers';
import Loading from '../Components/Loading';
import RetryableImage from '../Components/RetryableImage';
import NoTokens from '../Components/NoTokens';

const SwipeableCard = (props) => {

  const [mediaIndex, setMediaIndex] = useState(0);
  const [undoStack, setUndoStack] = useState([]);
  const [currentSuggestion, setCurrentSuggestion] = useState(props.currentSuggestion);

  useEffect(() => {
    translateX.setValue(0);
    opacity.setValue(1);
    setCurrentSuggestion(props.currentSuggestion);
  }, [props.currentSuggestion]);

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
      marginBottom: 20,
    },
    image: {
      width: '100%',
      height: '100%',
      borderWidth: 2,
      borderColor: 'black',
      borderRadius: 10,
      resizeMode: 'cover',
    },
    undoButton: {
      position: 'absolute',
      top: 10,
      right: 10,
      backgroundColor: 'red',
      paddingVertical: 5,
      paddingHorizontal: 15,
      borderRadius: 20,
      zIndex: 10,
      opacity: 0.8
    },
    undoText: {
      color: 'white',
      fontSize: 16,
      fontWeight: 'bold',
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
      transform: [{ translateY: -20 }],
      opacity: 0.7,
    },
    leftArrow: {
      display: mediaIndex > 0 ? "flex" : "none",
      left: 10,
    },
    rightArrow: {
      display: mediaIndex < currentSuggestion?.media.length - 1 ? "flex" : "none",
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

  const replaceCard = (right) => {
    if (currentSuggestion) {
      setUndoStack((prevStack) => [currentSuggestion, ...prevStack]);
    }

    translateX.stopAnimation();
    opacity.stopAnimation();
    translateX.setValue(0);
    opacity.setValue(1);

    Animated.sequence([
      resetTranslateAnimation,
      fadeInAnimation,
    ]).start();

    props.swiped(right);
    setMediaIndex(0);
  };

  const undo = () => {
    if (undoStack.length > 0) {
      const previousUser = undoStack[0];
      setUndoStack((prevStack) => prevStack.slice(1));
      setCurrentSuggestion(previousUser);
    }
  };

  if (currentSuggestion) {
    return (
      <SafeAreaView style={app_styles.screen}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <PanGestureHandler
            onGestureEvent={onGestureEvent}
            onHandlerStateChange={onGestureEnd}
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

              {/* Undo Button */}
              {undoStack.length > 0 && (
                <TouchableOpacity style={styles.undoButton} onPress={undo}>
                  <Text style={styles.undoText}>Undo</Text>
                </TouchableOpacity>
              )}

              <View style={styles.imageContainer}>
                <RetryableImage
                  uri={currentSuggestion.media[mediaIndex]?.uri}
                  style={styles.image}
                  useLoading={true}
                />

                <TouchableOpacity style={[styles.arrowButton, styles.leftArrow]} onPress={() => setMediaIndex(mediaIndex - 1)}>
                  <Text style={styles.arrowText}>{"<"}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.arrowButton, styles.rightArrow]} onPress={() => setMediaIndex(mediaIndex + 1)}>
                  <Text style={styles.arrowText}>{">"}</Text>
                </TouchableOpacity>

                <Text style={styles.name}>
                  {currentSuggestion.profile.firstName} {currentSuggestion.profile.lastName}, {currentSuggestion.profile.age}
                </Text>

                <View style={styles.skillContainer}>
                  <SkillLevels sports={currentSuggestion.sports} />
                </View>
              </View>

              <View style={styles.descriptionContainer}>
                <Text style={styles.description}>{currentSuggestion?.profile.bio}</Text>
                <SocialButtons socials={currentSuggestion?.profile.socials} />
              </View>
            </Animated.View>
          </PanGestureHandler>
        </GestureHandlerRootView>
      </SafeAreaView>
    );
  } else if (!props.currentSuggestion) {
    if (props.haltSuggestLoop) {
      return props.tokens > 0 ? (
        <NoUsers resumeSuggestLoop={props.resumeSuggestLoop} />
      ) : (
        <NoTokens showPaywall={props.showPaywall} />
      );
    }
    return <Loading />;
  } else {
    props.refreshSuggestion();
  }
};

export default SwipeableCard;
