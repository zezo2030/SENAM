// الاستثناءات (Exceptions) في طبقة الـ Data — تُلتقط في الـ Repositories
// وتُحوَّل إلى Failures.

/// استثناء من الخادم / الـ API.
class ServerException implements Exception {
  final String message;
  const ServerException([this.message = 'خطأ في الخادم']);
}

/// استثناء من التخزين المحلي / الكاش.
class CacheException implements Exception {
  final String message;
  const CacheException([this.message = 'خطأ في الكاش']);
}

/// استثناء في الاتصال بالشبكة.
class NetworkException implements Exception {
  final String message;
  const NetworkException([this.message = 'لا يوجد اتصال']);
}
