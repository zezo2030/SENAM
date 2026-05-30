part of 'favorites_cubit.dart';

enum FavoritesStatus { initial, loading, guest, success, failure }

class FavoritesState extends Equatable {
  final FavoritesStatus status;
  final List<Company> companies;
  final String? errorMessage;

  const FavoritesState({
    this.status = FavoritesStatus.initial,
    this.companies = const [],
    this.errorMessage,
  });

  FavoritesState copyWith({
    FavoritesStatus? status,
    List<Company>? companies,
    String? errorMessage,
  }) {
    return FavoritesState(
      status: status ?? this.status,
      companies: companies ?? this.companies,
      errorMessage: errorMessage,
    );
  }

  @override
  List<Object?> get props => [status, companies, errorMessage];
}
