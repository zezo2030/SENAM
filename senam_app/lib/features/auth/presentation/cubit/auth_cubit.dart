import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/entities/user.dart';
import '../../domain/usecases/login_with_password.dart';
import '../../domain/usecases/register_account.dart';
import '../../domain/usecases/update_profile.dart';

part 'auth_state.dart';

/// Cubit لإدارة تدفق المصادقة عبر البريد وكلمة المرور للعملاء.
class AuthCubit extends Cubit<AuthState> {
  final LoginWithPassword loginUseCase;
  final RegisterAccount registerUseCase;
  final UpdateProfile updateProfileUseCase;

  AuthCubit({
    required this.loginUseCase,
    required this.registerUseCase,
    required this.updateProfileUseCase,
  }) : super(const AuthState());

  Future<void> login({
    required String email,
    required String password,
  }) async {
    emit(state.copyWith(status: AuthStatus.submitting, email: email));
    final result = await loginUseCase(
      LoginWithPasswordParams(email: email, password: password),
    );
    result.fold(
      (failure) => emit(state.copyWith(
        status: AuthStatus.error,
        errorMessage: failure.message,
      )),
      (user) => emit(state.copyWith(
        status: AuthStatus.authenticated,
        user: user,
        needsProfileCompletion: user.name.isEmpty,
      )),
    );
  }

  Future<void> register({
    required String email,
    required String password,
    String? displayName,
    String? phone,
  }) async {
    emit(state.copyWith(status: AuthStatus.submitting, email: email));
    final result = await registerUseCase(
      RegisterAccountParams(
        email: email,
        password: password,
        displayName: displayName,
        phone: phone,
      ),
    );
    result.fold(
      (failure) => emit(state.copyWith(
        status: AuthStatus.error,
        errorMessage: failure.message,
      )),
      (user) => emit(state.copyWith(
        status: AuthStatus.authenticated,
        user: user,
        needsProfileCompletion: user.name.isEmpty,
      )),
    );
  }

  Future<void> updateProfile({
    String? displayName,
    String? phone,
    String? locale,
  }) async {
    emit(state.copyWith(status: AuthStatus.savingProfile));
    final result = await updateProfileUseCase(
      UpdateProfileParams(
        displayName: displayName,
        phone: phone,
        locale: locale,
      ),
    );
    result.fold(
      (failure) => emit(state.copyWith(
        status: AuthStatus.error,
        errorMessage: failure.message,
      )),
      (user) => emit(state.copyWith(
        status: AuthStatus.profileSaved,
        user: user,
        needsProfileCompletion: false,
      )),
    );
  }

  void reset() => emit(const AuthState());
}
