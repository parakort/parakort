import React, { useState, useEffect } from 'react';
import { View, Image, Text, StyleSheet, Animated, SafeAreaView } from 'react-native';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';
import app_styles from '../styles';
import config from "../app.json"



let examples = [{
  name: "Rory McIlroy",
  age: 32,
  description: "Passionate golfer seeking a dedicated teammate to elevate our game! Whether you're an experienced player or enthusiastic amateur, let's join forces. I value skill, strategy, and mutual support. If you’re eager to improve and enjoy the game together, let’s connect and make every round count!",
  image: "https://www.liveabout.com/thmb/0ZPzYOS9O7HHdiq6KdMmEFcossI=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/mcilroy-rory-18-5acd04aca474be0036f0d0d7.jpg",
}, 
{
  name: "Sierra Brooks",
  age: 21,
  description: "Hey! I’m Sierra Brooks, a dedicated golfer looking for a friendly opponent to hit the greens with. I love the challenge of a good game and the camaraderie that comes with it. Whether you're a seasoned player or a passionate newbie, let's tee off and enjoy the game together! 🏌️‍♀️⛳",
  image: "https://www.golfwrx.com/wp-content/uploads/2018/10/GettyImages-862903260.jpg"
}
]


const SwipeableCard = () => {
const [currentMatch, setCurrentMatch] = useState(examples[0])


  const [translateX] = useState(new Animated.Value(0));
  const [opacity] = useState(new Animated.Value(1));
  const SWIPE_THRESH = 25;

  const resetTranslateAnimation = Animated.timing(translateX, {
    toValue: 0,
    duration: 0,
    useNativeDriver: false,
  });

  const fadeInAnimation = Animated.timing(opacity, {
    toValue: 1,
    duration: 150,
    useNativeDriver: false,
  });

  useEffect(() => {
    // Preload images for both examples
    examples.forEach((example) => {
      Image.prefetch(example.image);
    });
  }, []);

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: false }
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
        useNativeDriver: false,
      }).start();
    } else if (translateX._value > 0) {
      Animated.timing(translateX, {
        toValue: 500,
        duration: 300,
        useNativeDriver: false,
      }).start(() => replaceCard(true));
    } else if (translateX._value < 0) {
      Animated.timing(translateX, {
        toValue: -500,
        duration: 300,
        useNativeDriver: false,
      }).start(() => replaceCard(false));
    }
  };

  function swipe(right)
  {
    setCurrentMatch(currentMatch.age < 30 ? examples[0] : examples[1])
  }

  const replaceCard = (right) => {
    swipe(right);
    opacity._value = 0;
    resetTranslateAnimation.start();

  };

  const handleImageLoad = () => {
    fadeInAnimation.start();
  };

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
                source={{ uri: currentMatch?.image }}
                style={styles.image}
                onLoad={handleImageLoad} // Trigger when image loads: then we can animate
              />
              <Text style={styles.name}>{currentMatch?.name}</Text>
            </View>
            <View style={styles.descriptionContainer}>
              <Text style={styles.description}>{currentMatch?.description}</Text>
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
