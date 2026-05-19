import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/entities/review.dart';
import '../../domain/usecases/get_company_reviews.dart';

part 'company_details_state.dart';

/// Cubit لإدارة تفاصيل الشركة (التقييمات).
class CompanyDetailsCubit extends Cubit<CompanyDetailsState> {
  final GetCompanyReviews getCompanyReviews;

  CompanyDetailsCubit({required this.getCompanyReviews})
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
}
