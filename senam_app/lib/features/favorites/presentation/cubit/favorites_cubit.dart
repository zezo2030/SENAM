import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/usecases/usecase.dart';
import '../../../services/domain/entities/company.dart';
import '../../../services/domain/usecases/get_favorite_companies.dart';

part 'favorites_state.dart';

/// Cubit المفضلة — يعتمد على Use Case من ميزة `services`.
class FavoritesCubit extends Cubit<FavoritesState> {
  final GetFavoriteCompanies getFavoriteCompanies;

  FavoritesCubit({required this.getFavoriteCompanies})
      : super(const FavoritesState());

  Future<void> load() async {
    emit(state.copyWith(status: FavoritesStatus.loading));
    final result = await getFavoriteCompanies(const NoParams());
    result.fold(
      (failure) => emit(state.copyWith(
        status: FavoritesStatus.failure,
        errorMessage: failure.message,
      )),
      (companies) => emit(state.copyWith(
        status: FavoritesStatus.success,
        companies: companies,
      )),
    );
  }
}
