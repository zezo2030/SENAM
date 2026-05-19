import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../entities/app_notification.dart';
import '../entities/user_profile.dart';

/// عقد مستودع الحساب — تُنفّذه طبقة الـ Data.
abstract class AccountRepository {
  Future<Either<Failure, UserProfile>> getProfile();
  Future<Either<Failure, List<AppNotification>>> getNotifications();
}
