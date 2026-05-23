import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../entities/application_status.dart';
import '../repositories/provider_application_repository.dart';

class GetApplicationStatus {
  final ProviderApplicationRepository repository;

  GetApplicationStatus(this.repository);

  Future<Either<Failure, CompanyApplicationStatus>> call(String companyId) {
    return repository.getStatus(companyId);
  }
}
