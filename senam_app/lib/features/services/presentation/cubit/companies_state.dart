part of 'companies_cubit.dart';

enum CompaniesStatus { initial, loading, success, failure }

class CompaniesState extends Equatable {
  final CompaniesStatus status;
  final List<Company> companies;
  final int filterIndex;
  final String? errorMessage;

  const CompaniesState({
    this.status = CompaniesStatus.initial,
    this.companies = const [],
    this.filterIndex = 0,
    this.errorMessage,
  });

  CompaniesState copyWith({
    CompaniesStatus? status,
    List<Company>? companies,
    int? filterIndex,
    String? errorMessage,
  }) {
    return CompaniesState(
      status: status ?? this.status,
      companies: companies ?? this.companies,
      filterIndex: filterIndex ?? this.filterIndex,
      errorMessage: errorMessage,
    );
  }

  @override
  List<Object?> get props => [status, companies, filterIndex, errorMessage];
}
