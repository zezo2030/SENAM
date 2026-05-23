import 'dart:io';
import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../repositories/provider_application_repository.dart';

class UploadDocument {
  final ProviderApplicationRepository repository;

  UploadDocument(this.repository);

  Future<Either<Failure, String>> call({
    required File file,
    required String contentType,
    String purpose = UploadPurpose.kycDocument,
  }) {
    return repository.uploadFile(
      file: file,
      contentType: contentType,
      purpose: purpose,
    );
  }
}
