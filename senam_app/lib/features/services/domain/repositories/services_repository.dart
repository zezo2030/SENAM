import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../entities/company.dart';
import '../entities/review.dart';
import '../entities/service_category.dart';
import '../entities/sub_service.dart';

/// عقد مستودع الخدمات — تُنفّذه طبقة الـ Data.
abstract class ServicesRepository {
  Future<Either<Failure, List<ServiceCategory>>> getCategories();

  Future<Either<Failure, List<Company>>> getCompanies();

  Future<Either<Failure, Company>> getCompanyDetail(String companyId);

  Future<Either<Failure, List<Company>>> getCompaniesByCategory(
      String categoryId);

  Future<Either<Failure, List<Company>>> getCompaniesBySubService(
      String subServiceId);

  Future<Either<Failure, List<SubService>>> getSubServices(String categoryId);

  Future<Either<Failure, List<Review>>> getCompanyReviews(String companyId);

  Future<Either<Failure, Review>> submitCompanyReview({
    required String companyId,
    required int rating,
    String? comment,
  });

  Future<Either<Failure, List<Company>>> getFavoriteCompanies();
}
