import 'package:dio/dio.dart';

import '../../../../core/auth/jwt.dart';
import '../../../../core/auth/token_storage.dart';
import '../../../../core/error/exceptions.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/error_mapper.dart';
import '../models/user_model.dart';
import 'auth_local_datasource.dart';

class AuthRemoteDataSource implements AuthDataSource {
  final ApiClient apiClient;
  final TokenStorage tokenStorage;

  AuthRemoteDataSource(this.apiClient, this.tokenStorage);

  Dio get _dio => apiClient.dio;

  @override
  Future<UserModel> login({
    required String email,
    required String password,
  }) async {
    try {
      await tokenStorage.clearAll();
      final res = await _dio.post<Map<String, dynamic>>(
        '/v1/auth/login',
        data: {
          'email': email.trim().toLowerCase(),
          'password': password,
          'principal': 'customer',
        },
      );
      return _handleTokenResponse(res.data, fallbackEmail: email);
    } on DioException catch (e) {
      throwFromDio(e);
    }
  }

  @override
  Future<UserModel> register({
    required String email,
    required String password,
    String? displayName,
    String? phone,
  }) async {
    try {
      await tokenStorage.clearAll();
      final body = <String, dynamic>{
        'email': email.trim().toLowerCase(),
        'password': password,
      };
      if (displayName != null && displayName.isNotEmpty) {
        body['displayName'] = displayName;
      }
      if (phone != null && phone.isNotEmpty) {
        body['phone'] = phone;
      }
      final res = await _dio.post<Map<String, dynamic>>(
        '/v1/auth/register',
        data: body,
      );
      return _handleTokenResponse(res.data, fallbackEmail: email);
    } on DioException catch (e) {
      throwFromDio(e);
    }
  }

  Future<UserModel> _handleTokenResponse(
    Map<String, dynamic>? data, {
    required String fallbackEmail,
  }) async {
    if (data == null) {
      throw const ServerException('استجابة فارغة من الخادم');
    }
    final access = data['accessToken'] as String?;
    final refresh = data['refreshToken'] as String?;
    if (access == null || refresh == null) {
      throw const ServerException('استجابة مصادقة غير صالحة');
    }

    tokenStorage.setAccessToken(access);
    await tokenStorage.writeRefresh(refresh);

    final payload = decodeJwtPayload(access);
    final sub = payload?['sub']?.toString() ?? '';
    final cleaned = fallbackEmail.trim().toLowerCase();

    final me = await _fetchMe();
    return UserModel(
      id: me?['id']?.toString() ?? sub,
      name: (me?['displayName'] as String?) ?? '',
      email: (me?['email'] as String?) ?? cleaned,
      phone: me?['phone'] as String?,
    );
  }

  Future<Map<String, dynamic>?> _fetchMe() async {
    try {
      final res = await _dio.get<Map<String, dynamic>>('/v1/me');
      return res.data;
    } on DioException {
      return null;
    }
  }

  @override
  Future<UserModel> updateProfile({
    String? displayName,
    String? phone,
    String? locale,
  }) async {
    try {
      final body = <String, dynamic>{};
      if (displayName != null) body['displayName'] = displayName;
      if (phone != null) body['phone'] = phone;
      if (locale != null) body['locale'] = locale;

      final res = await _dio.patch<Map<String, dynamic>>(
        '/v1/me',
        data: body,
      );
      final data = res.data ?? {};
      return UserModel(
        id: data['id']?.toString() ?? '',
        name: (data['displayName'] as String?) ?? '',
        email: (data['email'] as String?) ?? '',
        phone: data['phone'] as String?,
      );
    } on DioException catch (e) {
      throwFromDio(e);
    }
  }

  Future<void> logout() async {
    final refresh = await tokenStorage.readRefresh();
    if (refresh != null) {
      try {
        await _dio.post<void>('/v1/auth/logout', data: {'refreshToken': refresh});
      } catch (_) {
        // ignore — we'll still clear locally
      }
    }
    await tokenStorage.clearAll();
  }
}
