import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// تخزين خفيف للأعلام غير الحساسة الخاصة بالتطبيق (مثل: هل شُوهد الأونبوردنج).
class AppPrefs {
  static const _onboardingSeenKey = 'senam.onboarding_seen';

  static const FlutterSecureStorage _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
  );

  /// هل عُرض الأونبوردنج للمستخدم من قبل؟
  static Future<bool> isOnboardingSeen() async =>
      (await _storage.read(key: _onboardingSeenKey)) == 'true';

  /// تسجيل أن الأونبوردنج قد عُرض (يُستدعى عند مغادرته للصفحة الرئيسية).
  static Future<void> setOnboardingSeen() =>
      _storage.write(key: _onboardingSeenKey, value: 'true');
}
