part of 'account_cubit.dart';

enum AccountStatus { initial, loading, success, failure }

class AccountState extends Equatable {
  final AccountStatus status;
  final UserProfile? profile;
  final String? errorMessage;

  const AccountState({
    this.status = AccountStatus.initial,
    this.profile,
    this.errorMessage,
  });

  AccountState copyWith({
    AccountStatus? status,
    UserProfile? profile,
    String? errorMessage,
  }) {
    return AccountState(
      status: status ?? this.status,
      profile: profile ?? this.profile,
      errorMessage: errorMessage,
    );
  }

  @override
  List<Object?> get props => [status, profile, errorMessage];
}
