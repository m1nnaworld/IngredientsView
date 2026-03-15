import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Image,
  StatusBar,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {COLORS} from '@/constants';
import {RootStackParamList} from '@/types';

// ── Mock 데이터 ────────────────────────────────────────────
const ROUTINE_SCORE = 87;

const MOCK_STEPS = [
  {
    id: 1,
    step: 1,
    name: 'Purifying Foam',
    brand: 'COSRX',
    imageUrl: null as string | null,
    keyIngredient: 'Salicylic Acid',
    ingredientKo: '살리실산',
    rating: 'good' as const,
    functions: ['각질제거', '모공청소'],
  },
  {
    id: 2,
    step: 2,
    name: 'Glow Toner',
    brand: 'Some By Mi',
    imageUrl: null as string | null,
    keyIngredient: 'AHA BHA',
    ingredientKo: '에이에이치에이',
    rating: 'caution' as const,
    functions: ['각질제거'],
  },
  {
    id: 3,
    step: 3,
    name: '수분 세럼',
    brand: 'The Ordinary',
    imageUrl: null as string | null,
    keyIngredient: 'Niacinamide',
    ingredientKo: '나이아신아마이드',
    rating: 'good' as const,
    functions: ['미백', '피지조절'],
  },
];

const MOCK_COLLECTION = [
  {id: 1, name: 'Midnight Recovery', brand: "Kiehl's", imageUrl: null as string | null},
  {id: 2, name: 'Moisturizing Cream', brand: 'CeraVe', imageUrl: null as string | null},
  {id: 3, name: 'SPF 50+ 선크림', brand: 'Anessa', imageUrl: null as string | null},
  {id: 4, name: 'Eye Cream', brand: 'Origins', imageUrl: null as string | null},
];

const MOCK_INGREDIENT_ANALYSIS = [
  {name: 'HYALURONIC ACID', nameKo: '히알루론산', rating: 'good' as const, functions: ['보습', '수분유지'], foundIn: 'Purifying Foam', ewgScore: 1},
  {name: 'SALICYLIC ACID', nameKo: '살리실산', rating: 'caution' as const, functions: ['각질제거', '모공청소'], foundIn: 'Glow Toner', ewgScore: 3},
  {name: 'NIACINAMIDE', nameKo: '나이아신아마이드', rating: 'good' as const, functions: ['미백', '피지조절'], foundIn: '수분 세럼', ewgScore: 1},
  {name: 'GLYCERIN', nameKo: '글리세린', rating: 'good' as const, functions: ['보습'], foundIn: 'Purifying Foam', ewgScore: 1},
  {name: 'RETINOL', nameKo: '레티놀', rating: 'caution' as const, functions: ['안티에이징', '세포재생'], foundIn: '수분 세럼', ewgScore: 5},
];

// ── 유틸 ──────────────────────────────────────────────────
type Rating = 'good' | 'caution' | 'bad' | 'neutral';

const RATING_CONFIG: Record<Rating, {bg: string; text: string; label: string; dot: string}> = {
  good: {bg: '#E8F5E9', text: '#43A047', label: '안전', dot: '#43A047'},
  caution: {bg: '#FFF8E1', text: '#F9A825', label: '주의', dot: '#F9A825'},
  bad: {bg: '#FFEBEE', text: '#E53935', label: '위험', dot: '#E53935'},
  neutral: {bg: COLORS.gray100, text: COLORS.gray500, label: '중립', dot: COLORS.gray500},
};

// ── 원형 점수 컴포넌트 ────────────────────────────────────
function ScoreCircle({score}: {score: number}) {
  const getScoreColor = () => {
    if (score >= 80) return COLORS.primary;
    if (score >= 60) return COLORS.warning;
    return COLORS.error;
  };

  return (
    <View style={scoreStyles.wrapper}>
      <View style={[scoreStyles.outerRing, {borderColor: getScoreColor()}]}>
        <View style={scoreStyles.inner}>
          <Text style={[scoreStyles.number, {color: getScoreColor()}]}>{score}</Text>
          <Text style={scoreStyles.unit}>점</Text>
        </View>
      </View>
      <Text style={scoreStyles.label}>오늘의 루틴 점수</Text>
      <Text style={scoreStyles.sub}>
        {score >= 80 ? '훌륭한 루틴이에요!' : score >= 60 ? '개선 여지가 있어요' : '루틴을 점검해보세요'}
      </Text>
    </View>
  );
}

const scoreStyles = StyleSheet.create({
  wrapper: {alignItems: 'center', paddingVertical: 24},
  outerRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    shadowColor: COLORS.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  inner: {flexDirection: 'row', alignItems: 'flex-end'},
  number: {fontSize: 38, fontWeight: '800', lineHeight: 44},
  unit: {fontSize: 14, color: COLORS.gray500, fontWeight: '500', marginBottom: 4},
  label: {marginTop: 12, fontSize: 15, fontWeight: '600', color: COLORS.gray900},
  sub: {marginTop: 4, fontSize: 13, color: COLORS.gray500},
});

// ── 스킨케어 단계 아이템 ──────────────────────────────────
function StepItem({item}: {item: (typeof MOCK_STEPS)[0]}) {
  const cfg = RATING_CONFIG[item.rating];
  return (
    <View style={stepStyles.card}>
      <View style={stepStyles.stepBadge}>
        <Text style={stepStyles.stepNum}>{item.step}</Text>
      </View>
      <View style={stepStyles.imageBox}>
        {item.imageUrl ? (
          <Image source={{uri: item.imageUrl}} style={stepStyles.image} resizeMode="contain" />
        ) : (
          <Text style={stepStyles.imagePlaceholder}>🧴</Text>
        )}
      </View>
      <View style={stepStyles.info}>
        <Text style={stepStyles.brand}>{item.brand}</Text>
        <Text style={stepStyles.name} numberOfLines={1}>{item.name}</Text>
        <View style={stepStyles.ingredientRow}>
          <View style={[stepStyles.dot, {backgroundColor: cfg.dot}]} />
          <Text style={stepStyles.ingredientText} numberOfLines={1}>{item.ingredientKo}</Text>
          <View style={[stepStyles.ratingBadge, {backgroundColor: cfg.bg}]}>
            <Text style={[stepStyles.ratingText, {color: cfg.text}]}>{cfg.label}</Text>
          </View>
        </View>
        <View style={stepStyles.fnRow}>
          {item.functions.map(fn => (
            <View key={fn} style={stepStyles.fnTag}>
              <Text style={stepStyles.fnText}>{fn}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const stepStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  stepNum: {fontSize: 12, fontWeight: '700', color: COLORS.primaryDark},
  imageBox: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  image: {width: '100%', height: '100%'},
  imagePlaceholder: {fontSize: 28},
  info: {flex: 1},
  brand: {fontSize: 11, color: COLORS.gray500, marginBottom: 1},
  name: {fontSize: 14, fontWeight: '600', color: COLORS.gray900, marginBottom: 4},
  ingredientRow: {flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4},
  dot: {width: 6, height: 6, borderRadius: 3},
  ingredientText: {fontSize: 12, color: COLORS.gray700, flex: 1},
  ratingBadge: {paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6},
  ratingText: {fontSize: 10, fontWeight: '600'},
  fnRow: {flexDirection: 'row', gap: 4, flexWrap: 'wrap'},
  fnTag: {backgroundColor: COLORS.gray100, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2},
  fnText: {fontSize: 10, color: COLORS.gray700},
});

// ── 성분 분석 아이템 ──────────────────────────────────────
function IngredientAnalysisItem({item}: {item: (typeof MOCK_INGREDIENT_ANALYSIS)[0]}) {
  const cfg = RATING_CONFIG[item.rating];
  return (
    <View style={analysisStyles.row}>
      <View style={[analysisStyles.scoreDot, {backgroundColor: cfg.dot}]} />
      <View style={analysisStyles.textGroup}>
        <View style={analysisStyles.nameRow}>
          <Text style={analysisStyles.nameKo}>{item.nameKo}</Text>
          <Text style={analysisStyles.nameEn}>{item.name}</Text>
        </View>
        <Text style={analysisStyles.foundIn}>{item.foundIn}에 포함</Text>
      </View>
      <View style={analysisStyles.right}>
        <View style={[analysisStyles.badge, {backgroundColor: cfg.bg}]}>
          <Text style={[analysisStyles.badgeText, {color: cfg.text}]}>{cfg.label}</Text>
        </View>
        <Text style={analysisStyles.ewg}>EWG {item.ewgScore}</Text>
      </View>
    </View>
  );
}

const analysisStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
    gap: 10,
  },
  scoreDot: {width: 10, height: 10, borderRadius: 5},
  textGroup: {flex: 1},
  nameRow: {flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2},
  nameKo: {fontSize: 14, fontWeight: '600', color: COLORS.gray900},
  nameEn: {fontSize: 11, color: COLORS.gray500},
  foundIn: {fontSize: 11, color: COLORS.gray500},
  right: {alignItems: 'flex-end', gap: 4},
  badge: {paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6},
  badgeText: {fontSize: 11, fontWeight: '600'},
  ewg: {fontSize: 10, color: COLORS.gray500},
});

// ── 컬렉션 카드 ───────────────────────────────────────────
function CollectionCard({item}: {item: (typeof MOCK_COLLECTION)[0]}) {
  return (
    <View style={collectionStyles.card}>
      <View style={collectionStyles.imageBox}>
        {item.imageUrl ? (
          <Image source={{uri: item.imageUrl}} style={collectionStyles.image} resizeMode="contain" />
        ) : (
          <Text style={collectionStyles.imagePlaceholder}>🧴</Text>
        )}
      </View>
      <Text style={collectionStyles.name} numberOfLines={2}>{item.name}</Text>
      <Text style={collectionStyles.brand} numberOfLines={1}>{item.brand}</Text>
    </View>
  );
}

const collectionStyles = StyleSheet.create({
  card: {width: '48%', backgroundColor: COLORS.gray100, borderRadius: 14, padding: 10, marginBottom: 10},
  imageBox: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  image: {width: '100%', height: '100%'},
  imagePlaceholder: {fontSize: 32},
  name: {fontSize: 12, fontWeight: '600', color: COLORS.gray900, lineHeight: 16, marginBottom: 2},
  brand: {fontSize: 11, color: COLORS.gray500},
});

// ── 루틴 수집하기 바텀시트 ────────────────────────────────
function RoutineCollectionSheet({
  visible,
  onClose,
  onAddProduct,
}: {
  visible: boolean;
  onClose: () => void;
  onAddProduct: () => void;
}) {
  const [steps, setSteps] = useState(MOCK_STEPS);

  const moveUp = (index: number) => {
    if (index === 0) return;
    const next = [...steps];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    setSteps(next.map((s, i) => ({...s, step: i + 1})));
  };

  const moveDown = (index: number) => {
    if (index === steps.length - 1) return;
    const next = [...steps];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    setSteps(next.map((s, i) => ({...s, step: i + 1})));
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={sheetStyles.overlay}>
        <TouchableOpacity style={sheetStyles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={sheetStyles.sheet}>
          <View style={sheetStyles.handle} />
          <View style={sheetStyles.header}>
            <Text style={sheetStyles.title}>루틴 수집하기</Text>
            <TouchableOpacity onPress={onClose} style={sheetStyles.doneBtn}>
              <Text style={sheetStyles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 100}}>
            <View style={sheetStyles.section}>
              <Text style={sheetStyles.sectionLabel}>DRAG TO REORDER</Text>
              {steps.map((item, index) => (
                <View key={item.id} style={sheetStyles.reorderRow}>
                  <View style={sheetStyles.reorderArrows}>
                    <TouchableOpacity onPress={() => moveUp(index)} disabled={index === 0}>
                      <Text style={[sheetStyles.arrow, index === 0 && sheetStyles.arrowDisabled]}>▲</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => moveDown(index)} disabled={index === steps.length - 1}>
                      <Text style={[sheetStyles.arrow, index === steps.length - 1 && sheetStyles.arrowDisabled]}>▼</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={sheetStyles.reorderImageBox}>
                    {item.imageUrl ? (
                      <Image source={{uri: item.imageUrl}} style={{width: '100%', height: '100%'}} resizeMode="contain" />
                    ) : (
                      <Text style={{fontSize: 22}}>🧴</Text>
                    )}
                  </View>
                  <View style={sheetStyles.reorderInfo}>
                    <Text style={sheetStyles.reorderBrand}>{item.brand}</Text>
                    <Text style={sheetStyles.reorderName} numberOfLines={1}>{item.name}</Text>
                  </View>
                  <TouchableOpacity style={sheetStyles.changeBtn}>
                    <Text style={sheetStyles.changeBtnText}>변경</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <View style={sheetStyles.section}>
              <Text style={sheetStyles.sectionLabel}>My Collection</Text>
              <Text style={sheetStyles.sectionSub}>루틴에 추가할 제품을 선택해보세요</Text>
              <View style={sheetStyles.collectionGrid}>
                {MOCK_COLLECTION.map(item => (
                  <CollectionCard key={item.id} item={item} />
                ))}
              </View>
            </View>
          </ScrollView>

          <TouchableOpacity style={sheetStyles.addBtn} onPress={onAddProduct}>
            <Text style={sheetStyles.addBtnText}>＋  Add New to Collection</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const sheetStyles = StyleSheet.create({
  overlay: {flex: 1, justifyContent: 'flex-end'},
  backdrop: {...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)'},
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
    paddingHorizontal: 16,
    paddingBottom: 0,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.gray300,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  title: {fontSize: 17, fontWeight: '700', color: COLORS.gray900},
  doneBtn: {paddingHorizontal: 4},
  doneBtnText: {fontSize: 15, fontWeight: '600', color: COLORS.primary},
  section: {marginBottom: 20},
  sectionLabel: {fontSize: 11, fontWeight: '700', color: COLORS.gray500, letterSpacing: 1, marginBottom: 10},
  sectionSub: {fontSize: 12, color: COLORS.gray500, marginTop: -6, marginBottom: 10},
  reorderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray100,
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    gap: 8,
  },
  reorderArrows: {gap: 2},
  arrow: {fontSize: 12, color: COLORS.gray700, padding: 2},
  arrowDisabled: {color: COLORS.gray300},
  reorderImageBox: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  reorderInfo: {flex: 1},
  reorderBrand: {fontSize: 11, color: COLORS.gray500, marginBottom: 1},
  reorderName: {fontSize: 13, fontWeight: '600', color: COLORS.gray900},
  changeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  changeBtnText: {fontSize: 12, color: COLORS.primary, fontWeight: '600'},
  collectionGrid: {flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between'},
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
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addBtnText: {color: COLORS.white, fontSize: 16, fontWeight: '600'},
});

// ── 메인 화면 ─────────────────────────────────────────────
export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [sheetVisible, setSheetVisible] = useState(false);

  const handleAddProduct = () => {
    setSheetVisible(false);
    navigation.navigate('ProductSearch');
  };

  const goodCount = MOCK_INGREDIENT_ANALYSIS.filter(i => i.rating === 'good').length;
  const cautionCount = MOCK_INGREDIENT_ANALYSIS.filter(i => i.rating === 'caution').length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>스마트 루틴 분석</Text>
        <TouchableOpacity style={styles.editBtn} onPress={() => setSheetVisible(true)}>
          <Text style={styles.editBtnText}>편집</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* 점수 카드 */}
        <View style={styles.scoreCard}>
          <ScoreCircle score={ROUTINE_SCORE} />
          <View style={styles.scoreSummaryRow}>
            <View style={styles.scoreSummaryItem}>
              <View style={[styles.summaryDot, {backgroundColor: COLORS.success}]} />
              <Text style={styles.summaryText}>안전 성분</Text>
              <Text style={styles.summaryNum}>{goodCount}종</Text>
            </View>
            <View style={styles.scoreDivider} />
            <View style={styles.scoreSummaryItem}>
              <View style={[styles.summaryDot, {backgroundColor: COLORS.warning}]} />
              <Text style={styles.summaryText}>주의 성분</Text>
              <Text style={styles.summaryNum}>{cautionCount}종</Text>
            </View>
            <View style={styles.scoreDivider} />
            <View style={styles.scoreSummaryItem}>
              <View style={[styles.summaryDot, {backgroundColor: COLORS.gray300}]} />
              <Text style={styles.summaryText}>제품 수</Text>
              <Text style={styles.summaryNum}>{MOCK_STEPS.length}개</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.analyzeBtn}
            onPress={() => navigation.navigate('Insight', {productIds: MOCK_STEPS.map(s => s.id)})}
            activeOpacity={0.85}>
            <Text style={styles.analyzeBtnText}>상세 분석 리포트 보기</Text>
            <Text style={styles.analyzeBtnArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* 스킨케어 단계 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>스킨케어 단계</Text>
            <Text style={styles.sectionCount}>{MOCK_STEPS.length}개 제품</Text>
          </View>
          {MOCK_STEPS.map(item => (
            <StepItem key={item.id} item={item} />
          ))}
        </View>

        {/* 성분 분석 리스트 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>성분 분석 리스트</Text>
            <Text style={styles.sectionCount}>{MOCK_INGREDIENT_ANALYSIS.length}종</Text>
          </View>
          <View style={styles.analysisCard}>
            {MOCK_INGREDIENT_ANALYSIS.map((item, index) => (
              <IngredientAnalysisItem key={index} item={item} />
            ))}
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setSheetVisible(true)} activeOpacity={0.85}>
        <Text style={styles.fabIcon}>＋</Text>
        <Text style={styles.fabText}>루틴 수집하기</Text>
      </TouchableOpacity>

      <RoutineCollectionSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onAddProduct={handleAddProduct}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.gray100},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  headerTitle: {fontSize: 18, fontWeight: '700', color: COLORS.gray900},
  editBtn: {paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: COLORS.gray100},
  editBtnText: {fontSize: 13, color: COLORS.gray700, fontWeight: '500'},
  scrollContent: {padding: 16, paddingBottom: 90},
  scoreCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  scoreSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
  },
  scoreSummaryItem: {alignItems: 'center', gap: 4, flex: 1},
  scoreDivider: {width: 1, backgroundColor: COLORS.gray200, marginVertical: 4},
  summaryDot: {width: 8, height: 8, borderRadius: 4},
  summaryText: {fontSize: 11, color: COLORS.gray500},
  summaryNum: {fontSize: 14, fontWeight: '700', color: COLORS.gray900},
  section: {marginBottom: 16},
  sectionHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10},
  sectionTitle: {fontSize: 16, fontWeight: '700', color: COLORS.gray900},
  sectionCount: {fontSize: 12, color: COLORS.gray500},
  analysisCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
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
  analyzeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
  },
  analyzeBtnText: {fontSize: 14, fontWeight: '600', color: COLORS.primaryDark},
  analyzeBtnArrow: {fontSize: 14, color: COLORS.primaryDark},
});
