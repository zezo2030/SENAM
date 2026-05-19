import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../entities/booking.dart';

/// عقد مستودع الحجز — تُنفّذه طبقة الـ Data.
abstract class BookingRepository {
  /// إنشاء حجز جديد وإرجاع رقم الطلب المُولّد.
  Future<Either<Failure, String>> createBooking(Booking booking);
}
