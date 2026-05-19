import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/usecases/usecase.dart';
import '../../domain/entities/user_profile.dart';
import '../../domain/usecases/get_profile.dart';

part 'account_state.dart';

/// Cubit لإدارة حالة شاشة الحساب.
class AccountCubit extends Cubit<AccountState> {
  final GetProfile getProfile;

  AccountCubit({required this.getProfile}) : super(const AccountState());

  Future<void> load() async {
    emit(state.copyWith(status: AccountStatus.loading));
    final result = await getProfile(const NoParams());
    result.fold(
      (failure) => emit(state.copyWith(
        status: AccountStatus.failure,
        errorMessage: failure.message,
      )),
      (profile) => emit(state.copyWith(
        status: AccountStatus.success,
        profile: profile,
      )),
    );
  }
}
