import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/review.dart';
import '../repositories/services_repository.dart';

class SubmitCompanyReview
    implements UseCase<Review, SubmitCompanyReviewParams> {
  final ServicesRepository repository;
  const SubmitCompanyReview(this.repository);

  @override
  Future<Either<Failure, Review>> call(
      SubmitCompanyReviewParams params) {
    return repository.submitCompanyReview(
      companyId: params.companyId,
      rating: params.rating,
      comment: params.comment,
    );
  }
}

class SubmitCompanyReviewParams extends Equatable {
  final String companyId;
  final int rating;
  final String? comment;

  const SubmitCompanyReviewParams({
    required this.companyId,
    required this.rating,
    this.comment,
  });

  @override
  List<Object?> get props => [companyId, rating, comment];
}
