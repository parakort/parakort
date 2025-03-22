import { StyleSheet, Platform } from 'react-native';
import config from "./app.json"


export default StyleSheet.create({
    buttonText: {
    color: '#fff', // White color for text on the button
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    },
    demoButton: {
    backgroundColor: '#2196F3', // Blue color for Subscribe button
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 8,
    marginHorizontal: 8
    },
    modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
    width: '90%',
    height: '80%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    },
    title: {
    fontSize: Platform.OS === 'ios' && Platform.isPad ? 40 : 18,
    textAlign: 'center',
    },
    text: {
    fontSize: Platform.OS === 'ios' && Platform.isPad ? 25 : 18,
    textAlign: 'center',
    },
    
    closeButton: {
    alignSelf: 'center',
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'lightgray',
    },
titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
},
      
  screen: {
    flex:1,
    marginTop: 60,
    margin: '5%'
  },

  buttonWithBorder: {
    backgroundColor: config.app.theme.grey,
    padding: 15,
    margin: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyContainer: {
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: config.app.theme.creme,
    borderRadius: 16,
    shadowColor: config.app.theme.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginHorizontal: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: config.app.theme.black,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 16,
    color: config.app.theme.gray,
    marginTop: 8,
    textAlign: 'center',
  },
});
