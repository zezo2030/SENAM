import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/service_category.dart';
import '../repositories/services_repository.dart';

/// Use Case: جلب تصنيفات الخدمات.
class GetCategories implements UseCase<List<ServiceCategory>, NoParams> {
  final ServicesRepository repository;
  const GetCategories(this.repository);

  @override
  Future<Either<Failure, List<ServiceCategory>>> call(NoParams params) {
    return repository.getCategories();
  }
}
