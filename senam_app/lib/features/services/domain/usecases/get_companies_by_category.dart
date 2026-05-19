import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/company.dart';
import '../repositories/services_repository.dart';

/// Use Case: جلب الشركات حسب التصنيف.
class GetCompaniesByCategory implements UseCase<List<Company>, String> {
  final ServicesRepository repository;
  const GetCompaniesByCategory(this.repository);

  @override
  Future<Either<Failure, List<Company>>> call(String categoryId) {
    return repository.getCompaniesByCategory(categoryId);
  }
}
