import { Text, View, Image, TouchableOpacity } from "react-native"
import styles from '../styles.js';
import config from "../app.json"


const NoUsers = (props) => {

    return (
        <View style = {styles.screen}>

            <View style = {{display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%"}}>
                <View style = {{display: "flex", alignItems: "center"}}>
                    <Image
                        source={require('../assets/alone.png')}
                        style={{height: 140, marginTop: 20 }}
                        resizeMode="contain" // Ensures the image fits within its bounds
                    />
                    <Text style = {{fontSize: 30, fontWeight: "100", marginTop: 20}}>No users found!</Text>
                </View>

                <View style = {{alignItems: "center"}}>
                    <Text style = {{fontSize: 20, fontWeight: 200}}>Try changing your filters, or</Text>

                    <TouchableOpacity
                        style={[styles.buttonWithBorder, {width: "80%"}]}
                        onPress={() => {props.resumeSuggestLoop()}}
                        >
                        <Text style={{color: config.app.theme.blue}}>Try Again</Text>
                       
                    </TouchableOpacity>
                </View>

            </View>
        </View>
    )
}

export default NoUsers