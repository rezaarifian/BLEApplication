import {StyleSheet} from 'react-native';
import { Colors } from 'react-native/Libraries/NewAppScreen';

const boxShadow = {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  };
  
  const styles = StyleSheet.create({
    engine: {
      position: 'absolute',
      right: 10,
      bottom: 0,
      color: Colors.black,
    },
    buttonGroup: {
      flexDirection: 'row',
      width: '100%'
    },
    scanButton: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      paddingHorizontal: 16,
      backgroundColor: '#0a398a',
      margin: 10,
      borderRadius: 12,
      flex: 1,
      ...boxShadow,
    },
    scanButtonText: {
      fontSize: 16,
      letterSpacing: 0.25,
      color: Colors.white,
    },
    body: {
      backgroundColor: '#e9ecf2',
      flex: 1,
    },
    sectionContainer: {
      marginTop: 32,
      paddingHorizontal: 24,
    },
    sectionTitle: {
      fontSize: 24,
      fontWeight: '600',
      color: Colors.black,
    },
    sectionDescription: {
      marginTop: 8,
      fontSize: 18,
      fontWeight: '400',
      color: Colors.dark,
    },
    highlight: {
      fontWeight: '700',
    },
    footer: {
      color: Colors.dark,
      fontSize: 12,
      fontWeight: '600',
      padding: 4,
      paddingRight: 12,
      textAlign: 'right',
    },
    peripheralName: {
      fontSize: 16,
      textAlign: 'center',
      padding: 10,
    },
    rssi: {
      fontSize: 12,
      textAlign: 'center',
      padding: 2,
    },
    peripheralId: {
      fontSize: 12,
      textAlign: 'center',
      padding: 2,
      paddingBottom: 20,
    },
    row: {
      marginLeft: 10,
      marginRight: 10,
      borderRadius: 20,
      ...boxShadow,
    },
    noPeripherals: {
      margin: 10,
      textAlign: 'center',
      color: Colors.white,
    },
  });

  export default styles;
  