import React, { useState, useEffect } from 'react';
import { Platform, View, Text, StyleSheet, TextInput, TouchableWithoutFeedback, Keyboard, Switch, TouchableOpacity, Alert, SafeAreaView, Image, Dimensions, KeyboardAvoidingView, ScrollView, ActivityIndicator } from 'react-native';
import config from '../app.json'
import Media from '../Components/Media';
import SkillPicker from '../Components/SkillPicker';
import SocialModal from '../Components/SocialModal';
import DemographicPicker from '../Components/DemographicPicker'
import RetryableImage from '../Components/RetryableImage';
import Subscribe from '../Components/Subscribe';
import LocationSettings from '../Components/LocationSettings';


const Profile = (props) => {
  {
    const quick_delete = false;

    // Keybaord open, then hide stuff to fix android bug    
    const [isKeyboardOpen, setKeyboardOpen] = useState(false);
    const [isModalVisible, setModalVisible] = useState(false);
    const [curPlatform, setCurPlatform] = useState('') // platform to change link to

    const screenWidth = Dimensions.get('window').width;
    const screenHeight = Dimensions.get('window').height;
    const imageSize = screenWidth * 0.3;
    const borderRadius = imageSize / 2;

    const [curPage, setCurPage] = useState(0)
    const [curFilter, setCurFilter] = useState(0)

    const [bio, setBio] = useState(null)
    // This is a cosmetic copy of our profile pics.
    // Do not change this directly - it is changed by the Media component
    // to display changes immediately, and is not persisted.
    const [media, setMedia] = useState(props.media.get(props.user._id)?.media || []);

useEffect(() => {
  let retries = 0;
  const maxRetries = 10;
  
  const tryGetMedia = () => {
    const mediaContent = props.media.get(props.user._id)?.media;
    if (mediaContent) {
      setMedia(mediaContent);
      return true;
    }
    
    if (retries < maxRetries) {
      retries++;
      setTimeout(tryGetMedia, 300); // Retry after 300ms
      return false;
    }
    
    return false;
  };
  
  // Start the retry mechanism if initial media is empty
  if (!media || media.length === 0) {
    tryGetMedia();
  }
}, [props.media, props.user._id, media]);

useEffect(() => {
  if (props.profile?.bio && bio === null){
    setBio(props.profile.bio)
  }

}, [props.profile])
    

    useEffect(() => {
      const keyboardDidShowListener = Keyboard.addListener(
        'keyboardDidShow',
        () => {
          setKeyboardOpen(true);
        }
      );
      const keyboardDidHideListener = Keyboard.addListener(
        'keyboardDidHide',
        () => {
          setKeyboardOpen(false);
        }
        
      );

      return () => {
        keyboardDidShowListener.remove();
        keyboardDidHideListener.remove();
      };
    }, []);

    // For deletion:
    const [password, setPassword] = useState('');
    const [delAccount, setDelAccount] = useState(false);

    // When clicking on a social icon to link our account
    function updateSocial(selected_platform)
    {
      setCurPlatform(selected_platform)
      setModalVisible(true)
    }

    // Undo dislikes
    function handleUndoDislikes()
    {
      props.updateField("dislikes", [])
    }


    

    const handleLogout = () => {
      // Show confirmation dialog before logging out
      Alert.alert(
        'Logout',
        'Are you sure you want to log out?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'OK', onPress: () => {
            props.logout()
          } 
        },
        ],
        { cancelable: false }
      );
    };

    const handleDeletion = () => {
      if (quick_delete)
      {
        props.deleteAccount("123")
      }
      else
      {
        // Show confirmation dialog before deleting
        Alert.alert(
          'Delete Account',
          'Are you sure you want to delete your account?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'OK', onPress: () => props.deleteAccount(password) },
          ],
          { cancelable: false }
        );
      }
      
    };

    // Called when we delete a media item from the media component
    function onRemoveMedia(index)
    {
      // Cosmetic (immediate)
      setMedia((prevItems) => prevItems.filter((_, i) => i !== index));

      // This is the grand effect, not just cosmetic
      // (the actual deletion)
      props.updateMedia(index)
    }

    // Called when media component for the Profile gets a new piece of media
    function onSubmitMedia(index, new_media)
    {
      // Update the media locally on the component
      // this is immediate, and cosmetic only
      setMedia((prevState) => [
        ...prevState.slice(0, index), 
        new_media, 
        ...prevState.slice(index + 1)
      ]);

      // This is the grand effect, not just cosmetic
      props.updateMedia(index, new_media)
    }

    // Changing navigation page
    function handleNavPress(page)
    {
      if (curPage !== page) setCurPage(page)
    }

    // Changing navigation page for filters
    function handleFilterNav(page)
    {
      if (curFilter !== page) setCurFilter(page)
    }

    // Show subscribe page if paywall is true
    if (props.paywall){
      return(
        <Subscribe 
          Purchases={props.Purchases}
          purchase={props.purchase}
          subscriptionTier = {props.subscriptionTier}
          close = {() => props.setPaywall(false)}
          selectedTier = {props.selectedTier}
          setSelectedTier = {props.setSelectedTier}
        />
      )
    }

    if (!props.profile)
    {
      return (
        <SafeAreaView style={styles.loadingContainer}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color={config.app.theme.blue} />
            <Text style={styles.loadingText}>Hang tight! We're setting up your account...</Text>
            <View style={styles.loadingAnimation}>
              <Image 
                source={require('../assets/parakort-trans.png')} 
                style={styles.loadingImage}
              />
            </View>
          </View>
        </SafeAreaView>
      );
    }
    
    // Show delete page if deleting
    if (delAccount)
    {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.loginFormView}>
            <Text style={styles.logoText}>Delete Your Account</Text>
            <TextInput
              placeholder="Please confirm your password"
              placeholderColor="#c4c3cb"
              style={styles.loginFormTextInput}
              autoCapitalize="none"
              secureTextEntry={true}
              autoCorrect= {false}
              onChangeText={(text) => {setPassword(text)}}
            />
            

          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.buttonWithBorder}
              onPress={() => {handleDeletion()}}
            >
              <Text style={styles.buttonText}>Confirm Deletion</Text>
            </TouchableOpacity>

         

            <TouchableOpacity
              style={styles.buttonWithBorder}
              onPress={()=> {setDelAccount(false)}}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>

      )
    }

    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView style={styles.container}>
        <SocialModal
          isVisible={isModalVisible}
          onClose={() => setModalVisible(false)}
          provider = {curPlatform}
          updateProfile = {props.updateProfile}
          // Current username
          username = {props.profile.socials ? (props.profile.socials[curPlatform] ? props.profile.socials[curPlatform] : "") : ""}
        />

          {/* Profile pic and name */}
          <View style={styles.imagecontainer}>
            <RetryableImage
              uri={media[0] ? media[0].uri  : require('../assets/notfound.jpg')}
              style={{
                  width: imageSize,
                  height: imageSize,
                  borderRadius: borderRadius,
              }}
              resizeMode="cover"
            />
            <Text style = {{fontSize: 20, color: config.app.theme.creme}}>{props.profile.firstName} {props.subscriptionTier? `(${props.subscriptionTier})` : ""}</Text>
            {props.subscriptionTier !== "Elite" && (
            <Text>{props.tokens} tokens</Text>
            )}
          </View>
          
          {/* 3 page tabs (navbar): Profile, Filters, Settings */}
          <View style={styles.navContainer}>
            <TouchableOpacity
                style={{...styles.navButton, backgroundColor: curPage == 0 ? '#2f2e2e': '#e0e0e0'}}
                onPress={() => handleNavPress(0)}
              >
              <Text style={{...styles.navButtonText, color: curPage == 0 ? config.app.theme.creme : config.app.theme.gray}}>Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={{...styles.navButton, backgroundColor: curPage == 1 ? config.app.theme.black: config.app.theme.grey}}
                onPress={() => handleNavPress(1)}
              >
              <Text style={{...styles.navButtonText, color: curPage == 1 ? config.app.theme.creme : config.app.theme.gray}}>Filters</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={{...styles.navButton, backgroundColor: curPage == 2 ? config.app.theme.black: config.app.theme.grey}}
                onPress={() => handleNavPress(2)}
              >
              <Text style={{...styles.navButtonText, color: curPage == 2 ? config.app.theme.creme : config.app.theme.gray}}>Settings</Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            contentContainerStyle={styles.scrollViewContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Profile view (bio, media, sport settings) */}
            {curPage == 0 && (
              <View style={styles.pageContainer}>
                {/* Upper container */}
                <View style={styles.upperContainer}>
                  <View style={styles.iconContainer}>
                    <TouchableOpacity onPress={() => updateSocial("instagram")}>
                      <Image style={styles.icon} source={require('../assets/social-icons/instagram.png')} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity onPress={() => updateSocial("linkedin")}>
                      <Image style={styles.icon} source={require('../assets/social-icons/linkedin.png')} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity onPress={() => updateSocial("facebook")}>
                      <Image style={styles.icon} source={require('../assets/social-icons/facebook.png')} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.bioContainer}>
                    <Text style={styles.label}>Modify bio</Text>
                    <TextInput
                      style={[styles.input, styles.bioInput]}
                      placeholder="Your bio"
                      value={bio}
                      onChangeText={(text) => setBio(text)}
                      maxLength={300}
                      multiline={true}
                      returnKeyType="done"
                      onEndEditing={() => { props.updateProfile("bio", bio)}}
                    />
                  </View>

                  {/* Enhanced Premium Button */}
                  <View style={styles.premiumButtonContainer}>
                    <TouchableOpacity
                      style={styles.premiumButton}
                      onPress={() => props.setPaywall(true)}
                    >
                      <View style={styles.premiumButtonContent}>
                        <View style={styles.premiumIconContainer}>
                          <Text style={styles.starIcon}>★</Text>
                        </View>
                        <View style={styles.premiumTextContainer}>
                          <Text style={styles.premiumButtonText}>View Plans</Text>
                          <Text style={styles.premiumButtonSubtext}>Get unlimited matches & more!</Text>
                        </View>
                        <View style={styles.arrowContainer}>
                          <Text style={styles.arrowIcon}>→</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.mediaContainer}>
                  <Text style={styles.label}>Modify Images</Text>
                  <Media media={media} onSubmitMedia={onSubmitMedia} onRemoveMedia={onRemoveMedia}></Media>
                </View>
              </View>
            )}

            {/* Filter view (sport levels, age, etc) */}
            {curPage == 1 && (
              <View style={styles.pageContainer}>
                {/* Filter navbar */}
                <View style={styles.filterNavContainer}>
                  <TouchableOpacity
                    style={{...styles.navButton, backgroundColor: curFilter == 0 ? '#2f2e2e': '#e0e0e0'}}
                    onPress={() => handleFilterNav(0)}
                  >
                    <Text style={{...styles.navButtonText, color: curFilter == 0 ? config.app.theme.creme : config.app.theme.gray}}>Skills</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{...styles.navButton, backgroundColor: curFilter == 1 ? config.app.theme.black: config.app.theme.grey}}
                    onPress={() => handleFilterNav(1)}
                  >
                    <Text style={{...styles.navButtonText, color: curFilter == 1 ? config.app.theme.creme : config.app.theme.gray}}>People</Text>
                  </TouchableOpacity>
                </View>

                {/* Demographics */}
                {curFilter == 1 && (
                  <View style={styles.filterContentContainer}>
                    <Text style={styles.label}>Demographics</Text>
                    <DemographicPicker 
                      radius={props.filters.radius} 
                      updateFilter={props.updateFilter} 
                      age={props.filters.age} 
                      female={props.filters.female} 
                      male={props.filters.male}
                    />
                  </View>
                )}
                
                {/* Skills for each sport */}
                {curFilter == 0 && (
  <View style={styles.filterContentContainer}>
    <Text style={styles.label}>My Skill Levels</Text>
    <View style={styles.skillsListContainer}>
      {props.filters.sports.map((sport, index) => (
        <SkillPicker 
          updateFilter={props.updateFilter} 
          key={index} 
          index={index} 
          sport={sport} 
        />
      ))}
    </View>
  </View>
)}
              </View>
            )}

            {/* Settings View */}
            {curPage == 2 && (
              <View style={styles.pageContainer}>
                <View style={styles.settingsContainer}>
                  {(props.subscriptionTier === "Premium" || props.subscriptionTier === "Elite") && (
                    <LocationSettings 
                      updateProfile={props.updateProfile} 
                      currentLocation={props.profile.location} 
                      setLocation={props.setLocation}
                    />
                  )}
                </View>

                {/* Bottom container */}
                <View style={styles.bottomButtonsContainer}>
                  <View style={styles.buttonContainer}>
                    <TouchableOpacity
                      style={styles.buttonWithBorder}
                      onPress={handleUndoDislikes}
                    >
                      <Text style={styles.buttonText}>Undo Dislikes</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.buttonContainer}>
                    <TouchableOpacity
                      style={styles.buttonWithBorder}
                      onPress={handleLogout}
                    >
                      <Text style={styles.buttonText}>Logout</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.buttonWithBorder}
                      onPress={() => {setDelAccount(true)}}
                    >
                      <Text style={styles.buttonText}>Delete Account</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    );
  }
};

const styles = StyleSheet.create({
  // Loading screen styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
    padding: 20,
  },
  loadingContent: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 22,
    fontWeight: '600',
    color: config.app.theme.creme,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  loadingAnimation: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  loadingImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: config.app.theme.blue,
  },
  // Existing styles
  skillsListContainer: {
    flex: 1,
    width: '100%',
  },
  container: {
    flex: 1,
    margin: 10,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  imagecontainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  navContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 15,
  },
  pageContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  upperContainer: {
    gap: 15,
  },
  bioContainer: {
    marginBottom: 5,
  },
  filterNavContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  filterContentContainer: {
    flex: 1,
  },
  settingsContainer: {
    flex: 1,
    marginBottom: 20,
  },
  bottomButtonsContainer: {
    marginTop: 'auto',
    paddingBottom: 10,
  },
  iconContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginVertical: 5,
  },
  icon: { 
    width: "32%",
    height: "auto",
    aspectRatio: 1,
    alignSelf: "center",
  },
  mediaContainer: {
    marginTop: 15,
    marginBottom: 20,
  },
  label: {
    fontSize: 18,
    fontWeight: '200',
    margin: 5,
  },
  input: {
    borderColor: config.app.theme.grey,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    backgroundColor: config.app.theme.creme
  },
  bioInput: {
    textAlignVertical: 'top',
    height: 75
  },
  spreadContainer: {
    justifyContent: 'space-between',
    flex: 1,
  },
  logoText: {
    fontSize: Platform.OS === 'ios' && Platform.isPad ? 60 : 40,
    fontWeight: "100",
    marginTop: Platform.OS === 'ios' && Platform.isPad ? 250 : 150,
    marginBottom: 30,
    textAlign: "center",
  },
  errorText: {
    fontSize: Platform.OS === 'ios' && Platform.isPad ? 24 : 18,
    fontWeight: "200",
    marginTop: 20,
    marginBottom: 30,
    marginHorizontal: 40,
    textAlign: "center",
  },
  loginFormTextInput: {
    height: 43,
    fontSize: Platform.OS === 'ios' && Platform.isPad ? 23 : 14,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#eaeaea",
    backgroundColor: "#fafafa",
    paddingLeft: 10,
    marginTop: 5,
    marginBottom: 5,
  },
  buttonWithBorder: {
    backgroundColor: config.app.theme.grey,
    padding: 15,
    margin: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  buttonText: {
    color: config.app.theme.red
  },
  navButton: {
    padding: 10,
    margin: 5,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  navButtonText: {
    
  },
  title: {
    fontSize: Platform.OS === 'ios' && Platform.isPad ? 22 : 15,
    alignSelf: 'center',
    fontWeight: 'bold',
    margin: 5,
  },
  switch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    margin: 3,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Platform.OS === 'ios' && Platform.isPad ? 20 : 8
  },
  
  // Premium button styles
  premiumButtonContainer: {
    marginVertical: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.5,
    elevation: 6,
  },
  premiumButton: {
    backgroundColor: "#1e1e1e",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: config.app.theme.red,
  },
  premiumButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  premiumIconContainer: {
    backgroundColor: "#FFD700",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  starIcon: {
    color: "#1e1e1e",
    fontSize: 20,
    fontWeight: 'bold',
  },
  premiumTextContainer: {
    flex: 1,
  },
  premiumButtonText: {
    color: "#FFD700",
    fontSize: 17,
    fontWeight: 'bold',
  },
  premiumButtonSubtext: {
    color: config.app.theme.creme,
    fontSize: 12,
    marginTop: 2,
  },
  arrowContainer: {
    backgroundColor: config.app.theme.red,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  arrowIcon: {
    color: config.app.theme.creme,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Profile;