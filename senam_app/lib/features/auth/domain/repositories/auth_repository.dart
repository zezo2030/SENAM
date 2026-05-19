import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../entities/user.dart';

/// عقد مستودع المصادقة — تُنفّذه طبقة الـ Data.
abstract class AuthRepository {
  /// تسجيل الدخول بالبريد الإلكتروني وكلمة المرور.
  Future<Either<Failure, User>> login({
    required String email,
    required String password,
  });
}
