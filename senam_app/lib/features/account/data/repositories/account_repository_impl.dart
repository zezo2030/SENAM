import 'package:dartz/dartz.dart';
import '../../../../core/error/exceptions.dart';
import '../../../../core/error/failures.dart';
import '../../domain/entities/app_notification.dart';
import '../../domain/entities/user_profile.dart';
import '../../domain/repositories/account_repository.dart';
import '../datasources/account_local_datasource.dart';

/// تنفيذ مستودع الحساب — يحوّل الاستثناءات إلى Failures.
class AccountRepositoryImpl implements AccountRepository {
  final AccountDataSource dataSource;
  const AccountRepositoryImpl(this.dataSource);

  @override
  Future<Either<Failure, UserProfile>> getProfile() async {
    try {
      final profile = await dataSource.getProfile();
      return Right(profile);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } on CacheException catch (e) {
      return Left(CacheFailure(e.message));
    } catch (_) {
      return const Left(ServerFailure());
    }
  }

  @override
  Future<Either<Failure, List<AppNotification>>> getNotifications() async {
    try {
      final notifications = await dataSource.getNotifications();
      return Right(notifications);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } on CacheException catch (e) {
      return Left(CacheFailure(e.message));
    } catch (_) {
      return const Left(ServerFailure());
    }
  }
}
