part of 'home_cubit.dart';

enum HomeStatus { initial, loading, success, failure }

class HomeState extends Equatable {
  final HomeStatus status;
  final List<ServiceCategory> categories;
  final List<Company> trustedCompanies;
  final List<Offer> offers;
  final String? errorMessage;

  const HomeState({
    this.status = HomeStatus.initial,
    this.categories = const [],
    this.trustedCompanies = const [],
    this.offers = const [],
    this.errorMessage,
  });

  HomeState copyWith({
    HomeStatus? status,
    List<ServiceCategory>? categories,
    List<Company>? trustedCompanies,
    List<Offer>? offers,
    String? errorMessage,
  }) {
    return HomeState(
      status: status ?? this.status,
      categories: categories ?? this.categories,
      trustedCompanies: trustedCompanies ?? this.trustedCompanies,
      offers: offers ?? this.offers,
      errorMessage: errorMessage,
    );
  }

  @override
  List<Object?> get props =>
      [status, categories, trustedCompanies, offers, errorMessage];
}
