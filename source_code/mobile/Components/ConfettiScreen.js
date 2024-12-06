import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';

const FunConfettiScreen = ({ trigger, onComplete, message = "Congratulations!" }) => {
  const [fadeAnim] = useState(new Animated.Value(0)); // Initial opacity
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (trigger) {
      setShowConfetti(true);

      // Fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }).start(() => {
        // Fade out animation after delay
        setTimeout(() => {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }).start(() => {
            setShowConfetti(false);
            onComplete?.(); // Notify parent when the effect is complete
          });
        }, 2000); // Display message for 2 seconds
      });
    }
  }, [trigger, fadeAnim, onComplete]);

  if (!trigger && !showConfetti) {
    return null; // Render nothing if not triggered
  }

  return (
    <View style={styles.overlay}>
      {showConfetti && (
        <ConfettiCannon
          count={100}
          origin={{ x: Dimensions.get('window').width / 2, y: 0 }}
          fadeOut={true}
        />
      )}
      {trigger && (
        <Animated.Text style={[styles.message, { opacity: fadeAnim }]}>
          {message}
        </Animated.Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent', // Ensure it doesn't block the underlying UI
  },
  message: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default FunConfettiScreen;
