import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AppBackground from '../components/ui/AppBackground';
import GlassCard from '../components/ui/GlassCard';
import PrimaryButton from '../components/ui/PrimaryButton';
import Dropdown from '../components/ui/Dropdown';
import PassengerSelector from '../components/ui/PassengerSelector';
import useTripSearch from '../hooks/useTripSearch';
import { formatCurrency, formatTime } from '../utils/bookingFormatters';

export default function BookRideScreen({ navigation }) {
  const {
    pickup,
    setPickup,
    dropoff,
    setDropoff,
    travelDate,
    setTravelDate,
    passengers,
    setPassengers,
    formattedDate,
    pickupOptions,
    dropoffOptions,
    swapRoute,
    searchTrips,
    loading: loadingTrips,
    errorMessage,
    areaOptions,
    selectedAreaId,
    setSelectedAreaId,
    sortedTrips,
  } = useTripSearch();

  const [pickupOpen, setPickupOpen] = useState(false);
  const [dropoffOpen, setDropoffOpen] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [passengerModalVisible, setPassengerModalVisible] = useState(false);

  const handleTripSelect = useCallback(
    (trip) => {
      navigation.navigate('SeatSelection', {
        trip,
        passengers,
        travelDate: formattedDate,
      });
    },
    [navigation, passengers, formattedDate]
  );

  return (
    <AppBackground>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Chọn chuyến</Text>
        <GlassCard style={styles.card}>
          <Dropdown
            label="Điểm đi"
            value={pickup}
            options={pickupOptions}
            open={pickupOpen}
            setOpen={setPickupOpen}
            onSelect={setPickup}
          />
          <TouchableOpacity style={styles.swap} onPress={swapRoute}>
            <Text style={styles.swapIcon}>↕</Text>
          </TouchableOpacity>
          <Dropdown
            label="Điểm đến"
            value={dropoff}
            options={dropoffOptions}
            open={dropoffOpen}
            setOpen={setDropoffOpen}
            onSelect={setDropoff}
          />
          <TouchableOpacity
            style={styles.fakeInput}
            onPress={() => setShowDatePicker(true)}
          >
            <Text>{formattedDate || 'Chọn ngày đi'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.fakeInput}
            onPress={() => setPassengerModalVisible(true)}
          >
            <Text>{passengers} khách</Text>
          </TouchableOpacity>
          <PrimaryButton
            title={loadingTrips ? 'Đang tìm...' : 'Tìm chuyến'}
            onPress={searchTrips}
            loading={loadingTrips}
          />
          {errorMessage ? (
            <Text style={styles.error}>{errorMessage}</Text>
          ) : null}
        </GlassCard>

        {showDatePicker && (
          <View style={styles.datePickerWrap}>
            <DateTimePicker
              value={travelDate || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                if (Platform.OS !== 'ios') setShowDatePicker(false);
                if (selectedDate) setTravelDate(selectedDate);
              }}
            />
            {Platform.OS === 'ios' ? (
              <TouchableOpacity
                style={styles.datePickerClose}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.datePickerCloseText}>Xong</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}

        {areaOptions.length > 0 && (
          <View style={styles.areaWrap}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.areaRow}
            >
              {areaOptions.map((area) => {
                const active =
                  String(selectedAreaId) === String(area.value);
                return (
                  <TouchableOpacity
                    key={area.value}
                    style={[styles.areaChip, active ? styles.areaChipActive : null]}
                    onPress={() =>
                      setSelectedAreaId(active ? '' : area.value)
                    }
                  >
                    <Text
                      style={[
                        styles.areaText,
                        active ? styles.areaTextActive : null,
                      ]}
                    >
                      {area.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {sortedTrips.map((trip) => (
          <TouchableOpacity
            key={trip._id}
            style={styles.tripCard}
            onPress={() => handleTripSelect(trip)}
          >
            <Text style={styles.tripTime}>{formatTime(trip.departureAt)}</Text>
            <Text>
              {trip.routeFrom} → {trip.routeTo}
            </Text>
            <View style={styles.tripMeta}>
              <Text style={styles.price}>
                {formatCurrency(trip.basePrice, trip.currency)}
              </Text>
              <Text style={styles.seatCount}>
                Còn {Number.isFinite(Number(trip.availableSeats)) ? trip.availableSeats : '--'} / {trip.totalSeats || '--'} ghế
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <PassengerSelector
        visible={passengerModalVisible}
        onClose={() => setPassengerModalVisible(false)}
        onConfirm={setPassengers}
        initialCount={passengers}
      />
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  card: { padding: 16 },
  swap: { alignItems: 'center', marginVertical: 10 },
  swapIcon: { fontSize: 18 },
  fakeInput: {
    padding: 12,
    backgroundColor: '#eee',
    borderRadius: 10,
    marginBottom: 10,
  },
  areaWrap: { marginTop: 20 },
  areaRow: { gap: 10, paddingHorizontal: 2 },
  areaChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  areaChipActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  areaText: { color: '#fff', fontWeight: '700' },
  areaTextActive: { color: '#0f172a' },
  datePickerWrap: {
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  datePickerClose: {
    paddingVertical: 10,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  datePickerCloseText: { fontWeight: '700' },
  tripCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginTop: 10,
  },
  tripTime: { fontWeight: '900' },
  price: { color: 'orange', fontWeight: '800' },
  tripMeta: {
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  seatCount: { color: '#0f172a', fontWeight: '700' },
  error: {
    color: '#FECACA',
    textAlign: 'center',
    fontWeight: '700',
    marginTop: 8,
  },
});
