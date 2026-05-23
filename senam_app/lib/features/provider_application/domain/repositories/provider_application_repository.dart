import 'dart:io';
import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../entities/application_status.dart';
import '../entities/kyc_document.dart';

/// Purposes recognised by the upload presign endpoint.
class UploadPurpose {
  static const kycDocument = 'kyc_document';
  static const companyLogo = 'company_logo';
  static const portfolioPhoto = 'portfolio_photo';
}

abstract class ProviderApplicationRepository {
  /// رفع ملف عام (وثيقة / شعار / صورة معرض أعمال) على الـ object storage عبر signed URL.
  Future<Either<Failure, String>> uploadFile({
    required File file,
    required String contentType,
    required String purpose,
  });

  Future<Either<Failure, CompanyApplicationResult>> submitApplication(
    CompanyApplicationDraft draft,
  );

  Future<Either<Failure, CompanyApplicationStatus>> getStatus(String companyId);

  Future<Either<Failure, List<CatalogCategory>>> fetchCategories();

  Future<Either<Failure, List<CatalogService>>> fetchServices({String? categoryId});
}
