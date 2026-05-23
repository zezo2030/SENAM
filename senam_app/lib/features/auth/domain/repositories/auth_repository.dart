import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../entities/user.dart';

/// عقد مستودع المصادقة (Email + Password flow للعملاء).
abstract class AuthRepository {
  /// تسجيل الدخول بالبريد وكلمة المرور.
  Future<Either<Failure, User>> login({
    required String email,
    required String password,
  });

  /// إنشاء حساب جديد بالبريد وكلمة المرور (مع إمكانية تمرير الاسم والهاتف).
  Future<Either<Failure, User>> register({
    required String email,
    required String password,
    String? displayName,
    String? phone,
  });

  /// تحديث الملف الشخصي بعد التحقق.
  Future<Either<Failure, User>> updateProfile({
    String? displayName,
    String? phone,
    String? locale,
  });
}
