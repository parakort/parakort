import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import RetryableImage from '../Components/RetryableImage';
import config from "../app.json";

const Chat = (props) => {
  const [messageInput, setMessageInput] = useState('');
  const [debouncedMessageInput, setDebouncedMessageInput] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [existingVenuesData, setExistingVenuesData] = useState(null);
  const [venuesModalVisible, setVenuesModalVisible] = useState(false);
  const [lastVenuesDate, setLastVenuesDate] = useState(null);
  const flatListRef = useRef(null);

  const messages = useMemo(() => props.messages, [props.messages]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedMessageInput(messageInput);
    }, 100); // Adjust debounce

    return () => {
      clearTimeout(handler);
    };
  }, [messageInput]);

  useEffect(() => {
    async function loadMessages() {
      try {
        if (props?.user) {
          props.setMessages([]);

          if (isSocketBroken(props.ws.current)) props.connectWs();

          const messages = await props.loadMessages(props.myuid, props.user.uid);
          props.setMessages(messages);
          
          // Check for existing venues data in messages
          checkForExistingVenues(messages);
        }
      } catch (error) {
        console.error("Error setting messages", error);
      }
    }

    loadMessages();
  }, [props.user]);
  
  // Function to check for existing venues data in messages
  const checkForExistingVenues = (messages) => {
    try {
      // Look for the most recent venues message
      const venuesMessages = messages.filter(msg => 
        msg.isSpecial && msg.specialType === "venues"
      );
      
      if (venuesMessages.length > 0) {
        // Sort by timestamp to get the most recent
        const latestVenuesMessage = venuesMessages.sort((a, b) => 
          new Date(b.timestamp) - new Date(a.timestamp)
        )[0];
        
        // Parse the message and store the data
        const data = JSON.parse(latestVenuesMessage.message);
        setExistingVenuesData(data);
        setLastVenuesDate(new Date(latestVenuesMessage.timestamp));
      } else {
        setExistingVenuesData(null);
        setLastVenuesDate(null);
      }
    } catch (error) {
      console.error("Error checking for existing venues:", error);
      setExistingVenuesData(null);
      setLastVenuesDate(null);
    }
  };

  function isSocketBroken(socket) {
    try {
      const isSocketIdValid = typeof socket._socketId === "number";
      const isReadyStateValid = socket.readyState === 3;
      const isSubscriptionsValid = Array.isArray(socket._subscriptions) && socket._subscriptions.length === 0;

      return isSocketIdValid && isReadyStateValid && isSubscriptionsValid;
    } catch (error) {
      console.error("Invalid JSON string provided:", error.message);
      return false;
    }
  }

  const sendMessage = () => {
    if (debouncedMessageInput.trim() === '' || !props.ws.current) return;

    if (isSocketBroken(props.ws.current)) props.connectWs();

    const time = new Date();

    const newMessage = {
      type: 'message',
      senderId: props.myuid,
      senderName: props.senderName,
      recipientId: props.user.uid,
      text: debouncedMessageInput,
      timestamp: time,
    };

    props.ws.current.send(JSON.stringify(newMessage));
    props.setMessages((prev) => [...prev, { sender: true, message: debouncedMessageInput, timestamp: time }]);
    setMessageInput('');
  };

  const handleUnmatch = () => {
    Alert.alert(
      "Unmatch User",
      `Are you sure you want to unmatch with ${props.user.profile.firstName}?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Unmatch",
          onPress: () => {
            props.unmatch(props.user.uid);
            setMenuVisible(false);
            props.setUser(null);
          },
          style: "destructive"
        }
      ]
    );
  };

  const handleBlock = () => {
    props.block(props.user.uid);
    setMenuVisible(false);
    props.setUser(null);
  };

  const handleFindPlacesToPlay = () => {
    // Check if we already have venues data
    if (existingVenuesData) {
      const formattedDate = lastVenuesDate ? 
        `${lastVenuesDate.getMonth()+1}/${lastVenuesDate.getDate()}/${lastVenuesDate.getFullYear()}` : 
        "previously";
      
      Alert.alert(
        "Courts Already Found",
        `Courts were found on ${formattedDate}. Would you like to view these or generate new recommendations?`,
        [
          {
            text: "View Existing",
            onPress: () => {
              setMenuVisible(false);
              setVenuesModalVisible(true);
            }
          },
          {
            text: "Generate New",
            onPress: () => {
              setMenuVisible(false);
              findSportsVenues();
            }
          },
          {
            text: "Cancel",
            style: "cancel"
          }
        ]
      );
    } else {
      // No existing venues, just find new ones
      setMenuVisible(false);
      findSportsVenues();
    }
  };

  const findSportsVenues = async () => {
    // check if they are elite tier
    if (props.me.profile.tier.toLowerCase() !== "elite" ) {  // || props.user.profile.tier === "elite"
      Alert.alert(
        "Elite Tier Required",
        "You must be an Elite Tier user to use this feature. Upgrade to Elite to unlock this feature.",
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Upgrade to Elite",
            onPress: () => {
              // Navigate to the upgrade screen
              props.showPaywall("Elite")
            }
          }
        ]
      );
      return
    }
    try {
      setIsLoading(true);
      
      // Get my sports and their sports
      const mySports = props.me.sports || [];
      const theirSports = props.user.sports || [];
      
      // Filter sports where both users have a non-zero my_level value
      const overlappingSports = [];
      
      // Create maps for quick lookup
      const mySportsMap = {};
      mySports.forEach(sport => {
        mySportsMap[sport.sportId._id] = sport.my_level;
      });
      
      // Find overlapping sports where both have non-zero my_level
      theirSports.forEach(theirSport => {
        const sportId = theirSport.sportId._id;
        const theirLevel = theirSport.my_level;
        
        // Check if both users play this sport (my_level > 0)
        if (sportId in mySportsMap && mySportsMap[sportId] > 0 && theirLevel > 0) {
          overlappingSports.push({
            id: sportId,
            name: theirSport.sportId.name,
            myLevel: mySportsMap[sportId],
            theirLevel: theirLevel
          });
        }
      });
      
      if (overlappingSports.length === 0) {
        const time = new Date();
        const noOverlapMessage = { 
          type: "noVenues", 
          message: "No overlapping sports found between you two. Maybe it's time to try something new together?" 
        };
        
        props.setMessages((prev) => [...prev, { 
          sender: true, 
          message: JSON.stringify(noOverlapMessage), 
          timestamp: time,
          isSpecial: true,
          specialType: "noVenues"
        }]);
        
        if (props.ws.current && props.ws.current.readyState === WebSocket.OPEN) {
          const newMessage = {
            type: 'message',
            senderId: props.myuid,
            senderName: props.senderName,
            recipientId: props.user.uid,
            text: JSON.stringify(noOverlapMessage),
            timestamp: time,
            isSpecial: true,
            specialType: "noVenues"
          };
          
          props.ws.current.send(JSON.stringify(newMessage));
        }
        
        setIsLoading(false);
        return;
      }
      
      // Call backend API with user locations and overlapping sports
      const myLocation = props.me.profile.location;
      const theirLocation = props.user.profile.location;
      const myuid = props.myuid
      
      const response = await fetch(`${config.app.server}/findSportsVenues`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${props.token}`
        },
        body: JSON.stringify({
          myLocation,
          theirLocation,
          overlappingSports,
          myuid
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch sports venues');
      }
      
      const venuesData = await response.json();
      setExistingVenuesData(venuesData);
      setLastVenuesDate(new Date());
      
      // Create a summary message for the chat
      const sportCount = Object.keys(venuesData.venues).length;
      const venueCount = Object.values(venuesData.venues).flat().length;
      
      const summaryMessage = { 
        type: "venuesSummary", 
        message: `Found ${venueCount} places to play ${sportCount} sport${sportCount > 1 ? 's' : ''} together! Tap to view details.`,
        fullData: venuesData
      };
      
      const time = new Date();
      
      // Send the summary message to chat
      props.setMessages((prev) => [...prev, { 
        sender: true, 
        message: JSON.stringify(summaryMessage), 
        timestamp: time,
        isSpecial: true,
        specialType: "venuesSummary"
      }]);
      
      // Also store the full data for future reference
      props.setMessages((prev) => [...prev, { 
        sender: true, 
        message: JSON.stringify(venuesData), 
        timestamp: time,
        isSpecial: true,
        specialType: "venues",
        hidden: true // This message won't be displayed in chat but keeps the data
      }]);
      
      if (props.ws.current && props.ws.current.readyState === WebSocket.OPEN) {
        // Send the summary message
        const summaryWSMessage = {
          type: 'message',
          senderId: props.myuid,
          senderName: props.senderName,
          recipientId: props.user.uid,
          text: JSON.stringify(summaryMessage),
          timestamp: time,
          isSpecial: true,
          specialType: "venuesSummary"
        };
        
        props.ws.current.send(JSON.stringify(summaryWSMessage));
        
        // Send the full data message
        const fullWSMessage = {
          type: 'message',
          senderId: props.myuid,
          senderName: props.senderName,
          recipientId: props.user.uid,
          text: JSON.stringify(venuesData),
          timestamp: time,
          isSpecial: true,
          specialType: "venues",
          hidden: true
        };
        
        props.ws.current.send(JSON.stringify(fullWSMessage));
      }
      
    } catch (error) {
      console.error("Error finding sports venues:", error);
      
      // Send error message
      const time = new Date();
      const errorMessage = { 
        type: "venueError", 
        message: "Sorry, I couldn't find sports venues at this time. Let's try again later!" 
      };
      
      props.setMessages((prev) => [...prev, { 
        sender: true, 
        message: JSON.stringify(errorMessage), 
        timestamp: time,
        isSpecial: true,
        specialType: "venueError"
      }]);
      
      if (props.ws.current && props.ws.current.readyState === WebSocket.OPEN) {
        const newMessage = {
          type: 'message',
          senderId: props.myuid,
          senderName: props.senderName,
          recipientId: props.user.uid,
          text: JSON.stringify(errorMessage),
          timestamp: time,
          isSpecial: true,
          specialType: "venueError"
        };
        
        props.ws.current.send(JSON.stringify(newMessage));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const openMapLocation = (address) => {
    const encodedAddress = encodeURIComponent(address);
    const url = Platform.select({
      ios: `maps:0,0?q=${encodedAddress}`,
      android: `geo:0,0?q=${encodedAddress}`
    });
    
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        // Fallback to Google Maps web URL
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`);
      }
    });
  };

  const getSportIcon = (sportName) => {
    const sportIcons = {
      'Golf': '🏌️',
      'Tennis': '🎾',
      'Basketball': '🏀',
      'Soccer': '⚽',
      'Baseball': '⚾',
      'Football': '🏈',
      'Volleyball': '🏐',
      'Hockey': '🏒',
      'Pickleball': '🏓',
      'Swimming': '🏊',
      'Running': '🏃',
      'Cycling': '🚴',
      'Hiking': '🥾',
      'Skiing': '⛷️',
      'Snowboarding': '🏂',
      'Yoga': '🧘',
      'Weightlifting': '🏋️',
      'CrossFit': '💪',
      'Boxing': '🥊',
      'Martial Arts': '🥋'
    };
    
    return sportIcons[sportName] || '🏆';
  };

  const parseSpecialMessage = (item) => {
    try {
      if (!item.isSpecial) return null;
      
      const data = JSON.parse(item.message);
      
      if (item.specialType === "venues" && !item.hidden && data.venues) {
        return (
          <View style={styles.venuesContainer}>
            <Text style={styles.venuesTitle}>Places to Play Together</Text>
            
            {Object.entries(data.venues).map(([sport, venues], sportIndex) => (
              <View key={`sport-${sportIndex}`} style={styles.sportSection}>
                <View style={styles.sportHeaderContainer}>
                  <Text style={styles.sportIcon}>{getSportIcon(sport)}</Text>
                  <Text style={styles.sportName}>{sport}</Text>
                </View>
                
                {venues.map((venue, venueIndex) => (
                  <View key={`venue-${venueIndex}`} style={styles.venueCard}>
                    <Text style={styles.venueName}>{venue.name}</Text>
                    <Text style={styles.venueAddress}>{venue.address}</Text>
                    
                    {venue.distance && (
                      <Text style={styles.venueDistance}>{venue.distance}</Text>
                    )}
                    
                    {venue.otherSports && venue.otherSports.length > 0 && (
                      <View style={styles.otherSportsContainer}>
                        <Text style={styles.otherSportsLabel}>Also offers: </Text>
                        <View style={styles.otherSportsList}>
                          {venue.otherSports.map((otherSport, sportIdx) => (
                            <View key={`other-${sportIdx}`} style={styles.otherSportBadge}>
                              <Text style={styles.otherSportText}>
                                {getSportIcon(otherSport)} {otherSport}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                    
                    <TouchableOpacity
                      style={styles.directionButton}
                      onPress={() => openMapLocation(venue.address)}
                    >
                      <Text style={styles.directionButtonText}>Get Directions</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ))}
          </View>
        );
      } else if (item.specialType === "venuesSummary" && data.fullData) {
        // Render a compact summary card that can be tapped to view details
        return (
          <TouchableOpacity 
            style={styles.venueSummaryCard}
            onPress={() => {
              setExistingVenuesData(data.fullData);
              setVenuesModalVisible(true);
            }}
          >
            <View style={styles.venueSummaryIconContainer}>
              <Text style={styles.venueSummaryIcon}>🏆</Text>
            </View>
            <View style={styles.venueSummaryContent}>
              <Text style={styles.venueSummaryText}>{data.message}</Text>
            </View>
          </TouchableOpacity>
        );
      } else if (item.specialType === "noVenues" || item.specialType === "venueError") {
        return (
          <View style={styles.noVenuesContainer}>
            <Text style={styles.noVenuesText}>{data.message}</Text>
          </View>
        );
      }
      
      return null;
    } catch (error) {
      console.error("Error parsing special message:", error);
      return null;
    }
  };

  const renderVenuesModal = () => {
    if (!existingVenuesData || !existingVenuesData.venues) return null;
    
    return (
      <Modal
        visible={venuesModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setVenuesModalVisible(false)}
      >
        <View style={styles.venuesModalContainer}>
          <View style={styles.venuesModalContent}>
            <View style={styles.venuesModalHeader}>
              <Text style={styles.venuesModalTitle}>Places to Play Together</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setVenuesModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={Object.entries(existingVenuesData.venues)}
              keyExtractor={(item, index) => `sport-${index}`}
              style={styles.venuesModalList}
              renderItem={({ item: [sport, venues] }) => (
                <View style={styles.sportSection}>
                  <View style={styles.sportHeaderContainer}>
                    <Text style={styles.sportIcon}>{getSportIcon(sport)}</Text>
                    <Text style={styles.sportName}>{sport}</Text>
                  </View>
                  
                  {venues.map((venue, venueIndex) => (
                    <View key={`venue-${venueIndex}`} style={styles.venueCard}>
                      <Text style={styles.venueName}>{venue.name}</Text>
                      <Text style={styles.venueAddress}>{venue.address}</Text>
                      
                      {venue.distance && (
                        <Text style={styles.venueDistance}>{venue.distance}</Text>
                      )}
                      
                      {venue.otherSports && venue.otherSports.length > 0 && (
                        <View style={styles.otherSportsContainer}>
                          <Text style={styles.otherSportsLabel}>Also offers: </Text>
                          <View style={styles.otherSportsList}>
                            {venue.otherSports.map((otherSport, sportIdx) => (
                              <View key={`other-${sportIdx}`} style={styles.otherSportBadge}>
                                <Text style={styles.otherSportText}>
                                  {getSportIcon(otherSport)} {otherSport}
                                </Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}
                      
                      <TouchableOpacity
                        style={styles.directionButton}
                        onPress={() => openMapLocation(venue.address)}
                      >
                        <Text style={styles.directionButtonText}>Get Directions</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            />
          </View>
        </View>
      </Modal>
    );
  };

  const renderMessage = useCallback(({ item }) => {
    // Skip messages with the full venue data - we only want to show the summary in chat
    if (item.specialType === "venues") return null;
    
    // Skip other hidden messages
    if (item.hidden) return null;
    
    // Check if it's a special message (summary message)
    if (item.isSpecial) {
      const specialContent = parseSpecialMessage(item);
      if (specialContent) {
        return (
          <View
            style={[
              styles.specialMessageContainer,
              item.sender ? styles.mySpecialMessage : styles.theirSpecialMessage,
            ]}
          >
            {specialContent}
            <Text style={[styles.timestamp, {padding: 10}, item.sender ? {textAlign: "right"} : {textAlign: "left"}]}>
              {formattedDate(item.timestamp)}
            </Text>
          </View>
        );
      }
    }
    
    // Regular text message
    return (
      <View
        style={[
          styles.messageContainer,
          item.sender
            ? styles.myMessage
            : styles.theirMessage,
        ]}
      >
        <Text style={styles.messageText}>{item.message}</Text>
        <Text style={[styles.timestamp, item.sender ? {textAlign: "right"} : {textAlign: "left"}]}>
          {formattedDate(item.timestamp)}
        </Text>
      </View>
    );
  }, []);

  const formattedDate = (timestamp) => {
    const date = new Date(timestamp);

    const month = date.getMonth() + 1;
    const day = date.getDate();
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const isPM = hours >= 12;

    hours = hours % 12 || 12;

    const formattedMinutes = minutes.toString().padStart(2, '0');

    return `${month}/${day} ${hours}:${formattedMinutes} ${isPM ? 'PM' : 'AM'}`;
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => props.setUser(null)} style={styles.backButtonContainer}>
          <Text style={styles.backButton}>{"< Back"}</Text>
        </TouchableOpacity>

        <View style={styles.profileContainer}>
          <RetryableImage
            style={styles.profileImage}
            uri={props.user.media[0].uri}
          />
          <Text style={styles.userName}>
            {props.user.profile.firstName} {props.user.profile.lastName}
          </Text>
        </View>

        <TouchableOpacity 
          onPress={() => setMenuVisible(true)} 
          style={styles.menuButtonContainer}
        >
          <Text style={styles.menuButton}>{"..."}</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1, paddingBottom: 10 }}>
        <FlatList
          ref={flatListRef}
          data={messages?.slice().reverse()} // Reverse the messages array
          renderItem={renderMessage}
          keyExtractor={(item) => item.timestamp.toString() + item.sender.toString() + item.specialType?.toString()}
          style={styles.messageList}
          inverted={true} // Inverts the list
        />
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.messageInput}
          value={messageInput}
          onChangeText={setMessageInput}
          placeholder="Type a message..."
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>

      {/* Loader Overlay */}
      {isLoading && (
        <View style={styles.loaderOverlay}>
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={config.app.theme.blue} />
            <Text style={styles.loaderText}>Finding places to play...</Text>
          </View>
        </View>
      )}

      {/* Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menuContainer}>
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={handleFindPlacesToPlay}
              disabled={isLoading}
            >
              <Text style={styles.menuItemText}>
                {isLoading ? 'Finding Places...' : 'Find Places to Play'}
              </Text>
            </TouchableOpacity>
            
            <View style={styles.menuSeparator} />
            
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={handleUnmatch}
            >
              <Text style={styles.menuItemTextDanger}>Unmatch</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Venues Modal */}
      {renderVenuesModal()}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    marginTop: "5%",
  },
  header: {
    height: Dimensions.get("window").height * 0.2,
    alignItems: "center",
    justifyContent: "center",
    position: "relative", // Allows absolute positioning within the header
  },
  backButtonContainer: {
    position: "absolute",
    left: 10,
  },
  backButton: {
    fontSize: 16,
  },
  menuButtonContainer: {
    position: "absolute",
    right: 15,
    top: 15,
    padding: 10
  },
  menuButton: {
    fontSize: 24,
    fontWeight: "bold",
  },
  profileContainer: {
    alignItems: "center",
  },
  profileImage: {
    borderRadius: Dimensions.get("window").width * 0.1,
    height: Dimensions.get("window").width * 0.2,
    width: Dimensions.get("window").width * 0.2,
  },
  userName: {
    fontSize: 20,
    fontWeight: "200",
    marginTop: 10,
  },
  messageList: {
    flex: 1,
    padding: 10,
  },
  messageContainer: {
    padding: 10,
    marginTop: 10,
    borderRadius: 10,
    maxWidth: '80%',
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#d1e7ff",
  },
  theirMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#f1f1f1",
  },
  messageText: {
    fontSize: 16,
  },
  timestamp: {
    fontSize: 12,
    color: "gray",
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    backgroundColor: config.app.theme.creme,
  },
  messageInput: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: config.app.theme.blue,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  // Special message for venues
  specialMessageContainer: {
    marginTop: 10,
    borderRadius: 10,
    width: '90%',
    overflow: 'hidden',
  },
  mySpecialMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#d1e7ff",
  },
  theirSpecialMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#f1f1f1",
  },
  // Venues UI
  venuesContainer: {
    padding: 10,
  },
  venuesTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  sportSection: {
    marginBottom: 12,
    marginTop: 30
  },
  sportHeaderContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  sportIcon: {
    fontSize: 18,
    marginRight: 5,
  },
  sportName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  venueCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  venueName: {
    fontSize: 15,
    fontWeight: "bold",
  },
  venueAddress: {
    fontSize: 13,
    color: "#555",
    marginTop: 2,
  },
  venueDistance: {
    fontSize: 12,
    color: "#777",
    marginTop: 4,
  },
  otherSportsContainer: {
    marginTop: 6,
  },
  otherSportsLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#555",
  },
  otherSportsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 3,
  },
  otherSportBadge: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 5,
    marginBottom: 5,
  },
  otherSportText: {
    fontSize: 11,
    color: "#666",
  },
  directionButton: {
    backgroundColor: config.app.theme.blue,
    borderRadius: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  directionButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  // Venue Summary Card
  venueSummaryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  venueSummaryIconContainer: {
    marginRight: 10,
  },
  venueSummaryIcon: {
    fontSize: 20,
  },
  venueSummaryContent: {
    flex: 1,
  },
  venueSummaryText: {
    fontSize: 14,
    color: "#333",
  },
  // No Venues Message
  noVenuesContainer: {
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  noVenuesText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  // Menu Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
  },
  menuContainer: {
    width: Dimensions.get("window").width * 0.6,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginTop: Dimensions.get("window").height * 0.1,
    marginRight: 15,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuItem: {
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  menuItemText: {
    fontSize: 16,
    color: "#333",
  },
  menuItemTextDanger: {
    fontSize: 16,
    color: "#e74c3c",
  },
  menuSeparator: {
    height: 1,
    backgroundColor: "#e0e0e0",
  },
  // Loading Overlay
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  loaderContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    width: Dimensions.get("window").width * 0.8,
  },
  loaderText: {
    fontSize: 16,
    marginTop: 10,
    color: "#333",
  },
  // Venues Modal
  venuesModalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  venuesModalContent: {
    width: Dimensions.get("window").width * 0.9,
    height: Dimensions.get("window").height * 0.8,
    backgroundColor: "#fff",
    borderRadius: 10,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  venuesModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    backgroundColor: config.app.theme.blue,
  },
  venuesModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    lineHeight: 24,
  },
  venuesModalList: {
    flex: 1,
    padding: 15,
  }
});

export default Chat;