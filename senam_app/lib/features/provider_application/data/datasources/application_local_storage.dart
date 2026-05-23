import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// تخزين محلي لمعرّف آخر طلب شركة قدّمه المستخدم من هذا الجهاز،
/// لإظهار شريط متابعة على شاشة الدخول دون ما يضطر يحفظ الـ UUID يدوياً.
class ApplicationLocalStorage {
  static const _key = 'senam.pending_application_company_id';

  final FlutterSecureStorage _storage;

  ApplicationLocalStorage({FlutterSecureStorage? storage})
      : _storage = storage ??
            const FlutterSecureStorage(
              aOptions: AndroidOptions(encryptedSharedPreferences: true),
              iOptions:
                  IOSOptions(accessibility: KeychainAccessibility.first_unlock),
            );

  Future<String?> read() => _storage.read(key: _key);
  Future<void> save(String companyId) =>
      _storage.write(key: _key, value: companyId);
  Future<void> clear() => _storage.delete(key: _key);
}
