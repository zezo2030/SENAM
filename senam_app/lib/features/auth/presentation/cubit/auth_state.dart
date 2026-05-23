part of 'auth_cubit.dart';

enum AuthStatus {
  initial,
  submitting,
  authenticated,
  savingProfile,
  profileSaved,
  error,
}

class AuthState extends Equatable {
  final AuthStatus status;
  final String? email;
  final User? user;
  final String? errorMessage;

  /// True when login/register succeeded but the user has no displayName yet —
  /// the UI should route to the complete-profile page.
  final bool needsProfileCompletion;

  const AuthState({
    this.status = AuthStatus.initial,
    this.email,
    this.user,
    this.errorMessage,
    this.needsProfileCompletion = false,
  });

  AuthState copyWith({
    AuthStatus? status,
    String? email,
    User? user,
    String? errorMessage,
    bool? needsProfileCompletion,
  }) {
    return AuthState(
      status: status ?? this.status,
      email: email ?? this.email,
      user: user ?? this.user,
      errorMessage: errorMessage,
      needsProfileCompletion:
          needsProfileCompletion ?? this.needsProfileCompletion,
    );
  }

  @override
  List<Object?> get props =>
      [status, email, user, errorMessage, needsProfileCompletion];
}
