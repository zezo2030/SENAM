import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/car_rental.dart';
import '../repositories/car_rental_repository.dart';

/// Use Case: جلب قائمة سيارات التأجير.
class GetCars implements UseCase<List<CarRental>, NoParams> {
  final CarRentalRepository repository;
  const GetCars(this.repository);

  @override
  Future<Either<Failure, List<CarRental>>> call(NoParams params) {
    return repository.getCars();
  }
}
