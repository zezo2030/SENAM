import '../models/user_model.dart';

/// عقد مصدر بيانات المصادقة — Email + Password للعملاء.
abstract class AuthDataSource {
  /// تسجيل الدخول بالبريد وكلمة المرور — يحفظ التوكنات ويرجّع المستخدم.
  Future<UserModel> login({
    required String email,
    required String password,
  });

  /// إنشاء حساب جديد — يحفظ التوكنات ويرجّع المستخدم.
  Future<UserModel> register({
    required String email,
    required String password,
    String? displayName,
    String? phone,
  });

  /// تحديث ملف المستخدم (الاسم/الهاتف/اللغة).
  Future<UserModel> updateProfile({
    String? displayName,
    String? phone,
    String? locale,
  });
}
