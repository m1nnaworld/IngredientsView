import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {COLORS} from '@/constants';
import {RootStackParamList} from '@/types';
import {
  analyzeRoutine,
  RoutineAnalysisResult,
  AnalysisConflict,
  DuplicateIngredient,
  ExpertTip,
} from '@/api/analysis';

// ── 상수 ───────────────────────────────────────────────────
const DARK = {
  bg: '#141F1A',
  card: '#1C2B23',
  section: '#243029',
  tip: '#1A3326',
  border: '#2E3F36',
  text: '#FFFFFF',
  subtext: '#7A9E8C',
  muted: '#4A6358',
  primary: COLORS.primary,
};

type InsightRoute = RouteProp<RootStackParamList, 'Insight'>;

// ── 헬퍼 ───────────────────────────────────────────────────
function severityDots(severity: number) {
  return Array.from({length: 5}, (_, i) => i < severity);
}

function interactionColor(type: AnalysisConflict['interactionType']) {
  if (type === 'conflict') return '#FF6B6B';
  if (type === 'synergy') return COLORS.primary;
  return '#F9A825';
}

function interactionLabel(type: AnalysisConflict['interactionType']) {
  if (type === 'conflict') return '충돌';
  if (type === 'synergy') return '시너지';
  return '주의';
}

function tipIcon(type: ExpertTip['type']) {
  if (type === 'success') return '✓';
  if (type === 'warning') return '⚠';
  return '💡';
}

// ── 점수 원형 ──────────────────────────────────────────────
function GradeCircle({score, grade}: {score: number; grade: string}) {
  const color =
    score >= 75 ? COLORS.primary : score >= 50 ? '#F9A825' : '#FF6B6B';
  return (
    <View style={gradeStyles.wrap}>
      <View style={[gradeStyles.ring, {borderColor: color}]}>
        <Text style={[gradeStyles.score, {color}]}>{score}</Text>
        <Text style={gradeStyles.unit}>점</Text>
      </View>
      <View style={[gradeStyles.badge, {backgroundColor: color}]}>
        <Text style={gradeStyles.badgeText}>{grade}등급</Text>
      </View>
    </View>
  );
}

const gradeStyles = StyleSheet.create({
  wrap: {alignItems: 'center'},
  ring: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 5,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  score: {fontSize: 28, fontWeight: '800'},
  unit: {fontSize: 12, color: DARK.subtext, marginTop: 6},
  badge: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: {fontSize: 12, fontWeight: '700', color: '#fff'},
});

// ── 중복 성분 카드 ─────────────────────────────────────────
function DuplicateCard({data}: {data: DuplicateIngredient[]}) {
  if (data.length === 0) return null;
  return (
    <View style={cardStyles.section}>
      <View style={cardStyles.sectionHeader}>
        <Text style={cardStyles.sectionTitle}>중복 성분 감지</Text>
        <View style={cardStyles.badge}>
          <Text style={cardStyles.badgeText}>{data.length}건 발견</Text>
        </View>
      </View>
      {data.map((d, i) => (
        <View key={i} style={cardStyles.duplicateRow}>
          <View style={cardStyles.duplicateLeft}>
            <Text style={cardStyles.ingredientName}>
              {d.ingredient.name}
            </Text>
            <Text style={cardStyles.ingredientKo}>
              ({d.ingredient.nameKo})
            </Text>
          </View>
          <Text style={cardStyles.productList}>
            {d.foundInProducts.map(p => p.name).join(', ')}
          </Text>
        </View>
      ))}
    </View>
  );
}

const cardStyles = StyleSheet.create({
  section: {
    backgroundColor: DARK.section,
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {fontSize: 13, color: DARK.subtext, fontWeight: '600'},
  badge: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {fontSize: 11, color: '#fff', fontWeight: '700'},
  duplicateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  duplicateLeft: {flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1},
  ingredientName: {fontSize: 14, fontWeight: '600', color: DARK.text},
  ingredientKo: {fontSize: 12, color: DARK.subtext},
  productList: {fontSize: 12, color: DARK.subtext, textAlign: 'right', maxWidth: '40%'},
});

// ── Expert Tip 카드 ────────────────────────────────────────
function TipCard({tip}: {tip: ExpertTip}) {
  const isWarning = tip.type === 'warning';
  const isSuccess = tip.type === 'success';
  const accentColor = isWarning ? '#FF6B6B' : isSuccess ? COLORS.primary : '#F9A825';

  return (
    <View style={[tipStyles.card, {borderLeftColor: accentColor}]}>
      <View style={tipStyles.header}>
        <Text style={[tipStyles.icon, {color: accentColor}]}>
          {tipIcon(tip.type)}
        </Text>
        <Text style={[tipStyles.label, {color: accentColor}]}>
          {isWarning ? 'WARNING' : isSuccess ? 'GREAT COMBO' : 'EXPERT TIP'}
        </Text>
      </View>
      <Text style={tipStyles.message}>{tip.message}</Text>
    </View>
  );
}

const tipStyles = StyleSheet.create({
  card: {
    backgroundColor: DARK.tip,
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    borderLeftWidth: 3,
  },
  header: {flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6},
  icon: {fontSize: 14, fontWeight: '700'},
  label: {fontSize: 11, fontWeight: '800', letterSpacing: 0.8},
  message: {fontSize: 14, color: DARK.text, lineHeight: 20},
});

// ── 충돌/시너지 아이템 ─────────────────────────────────────
function InteractionItem({item}: {item: AnalysisConflict}) {
  const color = interactionColor(item.interactionType);
  const dots = severityDots(item.severity);
  const [expanded, setExpanded] = useState(false);

  return (
    <TouchableOpacity
      style={interStyles.row}
      onPress={() => setExpanded(v => !v)}
      activeOpacity={0.8}>
      <View style={interStyles.top}>
        <View style={[interStyles.typeBadge, {backgroundColor: color + '22'}]}>
          <Text style={[interStyles.typeText, {color}]}>
            {interactionLabel(item.interactionType)}
          </Text>
        </View>
        <Text style={interStyles.pairText} numberOfLines={1}>
          {item.ingredientA.nameKo || item.ingredientA.name}
          {'  ↔  '}
          {item.ingredientB.nameKo || item.ingredientB.name}
        </Text>
        <View style={interStyles.dots}>
          {dots.map((filled, i) => (
            <View
              key={i}
              style={[
                interStyles.dot,
                {backgroundColor: filled ? color : DARK.muted},
              ]}
            />
          ))}
        </View>
      </View>
      <Text style={interStyles.products}>
        {item.productA.name} · {item.productB.name}
      </Text>
      {expanded && (
        <Text style={interStyles.reason}>{item.reason}</Text>
      )}
      {item.timeOfDay && (
        <View style={interStyles.timeTag}>
          <Text style={interStyles.timeText}>
            {item.timeOfDay === 'morning' ? '🌅 아침 주의' :
             item.timeOfDay === 'evening' ? '🌙 저녁 권장' : '☀🌙 아침/저녁'}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const interStyles = StyleSheet.create({
  row: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: DARK.border,
  },
  top: {flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4},
  typeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeText: {fontSize: 11, fontWeight: '700'},
  pairText: {flex: 1, fontSize: 13, fontWeight: '600', color: DARK.text},
  dots: {flexDirection: 'row', gap: 3},
  dot: {width: 6, height: 6, borderRadius: 3},
  products: {fontSize: 11, color: DARK.subtext, marginBottom: 2},
  reason: {
    fontSize: 12,
    color: DARK.subtext,
    lineHeight: 18,
    marginTop: 6,
    padding: 8,
    backgroundColor: DARK.bg,
    borderRadius: 8,
  },
  timeTag: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: DARK.section,
    borderRadius: 6,
  },
  timeText: {fontSize: 11, color: DARK.subtext},
});

// ── 섹션 헤더 ──────────────────────────────────────────────
function SectionHeader({
  title,
  count,
  color = DARK.subtext,
}: {
  title: string;
  count: number;
  color?: string;
}) {
  return (
    <View style={secStyles.row}>
      <Text style={secStyles.title}>{title}</Text>
      <Text style={[secStyles.count, {color}]}>{count}건</Text>
    </View>
  );
}

const secStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  title: {fontSize: 13, fontWeight: '700', color: DARK.subtext, letterSpacing: 0.5},
  count: {fontSize: 12, fontWeight: '600'},
});

// ── 메인 화면 ──────────────────────────────────────────────
export default function InsightScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<InsightRoute>();
  const {productIds} = route.params;

  const [result, setResult] = useState<RoutineAnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    analyzeRoutine(productIds)
      .then(setResult)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>성분 조합 분석 중...</Text>
      </View>
    );
  }

  if (error || !result) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>분석에 실패했어요</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backLink}>← 돌아가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const allInteractions = [
    ...result.conflicts,
    ...result.cautions,
    ...result.synergies,
  ].sort((a, b) => b.severity - a.severity);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>상세 분석 리포트</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* 점수 카드 */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreRow}>
            <GradeCircle score={result.score} grade={result.grade} />
            <View style={styles.scoreBreakdown}>
              <Text style={styles.summaryText}>{result.summary}</Text>
              <View style={styles.breakdownGrid}>
                <View style={styles.breakdownItem}>
                  <Text style={styles.breakdownNum}>{result.conflicts.length}</Text>
                  <Text style={styles.breakdownLabel}>충돌</Text>
                </View>
                <View style={styles.breakdownDivider} />
                <View style={styles.breakdownItem}>
                  <Text style={[styles.breakdownNum, {color: COLORS.primary}]}>
                    {result.synergies.length}
                  </Text>
                  <Text style={styles.breakdownLabel}>시너지</Text>
                </View>
                <View style={styles.breakdownDivider} />
                <View style={styles.breakdownItem}>
                  <Text style={styles.breakdownNum}>{result.duplicates.length}</Text>
                  <Text style={styles.breakdownLabel}>중복</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* 중복 성분 */}
        {result.duplicates.length > 0 && (
          <DuplicateCard data={result.duplicates} />
        )}

        {/* Expert Tips */}
        {result.expertTips.length > 0 && (
          <View style={styles.tipsWrap}>
            {result.expertTips.map(tip => (
              <TipCard key={tip.id} tip={tip} />
            ))}
          </View>
        )}

        {/* 상호작용 전체 */}
        {allInteractions.length > 0 && (
          <View style={styles.interactionCard}>
            <SectionHeader
              title="성분 조합 분석"
              count={allInteractions.length}
            />
            <Text style={styles.tapHint}>각 항목을 탭하면 상세 이유를 볼 수 있어요</Text>
            {allInteractions.map((item, i) => (
              <InteractionItem key={i} item={item} />
            ))}
          </View>
        )}

        {/* 점수 상세 */}
        <View style={styles.breakdownCard}>
          <Text style={styles.breakdownTitle}>점수 산출 내역</Text>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownKey}>기본 점수</Text>
            <Text style={styles.breakdownVal}>+{result.scoreBreakdown.base}</Text>
          </View>
          {result.scoreBreakdown.ewgPenalty > 0 && (
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownKey}>EWG 위험 성분</Text>
              <Text style={[styles.breakdownVal, styles.minus]}>
                -{result.scoreBreakdown.ewgPenalty}
              </Text>
            </View>
          )}
          {result.scoreBreakdown.conflictPenalty > 0 && (
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownKey}>성분 충돌/주의</Text>
              <Text style={[styles.breakdownVal, styles.minus]}>
                -{result.scoreBreakdown.conflictPenalty}
              </Text>
            </View>
          )}
          {result.scoreBreakdown.synergyBonus > 0 && (
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownKey}>시너지 보너스</Text>
              <Text style={[styles.breakdownVal, styles.plus]}>
                +{result.scoreBreakdown.synergyBonus}
              </Text>
            </View>
          )}
          <View style={[styles.breakdownRow, styles.totalRow]}>
            <Text style={styles.totalKey}>최종 점수</Text>
            <Text style={styles.totalVal}>{result.scoreBreakdown.final}점</Text>
          </View>
        </View>

        <View style={{height: 32}} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: DARK.bg},
  center: {
    flex: 1,
    backgroundColor: DARK.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {fontSize: 14, color: DARK.subtext, marginTop: 8},
  errorText: {fontSize: 16, color: DARK.text},
  backLink: {fontSize: 14, color: COLORS.primary},

  // 헤더
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: DARK.border,
  },
  backBtn: {width: 36, alignItems: 'center'},
  backIcon: {fontSize: 20, color: DARK.text},
  headerTitle: {fontSize: 16, fontWeight: '700', color: DARK.text},

  scroll: {flex: 1},
  scrollContent: {padding: 16},

  // 점수 카드
  scoreCard: {
    backgroundColor: DARK.card,
    borderRadius: 16,
    padding: 16,
  },
  scoreRow: {flexDirection: 'row', alignItems: 'center', gap: 16},
  scoreBreakdown: {flex: 1},
  summaryText: {
    fontSize: 13,
    color: DARK.text,
    lineHeight: 18,
    marginBottom: 12,
  },
  breakdownGrid: {flexDirection: 'row', alignItems: 'center'},
  breakdownItem: {flex: 1, alignItems: 'center', gap: 2},
  breakdownDivider: {width: 1, height: 28, backgroundColor: DARK.border},
  breakdownNum: {fontSize: 18, fontWeight: '800', color: '#FF6B6B'},
  breakdownLabel: {fontSize: 11, color: DARK.subtext},

  tipsWrap: {marginTop: 0},

  // 상호작용 카드
  interactionCard: {
    backgroundColor: DARK.card,
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
  },
  tapHint: {fontSize: 11, color: DARK.muted, marginBottom: 8},

  // 점수 내역
  breakdownCard: {
    backgroundColor: DARK.card,
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
  },
  breakdownTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: DARK.subtext,
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: DARK.border,
  },
  breakdownKey: {fontSize: 13, color: DARK.subtext},
  breakdownVal: {fontSize: 13, fontWeight: '600', color: DARK.text},
  minus: {color: '#FF6B6B'},
  plus: {color: COLORS.primary},
  totalRow: {
    borderBottomWidth: 0,
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: DARK.border,
  },
  totalKey: {fontSize: 14, fontWeight: '700', color: DARK.text},
  totalVal: {fontSize: 16, fontWeight: '800', color: COLORS.primary},
});
