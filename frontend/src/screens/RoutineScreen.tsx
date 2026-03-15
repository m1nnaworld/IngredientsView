import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {COLORS} from '@/constants';
import {RootStackParamList} from '@/types';

// ── 타입 ──────────────────────────────────────────────────
type TimeOfDay = 'morning' | 'night';

interface RoutineItem {
  id: number;
  name: string;
  brand: string;
  imageUrl: string | null;
  category: string;
}

// ── Mock 초기 데이터 ───────────────────────────────────────
const INITIAL_MORNING: RoutineItem[] = [
  {id: 1, name: 'Purifying Foam', brand: 'COSRX', imageUrl: null, category: '클렌저'},
  {id: 2, name: 'AHA/BHA Clarifying Toner', brand: 'Some By Mi', imageUrl: null, category: '토너'},
  {id: 3, name: 'Niacinamide 10% + Zinc 1%', brand: 'The Ordinary', imageUrl: null, category: '세럼'},
  {id: 4, name: 'AM2PM Hydro Sun SPF50+', brand: 'Illiyoon', imageUrl: null, category: '선크림'},
];

const INITIAL_NIGHT: RoutineItem[] = [
  {id: 5, name: 'Deep Cleansing Oil', brand: 'Banila Co', imageUrl: null, category: '클렌징오일'},
  {id: 6, name: 'Purifying Foam', brand: 'COSRX', imageUrl: null, category: '클렌저'},
  {id: 7, name: 'Advanced Night Repair', brand: "Estée Lauder", imageUrl: null, category: '세럼'},
  {id: 8, name: 'Moisturizing Cream', brand: 'CeraVe', imageUrl: null, category: '크림'},
];

// ── 카테고리 컬러 ─────────────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  '클렌저': '#E3F2FD',
  '클렌징오일': '#E3F2FD',
  '토너': '#F3E5F5',
  '세럼': '#E8F5E9',
  '크림': '#FFF8E1',
  '선크림': '#FFF3E0',
  '에센스': '#FCE4EC',
  '아이크림': '#E0F7FA',
};

const CATEGORY_TEXT: Record<string, string> = {
  '클렌저': '#1976D2',
  '클렌징오일': '#1976D2',
  '토너': '#7B1FA2',
  '세럼': '#388E3C',
  '크림': '#F57F17',
  '선크림': '#E65100',
  '에센스': '#C2185B',
  '아이크림': '#00838F',
};

// ── 루틴 아이템 카드 ──────────────────────────────────────
function RoutineItemCard({
  item,
  index,
  total,
  onMoveUp,
  onMoveDown,
  onDelete,
}: {
  item: RoutineItem;
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}) {
  const catBg = CATEGORY_COLORS[item.category] ?? COLORS.gray100;
  const catText = CATEGORY_TEXT[item.category] ?? COLORS.gray700;

  return (
    <View style={cardStyles.container}>
      {/* 왼쪽: 순서 번호 + 라인 */}
      <View style={cardStyles.stepCol}>
        <View style={cardStyles.stepBadge}>
          <Text style={cardStyles.stepNum}>{index + 1}</Text>
        </View>
        {index < total - 1 && <View style={cardStyles.stepLine} />}
      </View>

      {/* 카드 본체 */}
      <View style={cardStyles.card}>
        {/* 제품 이미지 */}
        <View style={cardStyles.imageBox}>
          {item.imageUrl ? (
            <Image source={{uri: item.imageUrl}} style={cardStyles.image} resizeMode="contain" />
          ) : (
            <Text style={cardStyles.imagePlaceholder}>🧴</Text>
          )}
        </View>

        {/* 제품 정보 */}
        <View style={cardStyles.info}>
          <View style={[cardStyles.categoryTag, {backgroundColor: catBg}]}>
            <Text style={[cardStyles.categoryText, {color: catText}]}>{item.category}</Text>
          </View>
          <Text style={cardStyles.brand}>{item.brand}</Text>
          <Text style={cardStyles.name} numberOfLines={2}>{item.name}</Text>
        </View>

        {/* 순서 변경 + 삭제 */}
        <View style={cardStyles.actions}>
          <TouchableOpacity
            style={[cardStyles.arrowBtn, index === 0 && cardStyles.arrowDisabled]}
            onPress={onMoveUp}
            disabled={index === 0}>
            <Text style={[cardStyles.arrowText, index === 0 && cardStyles.arrowTextDisabled]}>↑</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[cardStyles.arrowBtn, index === total - 1 && cardStyles.arrowDisabled]}
            onPress={onMoveDown}
            disabled={index === total - 1}>
            <Text style={[cardStyles.arrowText, index === total - 1 && cardStyles.arrowTextDisabled]}>↓</Text>
          </TouchableOpacity>
          <TouchableOpacity style={cardStyles.deleteBtn} onPress={onDelete}>
            <Text style={cardStyles.deleteText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 0,
  },
  stepCol: {
    alignItems: 'center',
    width: 36,
    paddingTop: 18,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  stepNum: {fontSize: 12, fontWeight: '800', color: COLORS.white},
  stepLine: {
    width: 2,
    flex: 1,
    minHeight: 20,
    backgroundColor: COLORS.primaryLight,
    marginTop: 4,
  },
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  imageBox: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    overflow: 'hidden',
  },
  image: {width: '100%', height: '100%'},
  imagePlaceholder: {fontSize: 26},
  info: {flex: 1, gap: 2},
  categoryTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 2,
  },
  categoryText: {fontSize: 10, fontWeight: '700'},
  brand: {fontSize: 11, color: COLORS.gray500},
  name: {fontSize: 13, fontWeight: '600', color: COLORS.gray900, lineHeight: 18},
  actions: {
    alignItems: 'center',
    gap: 4,
    marginLeft: 8,
  },
  arrowBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowDisabled: {backgroundColor: COLORS.gray100},
  arrowText: {fontSize: 14, color: COLORS.gray700, fontWeight: '600'},
  arrowTextDisabled: {color: COLORS.gray300},
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {fontSize: 11, color: COLORS.error, fontWeight: '700'},
});

// ── 빈 상태 ───────────────────────────────────────────────
function EmptyState({onAdd}: {onAdd: () => void}) {
  return (
    <View style={emptyStyles.container}>
      <Text style={emptyStyles.icon}>🪴</Text>
      <Text style={emptyStyles.title}>아직 루틴이 없어요</Text>
      <Text style={emptyStyles.sub}>제품을 추가하여{'\n'}나만의 루틴을 만들어보세요</Text>
      <TouchableOpacity style={emptyStyles.btn} onPress={onAdd}>
        <Text style={emptyStyles.btnText}>＋ 첫 제품 추가하기</Text>
      </TouchableOpacity>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  icon: {fontSize: 56, marginBottom: 8},
  title: {fontSize: 17, fontWeight: '700', color: COLORS.gray900},
  sub: {fontSize: 14, color: COLORS.gray500, textAlign: 'center', lineHeight: 22},
  btn: {
    marginTop: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  btnText: {fontSize: 15, fontWeight: '700', color: COLORS.white},
});

// ── 메인 화면 ─────────────────────────────────────────────
export default function RoutineScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [activeTab, setActiveTab] = useState<TimeOfDay>('morning');
  const [morningItems, setMorningItems] = useState<RoutineItem[]>(INITIAL_MORNING);
  const [nightItems, setNightItems] = useState<RoutineItem[]>(INITIAL_NIGHT);

  const items = activeTab === 'morning' ? morningItems : nightItems;
  const setItems = activeTab === 'morning' ? setMorningItems : setNightItems;

  const moveUp = (index: number) => {
    if (index === 0) return;
    const next = [...items];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    setItems(next);
  };

  const moveDown = (index: number) => {
    if (index === items.length - 1) return;
    const next = [...items];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    setItems(next);
  };

  const deleteItem = (index: number) => {
    Alert.alert(
      '제품 삭제',
      `"${items[index].name}"을(를) 루틴에서 제거할까요?`,
      [
        {text: '취소', style: 'cancel'},
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => setItems(items.filter((_, i) => i !== index)),
        },
      ],
    );
  };

  const handleAddProduct = () => {
    navigation.navigate('ProductSearch');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>내 루틴</Text>
        <View style={styles.headerRight}>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{items.length}개</Text>
          </View>
        </View>
      </View>

      {/* 아침 / 밤 탭 */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'morning' && styles.tabItemActive]}
          onPress={() => setActiveTab('morning')}
          activeOpacity={0.7}>
          <Text style={styles.tabIcon}>☀️</Text>
          <Text style={[styles.tabLabel, activeTab === 'morning' && styles.tabLabelActive]}>
            아침 루틴
          </Text>
          {morningItems.length > 0 && (
            <View style={[styles.tabBadge, activeTab === 'morning' && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, activeTab === 'morning' && styles.tabBadgeTextActive]}>
                {morningItems.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'night' && styles.tabItemActive]}
          onPress={() => setActiveTab('night')}
          activeOpacity={0.7}>
          <Text style={styles.tabIcon}>🌙</Text>
          <Text style={[styles.tabLabel, activeTab === 'night' && styles.tabLabelActive]}>
            밤 루틴
          </Text>
          {nightItems.length > 0 && (
            <View style={[styles.tabBadge, activeTab === 'night' && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, activeTab === 'night' && styles.tabBadgeTextActive]}>
                {nightItems.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* 탭 인디케이터 */}
      <View style={styles.tabIndicatorTrack}>
        <View style={[styles.tabIndicator, activeTab === 'night' && styles.tabIndicatorRight]} />
      </View>

      {/* 루틴 리스트 */}
      {items.length === 0 ? (
        <EmptyState onAdd={handleAddProduct} />
      ) : (
        <>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>

            {/* 안내 텍스트 */}
            <View style={styles.guideRow}>
              <Text style={styles.guideText}>
                {activeTab === 'morning' ? '☀️ 아침 스킨케어 순서' : '🌙 저녁 스킨케어 순서'}
              </Text>
              <Text style={styles.guideHint}>↑↓로 순서 변경</Text>
            </View>

            {/* 제품 목록 */}
            <View style={styles.listContainer}>
              {items.map((item, index) => (
                <RoutineItemCard
                  key={item.id}
                  item={item}
                  index={index}
                  total={items.length}
                  onMoveUp={() => moveUp(index)}
                  onMoveDown={() => moveDown(index)}
                  onDelete={() => deleteItem(index)}
                />
              ))}
            </View>
          </ScrollView>

          {/* FAB */}
          <TouchableOpacity style={styles.fab} onPress={handleAddProduct} activeOpacity={0.85}>
            <Text style={styles.fabIcon}>＋</Text>
            <Text style={styles.fabText}>제품 추가하기</Text>
          </TouchableOpacity>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.gray100},

  // 헤더
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerTitle: {fontSize: 20, fontWeight: '800', color: COLORS.gray900},
  headerRight: {flexDirection: 'row', alignItems: 'center', gap: 8},
  countBadge: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  countText: {fontSize: 12, fontWeight: '700', color: COLORS.primaryDark},

  // 탭
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 8,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
    backgroundColor: COLORS.gray100,
  },
  tabItemActive: {
    backgroundColor: COLORS.primary + '18',
  },
  tabIcon: {fontSize: 16},
  tabLabel: {fontSize: 14, fontWeight: '600', color: COLORS.gray500},
  tabLabelActive: {color: COLORS.primaryDark},
  tabBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.gray300,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeActive: {backgroundColor: COLORS.primary},
  tabBadgeText: {fontSize: 10, fontWeight: '700', color: COLORS.white},
  tabBadgeTextActive: {color: COLORS.white},

  // 탭 인디케이터
  tabIndicatorTrack: {
    height: 3,
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingBottom: 0,
    flexDirection: 'row',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 16,
    width: '46%',
    height: 3,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  tabIndicatorRight: {
    left: undefined,
    right: 16,
  } as any,

  // 리스트
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  guideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  guideText: {fontSize: 14, fontWeight: '700', color: COLORS.gray900},
  guideHint: {fontSize: 12, color: COLORS.gray500},
  listContainer: {
    paddingBottom: 8,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: COLORS.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  fabIcon: {fontSize: 20, color: COLORS.white, fontWeight: '400'},
  fabText: {fontSize: 16, fontWeight: '600', color: COLORS.white},
});
