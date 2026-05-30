import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/usecases/usecase.dart';
import '../../domain/entities/company.dart';
import '../../domain/usecases/get_companies.dart';
import '../../domain/usecases/get_companies_by_category.dart';
import '../../domain/usecases/get_companies_by_sub_service.dart';

part 'companies_state.dart';

/// Cubit لإدارة قائمة الشركات ضمن تصنيف أو خدمة فرعية مع الفرز.
class CompaniesCubit extends Cubit<CompaniesState> {
  final GetCompaniesByCategory getCompaniesByCategory;
  final GetCompaniesBySubService getCompaniesBySubService;
  final GetCompanies getCompanies;

  CompaniesCubit({
    required this.getCompaniesByCategory,
    required this.getCompaniesBySubService,
    required this.getCompanies,
  }) : super(const CompaniesState());

  Future<void> load(String categoryId) async {
    emit(state.copyWith(status: CompaniesStatus.loading));
    final result = categoryId.isEmpty
        ? await getCompanies(const NoParams())
        : await getCompaniesByCategory(categoryId);
    result.fold(
      (failure) => emit(state.copyWith(
        status: CompaniesStatus.failure,
        errorMessage: failure.message,
      )),
      (companies) => emit(state.copyWith(
        status: CompaniesStatus.success,
        companies: _sorted(companies, state.filterIndex),
      )),
    );
  }

  Future<void> loadBySubService(String subServiceId) async {
    emit(state.copyWith(status: CompaniesStatus.loading));
    final result = await getCompaniesBySubService(subServiceId);
    result.fold(
      (failure) => emit(state.copyWith(
        status: CompaniesStatus.failure,
        errorMessage: failure.message,
      )),
      (companies) => emit(state.copyWith(
        status: CompaniesStatus.success,
        companies: _sorted(companies, state.filterIndex),
      )),
    );
  }

  void setFilter(int index) {
    emit(state.copyWith(
      filterIndex: index,
      companies: _sorted(state.companies, index),
    ));
  }

  List<Company> _sorted(List<Company> companies, int filterIndex) {
    final sorted = [...companies];
    switch (filterIndex) {
      case 1:
        sorted.sort((a, b) => b.rating.compareTo(a.rating));
        break;
      case 2:
        sorted.sort((a, b) => a.distanceKm.compareTo(b.distanceKm));
        break;
      default:
        sorted.sort((a, b) => b.reviewsCount.compareTo(a.reviewsCount));
    }
    return sorted;
  }
}
