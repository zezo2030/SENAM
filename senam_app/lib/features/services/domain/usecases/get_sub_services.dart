import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/sub_service.dart';
import '../repositories/services_repository.dart';

/// Use Case: جلب الخدمات الفرعية لتصنيف معيّن.
class GetSubServices implements UseCase<List<SubService>, String> {
  final ServicesRepository repository;
  const GetSubServices(this.repository);

  @override
  Future<Either<Failure, List<SubService>>> call(String categoryId) {
    return repository.getSubServices(categoryId);
  }
}
