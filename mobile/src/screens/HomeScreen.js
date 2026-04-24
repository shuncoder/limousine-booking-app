import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Dimensions } from 'react-native';
import { colors, spacing } from "../theme/theme";
import PrimaryButton from "../components/ui/PrimaryButton";
import AppBackground from '../components/ui/AppBackground';
import GlassCard from '../components/ui/GlassCard';
import { getActiveBanners } from '../services/api';

const { width, height } = Dimensions.get('window');
const bannerWidth = Math.max(280, width - spacing.xl * 2 - spacing.lg * 2);
const bannerCardMinHeight = Math.max(300, Math.round(height * 0.5));
const bannerSlideHeight = Math.max(170, bannerCardMinHeight - 160);

export default function HomeScreen({ navigation }) {
  const [banners, setBanners] = React.useState([]);
  const [loadingBanners, setLoadingBanners] = React.useState(false);

  React.useEffect(() => {
    const run = async () => {
      setLoadingBanners(true);
      try {
        const items = await getActiveBanners();
        setBanners(items || []);
      } catch {
        setBanners([]);
      } finally {
        setLoadingBanners(false);
      }
    };

    run();
  }, []);

  return (
    <AppBackground>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <GlassCard style={[styles.card, styles.bannerCard]}>
          <Text style={styles.badge}>Banner / Carousel</Text>
          <Text style={styles.bannerTitle}>Ưu đãi nổi bật</Text>
          <Text style={styles.bannerSubtitle}>Số banner hiện có: {banners.length}</Text>

          {loadingBanners ? (
            <Text style={styles.loadingText}>Đang tải banner...</Text>
          ) : banners.length > 0 ? (
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.carousel}>
              {banners.map((banner) => (
                <View key={banner._id} style={[styles.slide, { width: bannerWidth }]}>
                  <Image source={{ uri: banner.fullImageUrl }} style={styles.slideImage} resizeMode="cover" />
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyBanner}>
              <Text style={styles.emptyBannerText}>Chưa có banner nào từ admin.</Text>
            </View>
          )}
        </GlassCard>

        <GlassCard style={styles.card}>
          <Text style={styles.badge}>Dashboard</Text>
          <Text style={styles.title}>Xin chào</Text>
          <Text style={styles.subtitle}>Bạn muốn làm gì hôm nay?</Text>
          <View style={styles.actions}>
            <PrimaryButton title="Đặt chuyến" onPress={() => navigation.navigate('BookRide')} />
            <PrimaryButton title="Chọn ghế" onPress={() => navigation.navigate('SeatSelection')} />
            <PrimaryButton title="Lịch sử chuyến" onPress={() => navigation.navigate('Lịch Sử Chuyến')} />
            <PrimaryButton title="Hồ sơ" onPress={() => navigation.navigate('Hồ Sơ')} />
          </View>
        </GlassCard>
      </ScrollView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  content: {
    paddingVertical: spacing.xl,
    gap: spacing.lg,
  },
  card: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
  },
  bannerCard: {
    minHeight: bannerCardMinHeight,
  },
  badge: {
    color: "rgba(234,240,255,0.95)",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    textTransform: "uppercase",
  },
  title: { color: colors.text, fontSize: 24, fontWeight: "900" },
  subtitle: { color: "rgba(234,240,255,0.78)", marginTop: spacing.xs, marginBottom: spacing.xl },
  actions: { gap: spacing.md },
  bannerTitle: { color: colors.text, fontSize: 20, fontWeight: '900' },
  bannerSubtitle: { color: 'rgba(234,240,255,0.78)', marginTop: spacing.xs, marginBottom: spacing.md },
  loadingText: { color: colors.muted, marginTop: spacing.sm, marginBottom: spacing.sm },
  carousel: {
    marginTop: spacing.sm,
  },
  slide: {
    height: bannerSlideHeight,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  slideImage: {
    width: '100%',
    height: '100%',
  },
  emptyBanner: {
    height: 120,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  emptyBannerText: {
    color: colors.muted,
    fontWeight: '700',
  },
});
