import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {RootStackParamList} from '@/types/navigation';
import MainTabNavigator from './MainTabNavigator';
import ProductSearchScreen from '@/screens/ProductSearchScreen';
import InsightScreen from '@/screens/InsightScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        <Stack.Screen name="Main" component={MainTabNavigator} />
        <Stack.Screen
          name="ProductSearch"
          component={ProductSearchScreen}
          options={{presentation: 'modal'}}
        />
        <Stack.Screen
          name="Insight"
          component={InsightScreen}
          options={{presentation: 'modal'}}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
