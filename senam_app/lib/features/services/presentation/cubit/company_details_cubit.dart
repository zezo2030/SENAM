import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/entities/review.dart';
import '../../domain/usecases/get_company_reviews.dart';
import '../../domain/usecases/submit_company_review.dart';

part 'company_details_state.dart';

/// Cubit لإدارة تفاصيل الشركة (التقييمات).
class CompanyDetailsCubit extends Cubit<CompanyDetailsState> {
  final GetCompanyReviews getCompanyReviews;
  final SubmitCompanyReview submitCompanyReview;

  CompanyDetailsCubit({
    required this.getCompanyReviews,
    required this.submitCompanyReview,
  })
      : super(const CompanyDetailsState());

  Future<void> loadReviews(String companyId) async {
    emit(state.copyWith(status: CompanyDetailsStatus.loading));
    final result = await getCompanyReviews(companyId);
    result.fold(
      (failure) => emit(state.copyWith(
        status: CompanyDetailsStatus.failure,
        errorMessage: failure.message,
      )),
      (reviews) => emit(state.copyWith(
        status: CompanyDetailsStatus.success,
        reviews: reviews,
      )),
    );
  }

  Future<bool> submitReview({
    required String companyId,
    required int rating,
    String? comment,
  }) async {
    emit(state.copyWith(
      submittingReview: true,
      submitErrorMessage: null,
    ));
    final result = await submitCompanyReview(
      SubmitCompanyReviewParams(
        companyId: companyId,
        rating: rating,
        comment: comment,
      ),
    );
    return result.fold(
      (failure) {
        emit(state.copyWith(
          submittingReview: false,
          submitErrorMessage: failure.message,
        ));
        return false;
      },
      (review) {
        emit(state.copyWith(
          status: CompanyDetailsStatus.success,
          reviews: [review, ...state.reviews],
          submittingReview: false,
          submitErrorMessage: null,
        ));
        return true;
      },
    );
  }
}
