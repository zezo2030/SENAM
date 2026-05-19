import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/booking.dart';
import '../repositories/booking_repository.dart';

/// Use Case: إنشاء حجز جديد.
class CreateBooking implements UseCase<String, Booking> {
  final BookingRepository repository;
  const CreateBooking(this.repository);

  @override
  Future<Either<Failure, String>> call(Booking params) {
    return repository.createBooking(params);
  }
}
