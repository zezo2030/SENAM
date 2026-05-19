import '../models/booking_model.dart';

/// مصدر بيانات الحجز (نسخة محلية وهمية).
///
/// تُستبدل لاحقاً بـ `BookingRemoteDataSource` يتصل بالـ API.
abstract class BookingDataSource {
  Future<String> createBooking(BookingModel booking);
}

class BookingLocalDataSource implements BookingDataSource {
  @override
  Future<String> createBooking(BookingModel booking) async {
    await Future.delayed(const Duration(milliseconds: 400));
    return '#SNM-2026-4587';
  }
}
