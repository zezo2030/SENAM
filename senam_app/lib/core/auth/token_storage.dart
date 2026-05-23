import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class TokenStorage {
  static const _refreshKey = 'senam.refresh_token';

  final FlutterSecureStorage _storage;
  String? _accessToken;

  TokenStorage({FlutterSecureStorage? storage})
      : _storage = storage ??
            const FlutterSecureStorage(
              aOptions: AndroidOptions(encryptedSharedPreferences: true),
              iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
            );

  String? get accessToken => _accessToken;
  void setAccessToken(String? token) => _accessToken = token;

  Future<String?> readRefresh() => _storage.read(key: _refreshKey);
  Future<void> writeRefresh(String token) =>
      _storage.write(key: _refreshKey, value: token);
  Future<void> clearRefresh() => _storage.delete(key: _refreshKey);

  Future<bool> hasRefresh() async => (await readRefresh()) != null;

  Future<void> clearAll() async {
    _accessToken = null;
    await clearRefresh();
  }
}
