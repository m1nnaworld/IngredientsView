import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Keyboard,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '@/constants/colors';
import { searchProducts, ProductSearchResult } from '@/api/products';

export default function ProductSearchScreen() {
  const navigation = useNavigation();
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<ProductSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const handleSearch = async () => {
    const q = keyword.trim();
    if (!q) return;
    Keyboard.dismiss();
    setLoading(true);
    setSearched(true);
    setResults([]);
    try {
      const data = await searchProducts(q);
      setResults(data);
    } catch {
      Alert.alert('검색 실패', '잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = (product: ProductSearchResult) => {
    // TODO: 루틴에 추가하는 플로우 연동
    Alert.alert('제품 추가', `"${product.name}"을(를) 추가하시겠어요?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '추가',
        onPress: () => {
          Alert.alert('완료', '제품이 추가됐습니다.');
          navigation.goBack();
        },
      },
    ]);
  };

  const renderProduct = ({ item }: { item: ProductSearchResult }) => (
    <TouchableOpacity style={styles.card} onPress={() => handleAddProduct(item)} activeOpacity={0.8}>
      <View style={styles.cardImageWrap}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.cardImage} resizeMode="contain" />
        ) : (
          <View style={styles.cardImagePlaceholder}>
            <Text style={styles.placeholderText}>🧴</Text>
          </View>
        )}
      </View>
      <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
      <Text style={styles.cardBrand} numberOfLines={1}>{item.brand}</Text>
      {item.productIngredients?.length > 0 && (
        <View style={styles.ingredientBadge}>
          <Text style={styles.ingredientBadgeText}>성분 {item.productIngredients.length}종</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>제품 검색</Text>
        <View style={styles.headerBtn} />
      </View>

      {/* 검색바 */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="제품명 또는 브랜드 검색"
            placeholderTextColor={COLORS.gray500}
            value={keyword}
            onChangeText={setKeyword}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoFocus
          />
          {keyword.length > 0 && (
            <TouchableOpacity onPress={() => { setKeyword(''); setResults([]); setSearched(false); }}>
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.searchBtn, !keyword.trim() && styles.searchBtnDisabled]}
          onPress={handleSearch}
          disabled={!keyword.trim()}
        >
          <Text style={styles.searchBtnText}>검색</Text>
        </TouchableOpacity>
      </View>

      {/* 크롤링 로딩 */}
      {loading && (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>올리브영에서 제품 수집 중...</Text>
          <Text style={styles.loadingSubText}>처음 검색은 10~20초 소요될 수 있어요</Text>
        </View>
      )}

      {/* 결과 없음 */}
      {!loading && searched && results.length === 0 && (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyText}>검색 결과가 없어요</Text>
          <Text style={styles.emptySubText}>다른 키워드로 검색해보세요</Text>
        </View>
      )}

      {/* 초기 안내 */}
      {!loading && !searched && (
        <View style={styles.guideWrap}>
          <Text style={styles.guideIcon}>🧴</Text>
          <Text style={styles.guideText}>제품명이나 브랜드를 검색하면</Text>
          <Text style={styles.guideText}>올리브영에서 성분 정보를 가져와요</Text>
        </View>
      )}

      {/* 검색 결과 */}
      {!loading && results.length > 0 && (
        <>
          <View style={styles.resultHeader}>
            <Text style={styles.resultTitle}>My Collection</Text>
            <Text style={styles.resultCount}>{results.length}개</Text>
          </View>
          <FlatList
            data={results}
            renderItem={renderProduct}
            keyExtractor={(item) => item.id?.toString() ?? item.oliveyoungId}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}

      {/* 하단 버튼 */}
      <TouchableOpacity style={styles.addBtn} onPress={() => inputRef.current?.focus()}>
        <Text style={styles.addBtnText}>＋  Add New to Collection</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  // 헤더
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  headerBtn: {
    width: 36,
    alignItems: 'center',
  },
  headerBtnText: {
    fontSize: 18,
    color: COLORS.gray700,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.gray900,
  },

  // 검색바
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray100,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.gray900,
    padding: 0,
  },
  clearBtn: {
    fontSize: 14,
    color: COLORS.gray500,
    paddingLeft: 8,
  },
  searchBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
  },
  searchBtnDisabled: {
    backgroundColor: COLORS.gray300,
  },
  searchBtnText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 15,
  },

  // 로딩
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.gray900,
  },
  loadingSubText: {
    fontSize: 13,
    color: COLORS.gray500,
  },

  // 빈 결과
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyIcon: { fontSize: 40 },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.gray700,
  },
  emptySubText: {
    fontSize: 13,
    color: COLORS.gray500,
  },

  // 초기 안내
  guideWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  guideIcon: { fontSize: 48, marginBottom: 8 },
  guideText: {
    fontSize: 14,
    color: COLORS.gray500,
    textAlign: 'center',
  },

  // 결과 헤더
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.gray900,
  },
  resultCount: {
    fontSize: 13,
    color: COLORS.gray500,
  },

  // 카드 그리드
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 80,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  card: {
    width: '48%',
    backgroundColor: COLORS.gray100,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  cardImageWrap: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  placeholderText: { fontSize: 36 },
  cardName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray900,
    marginBottom: 2,
    lineHeight: 18,
  },
  cardBrand: {
    fontSize: 12,
    color: COLORS.gray500,
  },
  ingredientBadge: {
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primaryLight,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  ingredientBadgeText: {
    fontSize: 10,
    color: COLORS.primaryDark,
    fontWeight: '500',
  },

  // 하단 버튼
  addBtn: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
