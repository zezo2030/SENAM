import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/user.dart';
import '../repositories/auth_repository.dart';

/// Use Case: إنشاء حساب جديد بالبريد وكلمة المرور.
class RegisterAccount implements UseCase<User, RegisterAccountParams> {
  final AuthRepository repository;
  const RegisterAccount(this.repository);

  @override
  Future<Either<Failure, User>> call(RegisterAccountParams params) {
    final email = params.email.trim();
    if (!email.contains('@') || !email.contains('.')) {
      return Future.value(
          const Left(ValidationFailure('البريد الإلكتروني غير صحيح')));
    }
    if (params.password.length < 8) {
      return Future.value(const Left(
          ValidationFailure('كلمة المرور يجب ألا تقل عن 8 أحرف')));
    }
    return repository.register(
      email: email,
      password: params.password,
      displayName: params.displayName?.trim().isEmpty == true
          ? null
          : params.displayName?.trim(),
      phone: params.phone?.trim().isEmpty == true ? null : params.phone?.trim(),
    );
  }
}

class RegisterAccountParams extends Equatable {
  final String email;
  final String password;
  final String? displayName;
  final String? phone;

  const RegisterAccountParams({
    required this.email,
    required this.password,
    this.displayName,
    this.phone,
  });

  @override
  List<Object?> get props => [email, password, displayName, phone];
}
