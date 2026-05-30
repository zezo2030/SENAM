import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/auth/token_storage.dart';
import '../../../../core/usecases/usecase.dart';
import '../../domain/entities/user_profile.dart';
import '../../domain/usecases/get_profile.dart';

part 'account_state.dart';

/// Cubit لإدارة حالة شاشة الحساب.
class AccountCubit extends Cubit<AccountState> {
  final GetProfile getProfile;
  final TokenStorage tokenStorage;

  AccountCubit({
    required this.getProfile,
    required this.tokenStorage,
  }) : super(const AccountState());

  Future<void> load() async {
    emit(state.copyWith(status: AccountStatus.loading));

    // الضيف: لا يوجد جلسة محفوظة — نعرض CTA لتسجيل الدخول/إنشاء حساب.
    if (!await tokenStorage.hasRefresh()) {
      emit(state.copyWith(status: AccountStatus.guest));
      return;
    }

    final result = await getProfile(const NoParams());
    await result.fold<Future<void>>((failure) async {
      final message = failure.message.toLowerCase();
      final isAuthFailure = message.contains('token_invalid') ||
          message.contains('invalid token') ||
          message.contains('رمز المصادقة');

      if (isAuthFailure) {
        await tokenStorage.clearAll();
        emit(state.copyWith(status: AccountStatus.guest));
        return;
      }

      emit(state.copyWith(
        status: AccountStatus.failure,
        errorMessage: failure.message,
      ));
    }, (profile) async {
      emit(state.copyWith(
        status: AccountStatus.success,
        profile: profile,
      ));
    });
  }
}
