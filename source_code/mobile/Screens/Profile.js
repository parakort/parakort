import React, { useState, useEffect } from 'react';
import { Platform, View, Text, StyleSheet, TextInput, TouchableWithoutFeedback, Keyboard, Switch, TouchableOpacity, Alert, SafeAreaView, Image, Dimensions, KeyboardAvoidingView } from 'react-native';
import config from '../app.json'
import Media from '../Components/Media';
import SkillPicker from '../Components/SkillPicker';
import SocialModal from '../Components/SocialModal';



const Profile = (props) => {
  {
    const quick_delete = false;

    // Keybaord open, then hide stuff to fix android bug    
    const [isKeyboardOpen, setKeyboardOpen] = useState(false);
    const [isModalVisible, setModalVisible] = useState(false);
    const [curPlatform, setCurPlatform] = useState('penis') // platform to change link to

    const screenWidth = Dimensions.get('window').width;
    const imageSize = screenWidth * 0.3;
    const borderRadius = imageSize / 2;

    const [curPage, setCurPage] = useState(0)

    const [bio, setBio] = useState(props.profile.bio)
    // This is a cosmetic copy of our profile pics.
    // Do not change this directly - it is changed by the Media component
    // to display changes immediately, and is not persisted.
    const [media, setMedia] = useState(props.media.get(props.user._id)? props.media.get(props.user._id).media : [])

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
          username = {props.profile.socials[curPlatform] ? props.profile.socials[curPlatform] : ""}
        />

          {/* Profile pic and name */}
          <View style={styles.imagecontainer}>
            <Image
              source={media[0] ? { uri: media[0].uri } : require('../assets/notfound.jpg')}
              style={{
                  width: imageSize,
                  height: imageSize,
                  borderRadius: borderRadius,
              }}
              resizeMode="cover"
            />
            <Text style = {{fontSize: 20, color: config.app.theme.creme}}>{props.profile.firstName}</Text>
          </View>
          
          {/* 3 page tabs (navbar): Profile, Filters, Settings */}
          <View style = {{display: "flex", flexDirection: "row", justifyContent: "space-between", marginVertical: 20}}>
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


    {/* Profile view (bio, media, sport settings) */}
          {curPage == 0 && 
          (
          <View style = {styles.spreadContainer}>
            {/* Upper container */}
            <View style = {{gap: 20}}>
              
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

              <View>
                  <Text style={styles.label}>Modify bio</Text>
                  <TextInput
                  style={[styles.input, styles.bioInput]}
                  placeholder="Your bio"
                  value={bio}
                  onChangeText={(text) => setBio(text)}
                  maxLength={300}
                  multiline={false}
                  returnKeyType="done"
                  onEndEditing={() => { props.updateProfile("bio", bio)}}
                  />
              </View>

              
            </View>
            

              

              <View style={styles.mediaContainer}>
                <Text style={styles.label}>Modify Images</Text>
                <Media media = {media} onSubmitMedia = {onSubmitMedia} onRemoveMedia = {onRemoveMedia}></Media>
              </View>
            </View>
          )}

          {/* Filter view (sport levels, age, etc) */}

          {curPage == 1 &&
          (
            <View>
              {/* Skills for each sport */}
              <Text style={styles.label}>My Skill Levels</Text>

              {/* Render each skill component from the array of sports */}
              {props.filters.sports.map((sport, index) => (
                <SkillPicker updateFilter = {props.updateFilter} key={index} index = {index} sport = {sport} />
              ))}
            </View>
          )}


          {/* Settings View */}
          {curPage == 2 && 
          (
          <View style = {styles.spreadContainer}>

            <View>

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
          )}
          

            

          
        
        </SafeAreaView>
        
        
      </TouchableWithoutFeedback>
    );
  }
};

const styles = StyleSheet.create({
  iconContainer: {

    display: "flex",
    flexDirection: "row",
    justifyContent: "space-evenly"
  },
  icon: { 
    
    width: "32%",
    height: "auto",
    aspectRatio: 1,
    alignSelf: "center",
  },
  mediaContainer: {
    marginTop: 20,
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
    marginBottom: 20,
    backgroundColor: config.app.theme.creme
  },
  bioInput: {
    textAlignVertical: 'top',
  },
  imagecontainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  container: {
    flex: 1,
    margin: 10,
    
  },

  spreadContainer: {
    justifyContent: 'space-between', // Pushes content and buttons to the top and bottom, respectively
    flex: 1,
  },
  logoText: {
    fontSize: Platform.OS === 'ios' && Platform.isPad ? 60 : 40,
    fontWeight: "100",
    marginTop: Platform.OS === 'ios' && Platform.isPad ? 250 : 150 ,
    marginBottom: 30,
    textAlign: "center",
  },
  errorText: {
    fontSize: Platform.OS === 'ios' && Platform.isPad ? 24 : 18 ,
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
    margin:3,
  },
  preferencesContainer: {
    flex: 1, // Takes up available space in the container
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Platform.OS === 'ios' && Platform.isPad ? 30 : 10
  },
});

export default Profile;
