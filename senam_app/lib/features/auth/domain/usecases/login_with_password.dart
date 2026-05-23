import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/user.dart';
import '../repositories/auth_repository.dart';

/// Use Case: تسجيل الدخول بالبريد وكلمة المرور.
class LoginWithPassword implements UseCase<User, LoginWithPasswordParams> {
  final AuthRepository repository;
  const LoginWithPassword(this.repository);

  @override
  Future<Either<Failure, User>> call(LoginWithPasswordParams params) {
    final email = params.email.trim();
    if (!email.contains('@') || !email.contains('.')) {
      return Future.value(
          const Left(ValidationFailure('البريد الإلكتروني غير صحيح')));
    }
    if (params.password.length < 6) {
      return Future.value(const Left(
          ValidationFailure('كلمة المرور يجب ألا تقل عن 6 أحرف')));
    }
    return repository.login(email: email, password: params.password);
  }
}

class LoginWithPasswordParams extends Equatable {
  final String email;
  final String password;

  const LoginWithPasswordParams({
    required this.email,
    required this.password,
  });

  @override
  List<Object?> get props => [email, password];
}
