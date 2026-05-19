import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../repositories/orders_repository.dart';

/// Use Case: إرسال تقييم لطلب مكتمل.
class SubmitReview implements UseCase<Unit, SubmitReviewParams> {
  final OrdersRepository repository;
  const SubmitReview(this.repository);

  @override
  Future<Either<Failure, Unit>> call(SubmitReviewParams params) {
    return repository.submitReview(
      orderNumber: params.orderNumber,
      companyStars: params.companyStars,
      techStars: params.techStars,
      comment: params.comment,
    );
  }
}

class SubmitReviewParams extends Equatable {
  final String orderNumber;
  final int companyStars;
  final int techStars;
  final String comment;

  const SubmitReviewParams({
    required this.orderNumber,
    required this.companyStars,
    required this.techStars,
    required this.comment,
  });

  @override
  List<Object?> get props => [orderNumber, companyStars, techStars, comment];
}
