import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/app_notification.dart';
import '../repositories/account_repository.dart';

/// Use Case: جلب قائمة الإشعارات.
class GetNotifications implements UseCase<List<AppNotification>, NoParams> {
  final AccountRepository repository;
  const GetNotifications(this.repository);

  @override
  Future<Either<Failure, List<AppNotification>>> call(NoParams params) {
    return repository.getNotifications();
  }
}
