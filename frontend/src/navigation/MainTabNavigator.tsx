import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {MainTabParamList} from '@/types/navigation';
import HomeScreen from '@/screens/HomeScreen';
import ScanScreen from '@/screens/ScanScreen';
import RoutineScreen from '@/screens/RoutineScreen';
import MyPageScreen from '@/screens/MyPageScreen';
import {COLORS} from '@/constants';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray500,
        headerShown: false,
      }}>
      <Tab.Screen name="Home" component={HomeScreen} options={{title: '홈'}} />
      <Tab.Screen name="Scan" component={ScanScreen} options={{title: '스캔'}} />
      <Tab.Screen name="Routine" component={RoutineScreen} options={{title: '루틴'}} />
      <Tab.Screen name="MyPage" component={MyPageScreen} options={{title: '마이페이지'}} />
    </Tab.Navigator>
  );
}
