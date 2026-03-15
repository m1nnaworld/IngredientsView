import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, SafeAreaView} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {COLORS} from '@/constants';
import {RootStackParamList} from '@/types/navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ScanScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>성분 스캔</Text>
      <Text style={styles.subtitle}>제품을 검색하거나 바코드를 스캔하세요</Text>

      <TouchableOpacity
        style={styles.searchBtn}
        onPress={() => navigation.navigate('ProductSearch')}
      >
        <Text style={styles.searchBtnIcon}>🔍</Text>
        <Text style={styles.searchBtnText}>제품 검색</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.barcodeBtn}>
        <Text style={styles.barcodeBtnIcon}>📷</Text>
        <Text style={styles.barcodeBtnText}>바코드 스캔</Text>
        <Text style={styles.barcodeBtnSub}>준비 중</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.gray900,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.gray500,
    marginBottom: 16,
  },
  searchBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    gap: 12,
  },
  searchBtnIcon: {fontSize: 22},
  searchBtnText: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.white,
    flex: 1,
  },
  barcodeBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray100,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    gap: 12,
  },
  barcodeBtnIcon: {fontSize: 22},
  barcodeBtnText: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.gray700,
    flex: 1,
  },
  barcodeBtnSub: {
    fontSize: 12,
    color: COLORS.gray500,
    backgroundColor: COLORS.gray200,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
});
