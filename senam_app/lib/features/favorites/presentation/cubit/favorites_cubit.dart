import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/auth/token_storage.dart';
import '../../../../core/usecases/usecase.dart';
import '../../../services/domain/entities/company.dart';
import '../../../services/domain/usecases/get_favorite_companies.dart';

part 'favorites_state.dart';

/// Cubit المفضلة — يعتمد على Use Case من ميزة `services`.
class FavoritesCubit extends Cubit<FavoritesState> {
  final GetFavoriteCompanies getFavoriteCompanies;
  final TokenStorage tokenStorage;

  FavoritesCubit({
    required this.getFavoriteCompanies,
    required this.tokenStorage,
  }) : super(const FavoritesState());

  Future<void> load() async {
    emit(state.copyWith(status: FavoritesStatus.loading));

    if (!await tokenStorage.hasRefresh()) {
      emit(state.copyWith(status: FavoritesStatus.guest));
      return;
    }

    final result = await getFavoriteCompanies(const NoParams());
    await result.fold<Future<void>>((failure) async {
      final message = failure.message.toLowerCase();
      final isAuthFailure = message.contains('token_invalid') ||
          message.contains('invalid token') ||
          message.contains('رمز المصادقة');

      if (isAuthFailure) {
        await tokenStorage.clearAll();
        emit(state.copyWith(status: FavoritesStatus.guest));
        return;
      }

      emit(state.copyWith(
        status: FavoritesStatus.failure,
        errorMessage: failure.message,
      ));
    }, (companies) async {
      emit(state.copyWith(
        status: FavoritesStatus.success,
        companies: companies,
      ));
    });
  }
}
