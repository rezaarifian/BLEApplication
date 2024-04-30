import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StatusBar,
  NativeModules,
  NativeEventEmitter,
  Platform,
  FlatList,
  TouchableHighlight,
  Pressable,
} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import BleManager, {
  BleDisconnectPeripheralEvent,
  BleManagerDidUpdateValueForCharacteristicEvent,
  BleScanCallbackType,
  BleScanMatchMode,
  BleScanMode,
  Peripheral,
} from 'react-native-ble-manager';

import { showToast, sleep, handleAndroidPermissions } from '../../utils';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import styles from './styles';

const SECONDS_TO_SCAN_FOR = 5; // duration for scan
const SERVICE_UUIDS: string[] = []; // string of array. It empty because we are searching for all nearby devices, not a particular device
const ALLOW_DUPLICATES = true; // allow the scanner to find duplicates

const BleManagerModule = NativeModules.BleManager; // bridging using NativeModules
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

declare module 'react-native-ble-manager' {
  interface Peripheral {
    connected?: boolean;
    connecting?: boolean;
  }
}

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'ScanDevices'>;
};

const ScanDeviceScreen: React.FC<Props> = ({navigation}) => {

  const [isScanning, setIsScanning] = useState(false);
  const [peripherals, setPeripherals] = useState(
    new Map<Peripheral['id'], Peripheral>(),
  );

  useEffect(() => {
    try {
    // Before begin scanning for nearby BLE devices, we will have first start our react-native-ble-manager package.
      BleManager.start({ showAlert: false })
        .then(() => console.debug('BleManager started.'))
        .catch((error: any) =>
          console.error('BeManager could not be started.', error),
        );
    } catch (error) {
      console.error('unexpected error starting BleManager.', error);
      return;
    }

    const listeners = [
      bleManagerEmitter.addListener(
        'BleManagerDiscoverPeripheral',
        handleDiscoverPeripheral,
      ), // When a nearby device is discovered, this event is triggered
      bleManagerEmitter.addListener('BleManagerStopScan', handleStopScan),  // When our device’s scanning stops, this event is triggered
      bleManagerEmitter.addListener(
        'BleManagerDisconnectPeripheral',
        handleDisconnectedPeripheral,
      ),  // trigerred when disconect
      bleManagerEmitter.addListener(
        'BleManagerDidUpdateValueForCharacteristic',
        handleUpdateValueForCharacteristic,
      ), // triggered when we receive data
      bleManagerEmitter.addListener(
        'BleManagerConnectPeripheral',
        handleConnectPeripheral,
      ), // triggered when we connect to a device
    ];

    handleAndroidPermissions();

    return () => {
      console.debug('unmounting. Removing listeners...');
      for (const listener of listeners) {
        listener.remove();
      }
    };
  }, []);

  const startScan = async () => {
    if (!isScanning) {
      await enableBluetooth();
      // reset result peripherals before scan
      setPeripherals(new Map<Peripheral['id'], Peripheral>());

      try {
        showToast('starting scan looking for nearby devices !');
        setIsScanning(true); // for handle loading state
        BleManager.scan(SERVICE_UUIDS, SECONDS_TO_SCAN_FOR, ALLOW_DUPLICATES, {
          matchMode: BleScanMatchMode.Sticky,
          scanMode: BleScanMode.LowLatency,
          callbackType: BleScanCallbackType.AllMatches,
        })
          .then(() => {
            showToast('scan successfully!');
          })
          .catch((err: any) => {
            showToast('scan in error!');
            console.error('[startScan] scan returned in error', err);
          });
      } catch (error) {
        showToast('scan error thrown');
        console.error('[startScan] scan error thrown', error);
      }
    }
  };

  const enableBluetooth = async () => { // [ANDROID]: Turn on Bluetooth Device
    try {
      await BleManager.enableBluetooth();
    } catch (error) {
      showToast('enable bluetooth error thrown');
      console.error('[enableBluetooth] thrown', error);
    }
  }
  
  const handleStopScan = () => {
    setIsScanning(false);
    showToast('scan is stopped !');
  };

  const handleDisconnectedPeripheral = (
    event: BleDisconnectPeripheralEvent,
  ) => {
    showToast(`[${event.peripheral}] disconnected.`);
    setPeripherals(map => {
      let p = map.get(event.peripheral);
      if (p) {
        p.connected = false;
        return new Map(map.set(event.peripheral, p));
      }
      return map;
    });
  };

  const handleConnectPeripheral = (event: any) => {
    showToast(`[${event.peripheral}] connected.`);
  };

  const handleUpdateValueForCharacteristic = (
    data: BleManagerDidUpdateValueForCharacteristicEvent,
  ) => {
    console.debug(
      `[handleUpdateValueForCharacteristic] received data from '${data.peripheral}' with characteristic='${data.characteristic}' and value='${data.value}'`,
    );
  };

  const handleDiscoverPeripheral = (peripheral: Peripheral) => {
    console.debug('[handleDiscoverPeripheral] new BLE peripheral=', peripheral);
    if (!peripheral.name) {
      peripheral.name = peripheral?.id;
    }
    setPeripherals(map => {
      return new Map(map.set(peripheral.id, peripheral));
    });
  };

  const togglePeripheralConnection = async (peripheral: Peripheral) => {
    if (peripheral && peripheral.connected) {
      try {
        await BleManager.disconnect(peripheral.id);
      } catch (error) {
        console.error(
          `[togglePeripheralConnection][${peripheral.id}] error when trying to disconnect device.`,
          error,
        );
      }
    } else {
      await connectPeripheral(peripheral);
    }
  };

  const retrieveConnected = async () => {
    try {
      const connectedPeripherals = await BleManager.getConnectedPeripherals();
      if (connectedPeripherals.length === 0) {
        showToast('No connected peripherals found !');
        return;
      }
      console.debug(
        '[retrieveConnected] connectedPeripherals',
        connectedPeripherals,
      );

      for (let peripheral of connectedPeripherals) {
        setPeripherals(map => {
          let p = map.get(peripheral.id);
          if (p) {
            p.connected = true;
            return new Map(map.set(p.id, p));
          }
          return map;
        });
      }
    } catch (error) {
      showToast('unable to retrieve connected peripherals');
      console.error(
        '[retrieveConnected] unable to retrieve connected peripherals.',
        error,
      );
    }
  };

  const connectPeripheral = async (peripheral: Peripheral) => {
    try {
      if (peripheral) {
        setPeripherals(map => {
          let p = map.get(peripheral.id);
          if (p) {
            p.connecting = true;
            return new Map(map.set(p.id, p));
          }
          return map;
        });

        await BleManager.connect(peripheral.id);
        showToast(`[${peripheral?.name}] is connected`)
        console.debug(`[connectPeripheral][${peripheral.id}] is connected.`);

        setPeripherals(map => {
          let p = map.get(peripheral.id);
          if (p) {
            p.connecting = false;
            p.connected = true;
            return new Map(map.set(p.id, p));
          }
          return map;
        });
        // delay before retrieving services for finish properly
        await sleep(900);

        /* Test read current RSSI value, retrieve services first */
        /* https://www.researchgate.net/figure/Bluetooth-signal-strength-RSSI-as-a-function-of-distance-A-Scans-between-two-phones_fig2_263708916 */
        const peripheralData = await BleManager.retrieveServices(peripheral.id);
        console.debug(
          `[connectPeripheral][${peripheral.id}] retrieved peripheral services`,
          peripheralData,
        );

        setPeripherals(map => {
          let p = map.get(peripheral.id);
          if (p) {
            return new Map(map.set(p.id, p));
          }
          return map;
        });

        const rssi = await BleManager.readRSSI(peripheral.id);
        console.debug(
          `[connectPeripheral][${peripheral.id}] retrieved current RSSI value: ${rssi}.`,
        );

        if (peripheralData.characteristics) {
          for (let characteristic of peripheralData.characteristics) {
            if (characteristic.descriptors) {
              for (let descriptor of characteristic.descriptors) {
                try {
                  let data = await BleManager.readDescriptor(
                    peripheral.id,
                    characteristic.service,
                    characteristic.characteristic,
                    descriptor.uuid,
                  );
                  console.debug(
                    `[connectPeripheral][${peripheral.id}] ${characteristic.service} ${characteristic.characteristic} ${descriptor.uuid} descriptor read as:`,
                    data,
                  );
                } catch (error) {
                  console.error(
                    `[connectPeripheral][${peripheral.id}] failed to retrieve descriptor ${descriptor} for characteristic ${characteristic}:`,
                    error,
                  );
                }
              }
            }
          }
        }

        setPeripherals(map => {
          let p = map.get(peripheral.id);
          if (p) {
            p.rssi = rssi;
            return new Map(map.set(p.id, p));
          }
          return map;
        });

        // navigation.navigate('Details', {
        //   peripheralData: peripheralData,
        // });
        navigation.navigate('Details', {
          peripheralData: peripheralData,
        });
      }
    } catch (error) {
      console.error(
        `[connectPeripheral][${peripheral.id}] connectPeripheral error`,
        error,
      );
    }
  };

  const renderItem = ({ item }: { item: Peripheral }) => {
    const backgroundColor = item.connected ? '#0082FC' : Colors.white;
    return (
      <TouchableHighlight
        underlayColor="#e9ecf2"
        onPress={() => togglePeripheralConnection(item)}>
        <View style={[styles.row, { backgroundColor }]}>
          <Text style={styles.peripheralName}>
            {item.name} - {item?.advertising?.localName}
            {item.connecting && ' - Connecting...'}
          </Text>
          <Text style={styles.rssi}>RSSI: {item.rssi}</Text>
          <Text style={styles.peripheralId}>{item.id}</Text>
        </View>
      </TouchableHighlight>
    );
  };

  return (
    <>
      <StatusBar />
      <SafeAreaView style={styles.body}>
        <View style={styles.buttonGroup}>
          <Pressable style={styles.scanButton} onPress={startScan}>
            <Text style={styles.scanButtonText}>
              {isScanning ? 'Scanning...' : 'Scan Bluetooth'}
            </Text>
          </Pressable>

          <Pressable style={styles.scanButton} onPress={retrieveConnected}>
            <Text style={styles.scanButtonText} lineBreakMode='middle'>
              {'Retrieve connected peripherals'}
            </Text>
          </Pressable>
        </View>

        {Platform.OS === 'android' &&
          (
            <>
              <View style={styles.buttonGroup}>
                <Pressable style={styles.scanButton} onPress={enableBluetooth}>
                  <Text style={styles.scanButtonText}>
                    {'Enable Bluetooh'}
                  </Text>
                </Pressable>                
              </View>
            </>
          )}

        {Array.from(peripherals.values()).length === 0 && (
          <View style={styles.row}>
            <Text style={styles.noPeripherals}>
              No Peripherals, press "Scan Bluetooth" above.
            </Text>
          </View>
        )}


        <FlatList
          data={Array.from(peripherals.values())}
          contentContainerStyle={{ rowGap: 12 }}
          renderItem={renderItem}
          keyExtractor={item => item.id}
        />
      </SafeAreaView>
    </>
  );
};

export default ScanDeviceScreen;