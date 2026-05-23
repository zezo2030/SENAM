import 'package:dio/dio.dart';
import '../auth/token_storage.dart';
import '../config/app_config.dart';
import 'auth_interceptor.dart';
import 'refresh_interceptor.dart';

class ApiClient {
  final Dio dio;
  final Dio refreshDio;
  final TokenStorage tokenStorage;

  ApiClient._(this.dio, this.refreshDio, this.tokenStorage);

  factory ApiClient({
    required TokenStorage tokenStorage,
    void Function()? onLogout,
  }) {
    final baseOptions = BaseOptions(
      baseUrl: AppConfig.apiBaseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 30),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Language': AppConfig.defaultLocale,
      },
      validateStatus: (s) => s != null && s >= 200 && s < 300,
    );

    final refreshDio = Dio(baseOptions.copyWith());
    final dio = Dio(baseOptions);

    dio.interceptors.add(AuthInterceptor(tokenStorage));
    dio.interceptors.add(
      RefreshInterceptor(
        tokenStorage: tokenStorage,
        refreshDio: refreshDio,
        onLogout: onLogout,
      ),
    );

    return ApiClient._(dio, refreshDio, tokenStorage);
  }
}
