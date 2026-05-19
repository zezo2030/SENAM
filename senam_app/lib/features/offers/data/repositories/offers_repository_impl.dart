import 'package:dartz/dartz.dart';
import '../../../../core/error/exceptions.dart';
import '../../../../core/error/failures.dart';
import '../../domain/entities/offer.dart';
import '../../domain/repositories/offers_repository.dart';
import '../datasources/offers_local_datasource.dart';

/// تنفيذ مستودع العروض — يحوّل الاستثناءات إلى Failures.
class OffersRepositoryImpl implements OffersRepository {
  final OffersDataSource dataSource;
  const OffersRepositoryImpl(this.dataSource);

  @override
  Future<Either<Failure, List<Offer>>> getOffers() async {
    try {
      final offers = await dataSource.getOffers();
      return Right(offers);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } on CacheException catch (e) {
      return Left(CacheFailure(e.message));
    } catch (_) {
      return const Left(ServerFailure());
    }
  }
}
