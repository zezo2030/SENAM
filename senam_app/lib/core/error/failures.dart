import 'package:equatable/equatable.dart';

/// الأخطاء (Failures) في طبقة الـ Domain — تُمرَّر داخل `Either`.
abstract class Failure extends Equatable {
  final String message;
  const Failure(this.message);

  @override
  List<Object?> get props => [message];
}

/// خطأ من الخادم / الـ API.
class ServerFailure extends Failure {
  const ServerFailure([super.message = 'حدث خطأ في الخادم، حاول لاحقاً']);
}

/// خطأ في التخزين المحلي / الكاش.
class CacheFailure extends Failure {
  const CacheFailure([super.message = 'تعذّر تحميل البيانات المحفوظة']);
}

/// خطأ في الاتصال بالشبكة.
class NetworkFailure extends Failure {
  const NetworkFailure([super.message = 'لا يوجد اتصال بالإنترنت']);
}

/// خطأ في المدخلات / التحقق.
class ValidationFailure extends Failure {
  const ValidationFailure([super.message = 'البيانات المدخلة غير صحيحة']);
}
