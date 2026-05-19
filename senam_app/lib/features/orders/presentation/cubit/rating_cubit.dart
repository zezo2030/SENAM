import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/usecases/submit_review.dart';

part 'rating_state.dart';

/// Cubit لإدارة إرسال تقييم الخدمة.
class RatingCubit extends Cubit<RatingState> {
  final SubmitReview submitReview;

  RatingCubit({required this.submitReview}) : super(const RatingState());

  Future<void> submit({
    required String orderNumber,
    required int companyStars,
    required int techStars,
    required String comment,
  }) async {
    emit(state.copyWith(status: RatingStatus.loading));
    final result = await submitReview(SubmitReviewParams(
      orderNumber: orderNumber,
      companyStars: companyStars,
      techStars: techStars,
      comment: comment,
    ));
    result.fold(
      (failure) => emit(state.copyWith(
        status: RatingStatus.failure,
        errorMessage: failure.message,
      )),
      (_) => emit(state.copyWith(status: RatingStatus.success)),
    );
  }
}
