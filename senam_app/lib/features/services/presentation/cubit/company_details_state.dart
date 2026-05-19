part of 'company_details_cubit.dart';

enum CompanyDetailsStatus { initial, loading, success, failure }

class CompanyDetailsState extends Equatable {
  final CompanyDetailsStatus status;
  final List<Review> reviews;
  final String? errorMessage;

  const CompanyDetailsState({
    this.status = CompanyDetailsStatus.initial,
    this.reviews = const [],
    this.errorMessage,
  });

  CompanyDetailsState copyWith({
    CompanyDetailsStatus? status,
    List<Review>? reviews,
    String? errorMessage,
  }) {
    return CompanyDetailsState(
      status: status ?? this.status,
      reviews: reviews ?? this.reviews,
      errorMessage: errorMessage,
    );
  }

  @override
  List<Object?> get props => [status, reviews, errorMessage];
}
