import 'package:dartz/dartz.dart';

import '../../../../core/error/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/company.dart';
import '../repositories/services_repository.dart';

class GetCompanyDetail implements UseCase<Company, String> {
  final ServicesRepository repository;
  const GetCompanyDetail(this.repository);

  @override
  Future<Either<Failure, Company>> call(String companyId) {
    return repository.getCompanyDetail(companyId);
  }
}
