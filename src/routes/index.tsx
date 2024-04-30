import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ScanDeviceScreen from '../components/scanDeviceScreen';
import PeripheralDetailsScreen from '../components/PeripheralDetailsScreenn'

const Stack = createNativeStackNavigator();

const Main: React.FC = () => {
  return (
    <NavigationContainer>
        <Stack.Navigator>
            <Stack.Screen
                name="ScanDevices"
                component={ScanDeviceScreen}
            />
            <Stack.Screen
                name="Details"
                component={PeripheralDetailsScreen}
            />
        </Stack.Navigator>
    </NavigationContainer>
  );
}

export default Main;