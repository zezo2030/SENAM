import 'package:dio/dio.dart';
import '../error/exceptions.dart';

/// Translates a Dio error into one of the existing `*Exception` types so the
/// repository layer's catch blocks (already written for the mock datasources)
/// keep working unchanged.
Never throwFromDio(DioException e) {
  if (e.type == DioExceptionType.connectionError ||
      e.type == DioExceptionType.connectionTimeout ||
      e.type == DioExceptionType.receiveTimeout ||
      e.type == DioExceptionType.sendTimeout) {
    throw const NetworkException();
  }

  final status = e.response?.statusCode;
  final data = e.response?.data;
  String message = 'خطأ في الخادم';

  if (data is Map<String, dynamic>) {
    final m = data['message'] ?? data['error']?['message'] ?? data['detail'];
    if (m is String && m.isNotEmpty) message = m;
    if (m is List && m.isNotEmpty) message = m.first.toString();
  }

  if (status == 401 || status == 403) {
    throw ServerException(message);
  }
  throw ServerException(message);
}
