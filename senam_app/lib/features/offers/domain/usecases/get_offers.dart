import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/offer.dart';
import '../repositories/offers_repository.dart';

/// Use Case: جلب قائمة العروض والكوبونات.
class GetOffers implements UseCase<List<Offer>, NoParams> {
  final OffersRepository repository;
  const GetOffers(this.repository);

  @override
  Future<Either<Failure, List<Offer>>> call(NoParams params) {
    return repository.getOffers();
  }
}
