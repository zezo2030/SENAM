import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../entities/offer.dart';

/// عقد مستودع العروض — تُنفّذه طبقة الـ Data.
abstract class OffersRepository {
  Future<Either<Failure, List<Offer>>> getOffers();
}
