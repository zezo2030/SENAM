import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../entities/application_status.dart';
import '../entities/kyc_document.dart';
import '../repositories/provider_application_repository.dart';

class SubmitApplication {
  final ProviderApplicationRepository repository;

  SubmitApplication(this.repository);

  Future<Either<Failure, CompanyApplicationResult>> call(
    CompanyApplicationDraft draft,
  ) {
    return repository.submitApplication(draft);
  }
}
