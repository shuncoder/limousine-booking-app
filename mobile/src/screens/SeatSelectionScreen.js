
import React from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { getTripSeats } from '../services/api';
import { colors } from '../theme/theme';
import SeatMap from '../components/SeatMap';

export default function SeatSelectionScreen({ route }) {
  const { tripId } = route.params || {};
  const [loading, setLoading] = React.useState(true);
  const [seatLayout, setSeatLayout] = React.useState(null);
  const [seats, setSeats] = React.useState({});
  const [error, setError] = React.useState("");
  const [selectedSeatId, setSelectedSeatId] = React.useState(null);

  React.useEffect(() => {
    if (!tripId) {
      setError("Không tìm thấy chuyến xe.");
      setLoading(false);
      return;
    }
    setLoading(true);
    getTripSeats(tripId)
      .then((data) => {
        setSeatLayout(data.layout || data.seatLayout || {});
        setSeats(data.seats || {});
        setError("");
      })
      .catch(() => {
        setError("Không tải được thông tin ghế.");
      })
      .finally(() => setLoading(false));
  }, [tripId]);

  const handlePressSeat = (seatId, seat) => {
    setSelectedSeatId(seatId);
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary || '#fff'} /><Text style={{color: colors.text, marginTop: 12}}>Đang tải sơ đồ ghế...</Text></View>;
  }
  if (error) {
    return <View style={styles.center}><Text style={{color: '#F00'}}>{error}</Text></View>;
  }
  if (!seatLayout || !seatLayout.rows) {
    return <View style={styles.center}><Text>Không có dữ liệu sơ đồ ghế.</Text></View>;
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
      <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 18, marginBottom: 16 }}>Chọn ghế</Text>
      <SeatMap
        seatLayout={seatLayout}
        seats={seats}
        selectedSeatId={selectedSeatId}
        onPressSeat={handlePressSeat}
      />
      <View style={{ flexDirection: 'row', marginTop: 24, gap: 16 }}>
        <View style={[styles.legendBox, { backgroundColor: '#fff', borderColor: '#ccc' }]} />
        <Text style={{ color: colors.text }}>Ghế trống</Text>
        <View style={[styles.legendBox, { backgroundColor: '#111827' }]} />
        <Text style={{ color: colors.text }}>Ghế đã đặt</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  legendBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    marginRight: 6,
  },
});