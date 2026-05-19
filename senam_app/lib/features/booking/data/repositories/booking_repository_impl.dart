import 'package:dartz/dartz.dart';
import '../../../../core/error/exceptions.dart';
import '../../../../core/error/failures.dart';
import '../../domain/entities/booking.dart';
import '../../domain/repositories/booking_repository.dart';
import '../datasources/booking_local_datasource.dart';
import '../models/booking_model.dart';

/// تنفيذ مستودع الحجز — يحوّل الاستثناءات إلى Failures.
class BookingRepositoryImpl implements BookingRepository {
  final BookingDataSource dataSource;
  const BookingRepositoryImpl(this.dataSource);

  @override
  Future<Either<Failure, String>> createBooking(Booking booking) async {
    try {
      final orderNumber =
          await dataSource.createBooking(BookingModel.fromEntity(booking));
      return Right(orderNumber);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } on NetworkException catch (e) {
      return Left(NetworkFailure(e.message));
    } catch (_) {
      return const Left(ServerFailure());
    }
  }
}
