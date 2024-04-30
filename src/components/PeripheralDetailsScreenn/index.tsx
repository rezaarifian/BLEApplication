import React from 'react';
import { Text, ScrollView } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';

import styles from './styles';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'Details'>;
  route: RouteProp<RootStackParamList, 'Details'>;
};

const PeripheralDetailsScreen: React.FC<Props> = ({navigation, route}) => {
  const peripheralData = route.params.peripheralData;

  return (
    <ScrollView
      style={styles.scrollViewStyle}
      contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Peripheral Details</Text>
      <Text style={styles.detail}>Name: {peripheralData.name}</Text>
      <Text style={styles.detail}>Id: {peripheralData.id}</Text>
      <Text style={styles.detail}>RSSI: {peripheralData.rssi}</Text>

      <Text style={[styles.title, styles.titleWithMargin]}>Advertising</Text>
      <Text style={styles.detail}>
        Local Name: {peripheralData.advertising.localName}
      </Text>
      <Text style={styles.detail}>
        Power Level: {peripheralData.advertising.txPowerLevel}
      </Text>
      <Text style={styles.detail}>
        Connectable:{' '}
        {peripheralData.advertising.isConnectable ? 'true' : 'false'}
      </Text>
      <Text style={styles.detail}>
        serviceUUIDs: {peripheralData.advertising.serviceUUIDs}
      </Text>
    </ScrollView>
  );
};

export default PeripheralDetailsScreen;