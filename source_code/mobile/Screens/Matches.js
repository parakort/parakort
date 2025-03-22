import React from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { MessageCircle } from 'lucide-react-native';
import styles from '../styles.js';
import Match from '../Components/Match.js';
import Chat from './Chat.js';

const Matches = (props) => {
  // Display chat if we are chatting
  if (props.user) {
    return (
      <Chat 
        me={props.media.get(props.myuid)} 
        unmatch={props.unmatch} 
        senderName={`${props.media.get(props.myuid).profile.firstName} ${props.media.get(props.myuid).profile.lastName}`} 
        messages={props.messages} 
        setMessages={props.setMessages} 
        loadMessages={props.loadMessages} 
        connectWs={props.connectWs} 
        ws={props.ws} 
        myuid={props.myuid} 
        serverUrl={props.serverUrl} 
        user={props.user} 
        setUser={props.setUser} 
        showPaywall={props.showPaywall}
      />
    );
  }



if (props?.matches?.filter((match) => match.mutual).length === 0 ) {
  return (
     <View style={styles.screen}>
                <Text style={{ fontSize: 25, fontWeight: '100', paddingBottom: 10 }}>My Matches</Text>
      
  <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No matches yet.</Text>
              <Text style={styles.emptySubtext}>Get to swiping, & check back soon!</Text>
            </View></View>)
}
 // Show loading state when matches aren't yet available
else if (!props?.matches || (props.matches.filter((match) => match.mutual).length > 0 && !props.matches.some(match => (props.media.get(match.uid) && match.mutual)))) {
  return (
    <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
      <ActivityIndicator size="large" color="#FFFFF1" />
      <Text style={{ marginTop: 20, fontSize: 16, color: 'black' }}>Loading your matches...</Text>
    </View>
  );
}


  // Sort matches: unread first, then by timestamp in descending order
  const sortedMatches = props.matches
    .filter(match => match.mutual) // Filter to include only matches with mutual: true
    .sort((a, b) => {
      // First sort by unread status
      if (a.unread && !b.unread) return -1;
      if (!a.unread && b.unread) return 1;
      // Then sort by timestamp
      return b.timestamp - a.timestamp;
    });

  return (
    <View style={styles.screen}>
      <Text style={{ fontSize: 25, fontWeight: '100', paddingBottom: 10 }}>
        My Matches
      </Text>
      <FlatList
        data={sortedMatches}
        keyExtractor={(item, index) =>index.toString()}
        contentContainerStyle={{ gap: 10, paddingBottom: 20 }}
        renderItem={({ item }) => (
          <Match
            match={item.uid}
            media={props?.media.get(item.uid)}
            onPress={() => props.setUser({ ...props?.media.get(item.uid), uid: item.uid })}
            myid={props.myuid}
            unread={item.unread}
            UnreadIcon={<MessageCircle size={18} color="#1e88e5" fill="#e3f2fd" />}
          />
        )}
      />
    </View>
  );
};

export default Matches;

