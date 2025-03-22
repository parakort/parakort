import React, { useState, useEffect } from "react";
import axios from "axios";
import CodeEntry from "./CodeEntry";
import config from '../app.json';
import {
  Keyboard,
  KeyboardAvoidingView,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
  StyleSheet,
  Platform,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  Image
} from "react-native";
import { Button, Icon } from "react-native-elements";

// Device info handling logic
let Constants;
let deviceInfoModule;

if (__DEV__) {
  try {
    Constants = require('expo-constants');
    deviceInfoModule = Constants;
  } catch (error) {
    deviceInfoModule = require('react-native-device-info');
  }
} else {
  if (typeof Constants !== 'undefined') {
    deviceInfoModule = Constants;
  } else {
    deviceInfoModule = require('react-native-device-info');
  }
}

const { width, height } = Dimensions.get('window');
const isTablet = width > 768 || (Platform.OS === 'ios' && Platform.isPad);

// Theme colors
const theme = {
  red: "#F9063C",
  blue: "#849bff",
  creme: "#FFFFF1",
  grey: "#e0e0e0",
  gray: "#6f6f6f",
  black: "#2f2e2e"
};

export default function LoginScreen(props) {
  const isEmail = /^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [loginInProgress, setLoginInProgress] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [canResetPass, setCanResetPass] = useState(false);
  const [resetCode, setResetCode] = useState();
  const [emailv1, setEmailv1] = useState('');
  const [emailv2, setEmailv2] = useState('');
  const [pass1, setPass1] = useState('');
  const [pass2, setPass2] = useState('');
  const [status, setStatus] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [hidePassword, setHidePassword] = useState(true);
  const [hidePassword1, setHidePassword1] = useState(true);
  const [hidePassword2, setHidePassword2] = useState(true);

  useEffect(() => {
    const getDeviceId = async () => {
      let id;
      if (deviceInfoModule) {
        if (deviceInfoModule === Constants) {
          id = deviceInfoModule["default"]["manifest2"]["id"];
        } else {
          id = await deviceInfoModule.getUniqueId();
        }
      } else {
        id = 'Device ID not available';
      }
      setDeviceId(id);
    };
    getDeviceId();
  }, []);

  const toggleForgotPassword = () => {
    setForgotPassword(!forgotPassword);
    if (forgotPassword) {
      setEmailv1(email);
    }
    setStatus('');
  };

  const onLogRegPress = () => {
    setLoginInProgress(true);
    setStatus('Checking credentials...');

    axios.post(`${props.api}/log-or-reg`, {email: email, password: password, device: deviceId})
    .then((res) => {
      setStatus('Logging in...');
      props.login(res.data.token, res.data.new_user);
    })
    .catch((e) => {
      setLoginInProgress(false);
      if (e.response.status === 400) {
        setStatus('Incorrect password!');
      } else if (e.response.status === 422) {
        setStatus('Please enter the code sent to your email.');
        setShowCode(true);
      } else if (e.response.status === 404) {
        setStatus('User not found!');
      } else {
        setStatus('Error, please try again');
      }
    });
  };

  const onLoginPress = () => {
    setStatus('Attempting login...');
    axios.post(`${props.api}/login`, {email: email, password: password, device: deviceId})
    .then((res) => {
      setStatus('Logging in...');
      props.login(res.data.token, res.data.new_user);
    })
    .catch((e) => {
      if (e.response.status === 400) {
        setStatus('Incorrect password!');
      } else if (e.response.status === 422) {
        setStatus('Please enter the code sent to your email.');
        setShowCode(true);
      } else if (e.response.status === 404) {
        setStatus('User not found!');
      } else {
        setStatus('Error, please try again');
      }
    });
  };

  const onRegisterPress = () => {
    axios.post(`${props.api}/register`, {email: email, password: password})
    .then((res) => {
      setStatus('Success!');
      onLoginPress();
    })
    .catch((e) => {
      setStatus(e.response.data.message);
    });
  };

  const onFulfill = (code) => {
    axios.post(`${props.api}/confirmDevice`, {email: email, code: code})
    .then(async (res) => {
      if (forgotPassword) {
        setStatus('');
        setResetCode(code);
        setCanResetPass(true);
        setShowCode(false);
        setForgotPassword(false);
      } else {
        setStatus('Logging in...');
        props.login(res.data.token, res.data.new_user);
        
        if (res.data.new_user) {
          alert(config.app.welcome_msg);
        }
      }
    })
    .catch((e) => {
      if (e.response.status === 401) {
        setStatus('Incorrect code, please try again.');
      } else if (e.response.status === 429) {
        setStatus('Too many failures. Please login again.');
        setShowCode(false);
        setForgotPassword(false);
      } else {
        setStatus('Error, please try again later');
        setShowCode(false);
        setForgotPassword(false);
      }
    });
  };
  
  const resetPassword = () => {
    axios.post(`${props.api}/setNewPassword`, {resetCode: resetCode, pass: pass1, email: email})
    .then((res) => {
      props.login(res.data.token, res.data.new_user);
    })
    .catch((e) => {
      setStatus('Error updating password');
    });
  };

  const sendResetPassCode = () => {
    setEmail(emailv1);
    axios.post(`${props.api}/resetPassword`, {email: emailv1})
    .then((res) => {
      setStatus('Please enter the code sent to your email.');
      setShowCode(true);
    })
    .catch((e) => {
      setStatus('Could not find user');
    });
  };

  if (showCode) {
    return (
      <CodeEntry back={() => {setShowCode(false); setStatus("")}} fulfilled={onFulfill} status={status} />
    );
  }

  if (canResetPass) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView style={styles.containerView} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.loginScreenContainer}>
              <View style={styles.loginFormView}>
                <Text style={styles.logoText}>Reset Password</Text>
                
                <View style={styles.inputContainer}>
                  <Icon name="lock" type="feather" size={20} color={theme.gray} style={styles.inputIcon} />
                  <TextInput
                    placeholder="Enter new password"
                    placeholderTextColor={theme.gray}
                    secureTextEntry={hidePassword1}
                    style={styles.loginFormTextInput}
                    onChangeText={(text) => {setPass1(text); setStatus((text === pass2) ? '' : 'Passwords must match')}}
                  />
                  <TouchableOpacity onPress={() => setHidePassword1(!hidePassword1)} style={styles.eyeIcon}>
                    <Icon name={hidePassword1 ? "eye-off" : "eye"} type="feather" size={20} color={theme.gray} />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.inputContainer}>
                  <Icon name="lock" type="feather" size={20} color={theme.gray} style={styles.inputIcon} />
                  <TextInput
                    placeholder="Confirm new password"
                    placeholderTextColor={theme.gray}
                    secureTextEntry={hidePassword2}
                    style={styles.loginFormTextInput}
                    onChangeText={(text) => {setPass2(text); setStatus((pass1 === text) ? '' : 'Passwords must match')}}
                  />
                  <TouchableOpacity onPress={() => setHidePassword2(!hidePassword2)} style={styles.eyeIcon}>
                    <Icon name={hidePassword2 ? "eye-off" : "eye"} type="feather" size={20} color={theme.gray} />
                  </TouchableOpacity>
                </View>
                
                {status ? <Text style={styles.errorText}>{status}</Text> : null}
                
                <TouchableOpacity 
                  style={[styles.loginButton, (pass1 !== pass2) && styles.buttonDisabled]}
                  onPress={() => resetPassword()}
                  disabled={!(pass1 === pass2)}
                >
                  <Text style={styles.buttonText}>Change Password</Text>
                </TouchableOpacity>
                
                <View style={styles.bottomTextContainer}>
                  <Text onPress={() => setCanResetPass(false)} style={styles.bottomText}>Back to Login</Text>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  } else if (forgotPassword) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView style={styles.containerView} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.loginScreenContainer}>
              <View style={styles.loginFormView}>
                <Text style={styles.logoText}>Reset Password</Text>
                
                <View style={styles.inputContainer}>
                  <Icon name="mail" type="feather" size={20} color={theme.gray} style={styles.inputIcon} />
                  <TextInput
                    placeholder="Email"
                    placeholderTextColor={theme.gray}
                    style={styles.loginFormTextInput}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    onChangeText={(text) => {setEmailv1(text); setStatus((text === emailv2) ? '' : 'Please type the same email twice')}}
                  />
                </View>
                
                <View style={styles.inputContainer}>
                  <Icon name="mail" type="feather" size={20} color={theme.gray} style={styles.inputIcon} />
                  <TextInput
                    placeholder="Confirm Email"
                    placeholderTextColor={theme.gray}
                    style={styles.loginFormTextInput}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    onChangeText={(text) => {setEmailv2(text); setStatus((emailv1 === text) ? '' : 'Please type the same email twice')}}
                  />
                </View>
                
                {status ? <Text style={styles.errorText}>{status}</Text> : null}
                
                <TouchableOpacity 
                  style={[
                    styles.loginButton, 
                    !(isEmail.test(emailv1) && isEmail.test(emailv2) && (emailv1 === emailv2)) && styles.buttonDisabled
                  ]}
                  onPress={() => sendResetPassCode()}
                  disabled={!(isEmail.test(emailv1) && isEmail.test(emailv2) && (emailv1 === emailv2))}
                >
                  <Text style={styles.buttonText}>Send Reset Code</Text>
                </TouchableOpacity>
                
                <View style={styles.bottomTextContainer}>
                  <Text onPress={() => toggleForgotPassword()} style={styles.bottomText}>Back to Login</Text>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.containerView} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.loginScreenContainer}>
            <View style={styles.loginFormView}>
              <View style = {{display: 'flex', flexDirection: "column"}}>
              <Image
                  source={require('../assets/parakort-trans.png')}
                  style={{height: 100, width: 100, alignSelf: 'center' }}
              />
              <Text style={styles.logoText}>{config.expo.name}</Text>
              </View>
              <View style={styles.inputContainer}>
                <Icon name="mail" type="feather" size={20} color={theme.gray} style={styles.inputIcon} />
                <TextInput
                  placeholder="Email"
                  placeholderTextColor={theme.gray}
                  style={styles.loginFormTextInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  onChangeText={(text) => {setEmail(text); setStatus('')}}
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Icon name="lock" type="feather" size={20} color={theme.gray} style={styles.inputIcon} />
                <TextInput
                  placeholder="Password"
                  placeholderTextColor={theme.gray}
                  style={styles.loginFormTextInput}
                  secureTextEntry={hidePassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  onChangeText={(text) => {setPassword(text); setStatus('')}}
                />
                <TouchableOpacity onPress={() => setHidePassword(!hidePassword)} style={styles.eyeIcon}>
                  <Icon name={hidePassword ? "eye-off" : "eye"} type="feather" size={20} color={theme.gray} />
                </TouchableOpacity>
              </View>
              
              {status ? <Text style={styles.errorText}>{status}</Text> : null}
              
              <TouchableOpacity 
                style={[
                  styles.loginButton, 
                  (loginInProgress || !(isEmail.test(email) && password)) && styles.buttonDisabled
                ]}
                onPress={() => onLogRegPress()}
                disabled={loginInProgress || !(isEmail.test(email) && password)}
              >
                <Text style={styles.buttonText}>
                  {loginInProgress ? "Please wait..." : "Login / Sign-up"}
                </Text>
              </TouchableOpacity>
              
              <View style={styles.bottomTextContainer}>
                <Text onPress={() => toggleForgotPassword()} style={styles.bottomText}>
                  {!forgotPassword ? 'Forgot password' : 'Login'}
                </Text>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.creme,
  },
  containerView: {
    flex: 1,
    alignItems: "center"
  },
  loginScreenContainer: {
    flex: 1
  },
  logoText: {
    fontSize: Platform.OS === 'ios' && Platform.isPad ? 60 : 40,
    fontWeight: "100",
    marginBottom: 30,
    textAlign: "center",
    color: theme.black
  },
  errorText: {
    fontSize: Platform.OS === 'ios' && Platform.isPad ? 24 : 18,
    fontWeight: "200",
    marginTop: 20,
    marginBottom: 30,
    marginHorizontal: 40,
    textAlign: "center",
    color: theme.blue
  },
  loginFormView: {
    flex: 1,
    width: Platform.OS === 'ios' && Platform.isPad ? 600 : 350,
    marginTop: Platform.OS === 'ios' && Platform.isPad ? 100 : 50,

  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.grey,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#eaeaea",
    marginVertical: 5,
    height: Platform.OS === 'ios' && Platform.isPad ? 50 : 43,
    paddingHorizontal: 10,
  },
  inputIcon: {
    marginRight: 10,
  },
  eyeIcon: {
    padding: 8,
  },
  loginFormTextInput: {
    flex: 1,
    fontSize: Platform.OS === 'ios' && Platform.isPad ? 23 : 14,
    color: theme.black,
  },
  loginButton: {
    backgroundColor: theme.blue,
    borderRadius: 5,
    height: Platform.OS === 'ios' && Platform.isPad ? 50 : 45,
    marginTop: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: "black",
    opacity: 0.7,
  },
  buttonText: {
    color: theme.creme,
    fontSize: Platform.OS === 'ios' && Platform.isPad ? 23 : 16,
    fontWeight: "600",
  },
  bottomTextContainer: {
    flex: 1, 
    justifyContent: 'flex-end',
    alignItems: 'center', 
    marginBottom: 50
  },
  bottomText: {
    fontSize: Platform.OS === 'ios' && Platform.isPad ? 26 : 16,
    color: theme.blue,
  },
});