import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react-native';
import config from "../app.json";
import SocialButtons from './SocialButtons';
import SkillLevels from './SkillLevels';
import RetryableImage from './RetryableImage';

const Match = (props) => {
  const [mediaIndex, setMediaIndex] = useState(0);
  
  const styles = StyleSheet.create({
    arrowButton: {
      position: 'absolute',
      top: '60%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      width: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      transform: [{ translateY: -20 }], // centers vertically
    },
    leftArrow: {
      display: mediaIndex > 0 ? "flex" : "none",
      left: 5,
    },
    rightArrow: {
      display: mediaIndex < ((props?.media ? props.media.media.length : 0) - 1) ? "flex" : "none",
      right: 5,
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
    unreadContainer: {
      borderLeftWidth: 3,
      borderLeftColor: '#1e88e5',
    },
    imageContainer: {
      position: 'relative',
      height: '100%',
      aspectRatio: 1,
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
    contentContainer: {
      display: 'flex',
      flexDirection: 'column',
      width: '50%',
      height: '100%',
      justifyContent: 'space-evenly',
      alignItems: 'center',
    },
    nameText: {
      fontSize: 14,
      fontWeight: '500',
    },
    unreadIndicator: {
      position: 'absolute',
      top: 10,
      right: 10,
      backgroundColor: 'white',
      borderRadius: 12,
      padding: 2,
      zIndex: 10,
    },
  });

  if (!props.media) 
    {
      return null;
    }

  return (
    <TouchableOpacity onPress={props.onPress} activeOpacity={0.7}>
      <View style={[styles.container, props.unread && styles.unreadContainer]}>
        <View style={styles.imageContainer}>
          <RetryableImage
            uri={props.media ? props.media.media[mediaIndex].uri : ""}
            style={styles.imageStyle}
          />
          
          {/* Unread indicator */}
          {props.unread && (
            <View style={styles.unreadIndicator}>
              <MessageCircle size={18} color="#1e88e5" fill="#e3f2fd" />
            </View>
          )}
          
          {/* Left Arrow */}
          <TouchableOpacity
            style={[styles.arrowButton, styles.leftArrow]}
            onPress={() => setMediaIndex(mediaIndex - 1)}
          >
            <ChevronLeft size={16} color="white" />
          </TouchableOpacity>
          
          {/* Right Arrow */}
          <TouchableOpacity
            style={[styles.arrowButton, styles.rightArrow]}
            onPress={() => setMediaIndex(mediaIndex + 1)}
          >
            <ChevronRight size={16} color="white" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.contentContainer}>
          <Text style={styles.nameText}>
            {props.media.profile.firstName} {props.media.profile.lastName},{" "}
            {props.media.profile.age}
          </Text>
          <View style={styles.skillContainer}>
            <SkillLevels sports={props.media.sports} />
          </View>
        </View>
        
        <SocialButtons socials={props.media.profile.socials} />
      </View>
    </TouchableOpacity>
  );
};

export default Match;