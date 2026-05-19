import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/entities/user.dart';
import '../../domain/usecases/login.dart';

part 'auth_state.dart';

/// Cubit لإدارة حالة المصادقة (تسجيل الدخول بالبريد وكلمة المرور).
class AuthCubit extends Cubit<AuthState> {
  final Login loginUseCase;

  AuthCubit({required this.loginUseCase}) : super(const AuthState());

  Future<void> login({
    required String email,
    required String password,
  }) async {
    emit(state.copyWith(status: AuthStatus.loading));
    final result = await loginUseCase(
      LoginParams(email: email, password: password),
    );
    result.fold(
      (failure) => emit(state.copyWith(
        status: AuthStatus.error,
        errorMessage: failure.message,
      )),
      (user) => emit(state.copyWith(
        status: AuthStatus.authenticated,
        user: user,
      )),
    );
  }

  void reset() => emit(const AuthState());
}
