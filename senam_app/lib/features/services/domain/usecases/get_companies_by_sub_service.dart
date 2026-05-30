import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/company.dart';
import '../repositories/services_repository.dart';

/// Use Case: جلب الشركات لخدمة فرعية معيّنة.
class GetCompaniesBySubService implements UseCase<List<Company>, String> {
  final ServicesRepository repository;
  const GetCompaniesBySubService(this.repository);

  @override
  Future<Either<Failure, List<Company>>> call(String subServiceId) {
    return repository.getCompaniesBySubService(subServiceId);
  }
}
