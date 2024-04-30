import React from 'react';
import {StyleSheet, SafeAreaView} from 'react-native';

// navigation
import Main from './src/routes';

const App: () => React.ReactNode = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Main />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;