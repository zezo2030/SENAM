import 'dart:async';
import 'package:dio/dio.dart';
import '../auth/token_storage.dart';

/// Catches 401 responses, attempts to refresh tokens once, then retries the
/// original request. Mirrors the dashboard refresh logic in
/// senam_dashboard/src/lib/api/client.ts.
class RefreshInterceptor extends QueuedInterceptor {
  final TokenStorage tokenStorage;
  final Dio refreshDio; // a bare Dio without interceptors to call /v1/auth/refresh
  final void Function()? onLogout;

  Future<void>? _ongoing;

  RefreshInterceptor({
    required this.tokenStorage,
    required this.refreshDio,
    this.onLogout,
  });

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    final response = err.response;
    final request = err.requestOptions;

    final isAuthCall = request.path.startsWith('/v1/auth/');
    if (response?.statusCode != 401 || isAuthCall || request.extra['_retry'] == true) {
      return handler.next(err);
    }

    try {
      await (_ongoing ??= _refresh());
    } catch (_) {
      _ongoing = null;
      onLogout?.call();
      return handler.next(err);
    }
    _ongoing = null;

    final access = tokenStorage.accessToken;
    if (access == null) {
      onLogout?.call();
      return handler.next(err);
    }

    final retryOptions = Options(
      method: request.method,
      headers: {
        ...request.headers,
        'Authorization': 'Bearer $access',
      },
      responseType: request.responseType,
      contentType: request.contentType,
      sendTimeout: request.sendTimeout,
      receiveTimeout: request.receiveTimeout,
      extra: {...request.extra, '_retry': true},
    );

    try {
      final retry = await refreshDio.request<dynamic>(
        request.path,
        data: request.data,
        queryParameters: request.queryParameters,
        options: retryOptions,
      );
      handler.resolve(retry);
    } on DioException catch (e) {
      handler.next(e);
    }
  }

  Future<void> _refresh() async {
    final refresh = await tokenStorage.readRefresh();
    if (refresh == null) throw StateError('no_refresh_token');

    final res = await refreshDio.post<Map<String, dynamic>>(
      '/v1/auth/refresh',
      data: {'refreshToken': refresh},
    );
    final data = res.data;
    if (data == null) throw StateError('empty_refresh_response');
    final access = data['accessToken'] as String?;
    final newRefresh = data['refreshToken'] as String?;
    if (access == null || newRefresh == null) {
      throw StateError('bad_refresh_response');
    }
    tokenStorage.setAccessToken(access);
    await tokenStorage.writeRefresh(newRefresh);
  }
}
