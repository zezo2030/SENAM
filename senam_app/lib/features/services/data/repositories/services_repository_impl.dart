import 'package:dartz/dartz.dart';
import 'package:flutter/foundation.dart';
import '../../../../core/error/exceptions.dart';
import '../../../../core/error/failures.dart';
import '../../domain/entities/company.dart';
import '../../domain/entities/review.dart';
import '../../domain/entities/service_category.dart';
import '../../domain/entities/sub_service.dart';
import '../../domain/repositories/services_repository.dart';
import '../datasources/services_local_datasource.dart';

/// تنفيذ مستودع الخدمات — يحوّل الاستثناءات إلى Failures.
class ServicesRepositoryImpl implements ServicesRepository {
  final ServicesDataSource dataSource;
  const ServicesRepositoryImpl(this.dataSource);

  Future<Either<Failure, T>> _guard<T>(Future<T> Function() body) async {
    try {
      return Right(await body());
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } on CacheException catch (e) {
      return Left(CacheFailure(e.message));
    } catch (e, st) {
      debugPrint('ServicesRepository unexpected error: $e\n$st');
      return const Left(ServerFailure());
    }
  }

  @override
  Future<Either<Failure, List<ServiceCategory>>> getCategories() =>
      _guard(() => dataSource.getCategories());

  @override
  Future<Either<Failure, List<Company>>> getCompanies() =>
      _guard(() => dataSource.getCompanies());

  @override
  Future<Either<Failure, Company>> getCompanyDetail(String companyId) =>
      _guard(() => dataSource.getCompanyDetail(companyId));

  @override
  Future<Either<Failure, List<Company>>> getCompaniesByCategory(
          String categoryId) =>
      _guard(() => dataSource.getCompaniesByCategory(categoryId));

  @override
  Future<Either<Failure, List<Company>>> getCompaniesBySubService(
          String subServiceId) =>
      _guard(() => dataSource.getCompaniesBySubService(subServiceId));

  @override
  Future<Either<Failure, List<SubService>>> getSubServices(
          String categoryId) =>
      _guard(() => dataSource.getSubServices(categoryId));

  @override
  Future<Either<Failure, List<Review>>> getCompanyReviews(
          String companyId) =>
      _guard(() => dataSource.getCompanyReviews(companyId));

  @override
  Future<Either<Failure, Review>> submitCompanyReview({
    required String companyId,
    required int rating,
    String? comment,
  }) =>
      _guard(() => dataSource.submitCompanyReview(
            companyId: companyId,
            rating: rating,
            comment: comment,
          ));

  @override
  Future<Either<Failure, List<Company>>> getFavoriteCompanies() =>
      _guard(() => dataSource.getFavoriteCompanies());
}
