import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../entities/car_rental.dart';

/// عقد مستودع تأجير السيارات — تُنفّذه طبقة الـ Data.
abstract class CarRentalRepository {
  Future<Either<Failure, List<CarRental>>> getCars();
}
