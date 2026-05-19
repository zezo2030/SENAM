import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/review.dart';
import '../repositories/services_repository.dart';

/// Use Case: جلب تقييمات شركة.
class GetCompanyReviews implements UseCase<List<Review>, String> {
  final ServicesRepository repository;
  const GetCompanyReviews(this.repository);

  @override
  Future<Either<Failure, List<Review>>> call(String companyId) {
    return repository.getCompanyReviews(companyId);
  }
}
