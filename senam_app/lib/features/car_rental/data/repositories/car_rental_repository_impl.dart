import 'package:dartz/dartz.dart';
import '../../../../core/error/exceptions.dart';
import '../../../../core/error/failures.dart';
import '../../domain/entities/car_rental.dart';
import '../../domain/repositories/car_rental_repository.dart';
import '../datasources/car_rental_local_datasource.dart';

/// تنفيذ مستودع تأجير السيارات — يحوّل الاستثناءات إلى Failures.
class CarRentalRepositoryImpl implements CarRentalRepository {
  final CarRentalDataSource dataSource;
  const CarRentalRepositoryImpl(this.dataSource);

  @override
  Future<Either<Failure, List<CarRental>>> getCars() async {
    try {
      final cars = await dataSource.getCars();
      return Right(cars);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } on CacheException catch (e) {
      return Left(CacheFailure(e.message));
    } catch (_) {
      return const Left(ServerFailure());
    }
  }
}
