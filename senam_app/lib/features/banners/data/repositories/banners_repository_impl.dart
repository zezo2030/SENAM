import 'package:dartz/dartz.dart';
import '../../../../core/error/exceptions.dart';
import '../../../../core/error/failures.dart';
import '../../domain/entities/banner.dart';
import '../../domain/repositories/banners_repository.dart';
import '../datasources/banners_remote_datasource.dart';

/// تنفيذ مستودع البانرات — يحوّل الاستثناءات إلى Failures.
class BannersRepositoryImpl implements BannersRepository {
  final BannersDataSource dataSource;
  const BannersRepositoryImpl(this.dataSource);

  @override
  Future<Either<Failure, List<Banner>>> getActiveBanners() async {
    try {
      final banners = await dataSource.getActiveBanners();
      return Right(banners);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (_) {
      return const Left(ServerFailure());
    }
  }
}
