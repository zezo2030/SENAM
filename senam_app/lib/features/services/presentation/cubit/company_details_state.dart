part of 'company_details_cubit.dart';

enum CompanyDetailsStatus { initial, loading, success, failure }

class CompanyDetailsState extends Equatable {
  final CompanyDetailsStatus status;
  final List<Review> reviews;
  final String? errorMessage;
  final bool submittingReview;
  final String? submitErrorMessage;

  const CompanyDetailsState({
    this.status = CompanyDetailsStatus.initial,
    this.reviews = const [],
    this.errorMessage,
    this.submittingReview = false,
    this.submitErrorMessage,
  });

  CompanyDetailsState copyWith({
    CompanyDetailsStatus? status,
    List<Review>? reviews,
    String? errorMessage,
    bool? submittingReview,
    String? submitErrorMessage,
  }) {
    return CompanyDetailsState(
      status: status ?? this.status,
      reviews: reviews ?? this.reviews,
      errorMessage: errorMessage,
      submittingReview: submittingReview ?? this.submittingReview,
      submitErrorMessage: submitErrorMessage,
    );
  }

  @override
  List<Object?> get props => [
        status,
        reviews,
        errorMessage,
        submittingReview,
        submitErrorMessage,
      ];
}
