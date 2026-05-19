import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/user.dart';
import '../repositories/auth_repository.dart';

/// Use Case: تسجيل الدخول بالبريد الإلكتروني وكلمة المرور.
class Login implements UseCase<User, LoginParams> {
  final AuthRepository repository;
  const Login(this.repository);

  @override
  Future<Either<Failure, User>> call(LoginParams params) {
    if (!params.email.contains('@') || !params.email.contains('.')) {
      return Future.value(
          const Left(ValidationFailure('البريد الإلكتروني غير صحيح')));
    }
    if (params.password.length < 6) {
      return Future.value(const Left(
          ValidationFailure('كلمة المرور يجب أن تكون 6 أحرف على الأقل')));
    }
    return repository.login(email: params.email, password: params.password);
  }
}

class LoginParams extends Equatable {
  final String email;
  final String password;

  const LoginParams({required this.email, required this.password});

  @override
  List<Object?> get props => [email, password];
}
