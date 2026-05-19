import 'package:dartz/dartz.dart';
import '../../../../core/error/exceptions.dart';
import '../../../../core/error/failures.dart';
import '../../domain/entities/company.dart';
import '../../domain/entities/review.dart';
import '../../domain/entities/service_category.dart';
import '../../domain/repositories/services_repository.dart';
import '../datasources/services_local_datasource.dart';

/// تنفيذ مستودع الخدمات — يحوّل الاستثناءات إلى Failures.
class ServicesRepositoryImpl implements ServicesRepository {
  final ServicesDataSource dataSource;
  const ServicesRepositoryImpl(this.dataSource);

  @override
  Future<Either<Failure, List<ServiceCategory>>> getCategories() async {
    try {
      return Right(await dataSource.getCategories());
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } on CacheException catch (e) {
      return Left(CacheFailure(e.message));
    } catch (_) {
      return const Left(ServerFailure());
    }
  }

  @override
  Future<Either<Failure, List<Company>>> getCompanies() async {
    try {
      return Right(await dataSource.getCompanies());
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } on CacheException catch (e) {
      return Left(CacheFailure(e.message));
    } catch (_) {
      return const Left(ServerFailure());
    }
  }

  @override
  Future<Either<Failure, List<Company>>> getCompaniesByCategory(
      String categoryId) async {
    try {
      return Right(await dataSource.getCompaniesByCategory(categoryId));
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } on CacheException catch (e) {
      return Left(CacheFailure(e.message));
    } catch (_) {
      return const Left(ServerFailure());
    }
  }

  @override
  Future<Either<Failure, List<Review>>> getCompanyReviews(
      String companyId) async {
    try {
      return Right(await dataSource.getCompanyReviews(companyId));
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } on CacheException catch (e) {
      return Left(CacheFailure(e.message));
    } catch (_) {
      return const Left(ServerFailure());
    }
  }

  @override
  Future<Either<Failure, List<Company>>> getFavoriteCompanies() async {
    try {
      return Right(await dataSource.getFavoriteCompanies());
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } on CacheException catch (e) {
      return Left(CacheFailure(e.message));
    } catch (_) {
      return const Left(ServerFailure());
    }
  }
}
