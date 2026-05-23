import 'dart:io';
import 'package:dartz/dartz.dart';

import '../../../../core/error/exceptions.dart';
import '../../../../core/error/failures.dart';
import '../../domain/entities/application_status.dart';
import '../../domain/entities/kyc_document.dart';
import '../../domain/repositories/provider_application_repository.dart';
import '../datasources/provider_application_remote_datasource.dart';

class ProviderApplicationRepositoryImpl
    implements ProviderApplicationRepository {
  final ProviderApplicationDataSource dataSource;

  ProviderApplicationRepositoryImpl(this.dataSource);

  @override
  Future<Either<Failure, String>> uploadFile({
    required File file,
    required String contentType,
    required String purpose,
  }) async {
    try {
      final key = await dataSource.uploadFile(
        file: file,
        contentType: contentType,
        purpose: purpose,
      );
      return Right(key);
    } on NetworkException catch (e) {
      return Left(NetworkFailure(e.message));
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    }
  }

  @override
  Future<Either<Failure, CompanyApplicationResult>> submitApplication(
    CompanyApplicationDraft draft,
  ) async {
    try {
      final result = await dataSource.submit(draft);
      return Right(result);
    } on NetworkException catch (e) {
      return Left(NetworkFailure(e.message));
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    }
  }

  @override
  Future<Either<Failure, CompanyApplicationStatus>> getStatus(
    String companyId,
  ) async {
    try {
      final result = await dataSource.getStatus(companyId);
      return Right(result);
    } on NetworkException catch (e) {
      return Left(NetworkFailure(e.message));
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    }
  }

  @override
  Future<Either<Failure, List<CatalogCategory>>> fetchCategories() async {
    try {
      return Right(await dataSource.fetchCategories());
    } on NetworkException catch (e) {
      return Left(NetworkFailure(e.message));
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    }
  }

  @override
  Future<Either<Failure, List<CatalogService>>> fetchServices({String? categoryId}) async {
    try {
      return Right(await dataSource.fetchServices(categoryId: categoryId));
    } on NetworkException catch (e) {
      return Left(NetworkFailure(e.message));
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    }
  }
}
