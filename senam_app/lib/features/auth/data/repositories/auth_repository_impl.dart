import 'package:dartz/dartz.dart';
import '../../../../core/error/exceptions.dart';
import '../../../../core/error/failures.dart';
import '../../domain/entities/user.dart';
import '../../domain/repositories/auth_repository.dart';
import '../datasources/auth_local_datasource.dart';

/// تنفيذ مستودع المصادقة — يحوّل الاستثناءات إلى Failures.
class AuthRepositoryImpl implements AuthRepository {
  final AuthDataSource dataSource;
  const AuthRepositoryImpl(this.dataSource);

  @override
  Future<Either<Failure, User>> login({
    required String email,
    required String password,
  }) async {
    try {
      final user = await dataSource.login(email: email, password: password);
      return Right(user);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (_) {
      return const Left(ServerFailure());
    }
  }
}
