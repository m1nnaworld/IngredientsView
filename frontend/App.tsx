import React from 'react';
import {Platform, View, StyleSheet} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {StatusBar} from 'expo-status-bar';
import RootNavigator from '@/navigation/RootNavigator';

const queryClient = new QueryClient();

const APP_MAX_WIDTH = 430;

export default function App() {
  const inner = (
    <GestureHandlerRootView style={styles.flex}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <StatusBar style="auto" />
          <RootNavigator />
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );

  if (Platform.OS !== 'web') {
    return inner;
  }

  return (
    <View style={styles.webBackground}>
      <View style={styles.webContainer}>{inner}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  webBackground: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#e8f0ec',
    minHeight: '100%' as any,
  },
  webContainer: {
    width: '100%' as any,
    maxWidth: APP_MAX_WIDTH,
    flex: 1,
    backgroundColor: '#ffffff',
    // @ts-ignore — web only
    boxShadow: '0 0 40px rgba(0, 0, 0, 0.10)',
    overflow: 'hidden',
    minHeight: '100vh' as any,
  },
});
