import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/company.dart';
import '../repositories/services_repository.dart';

/// Use Case: جلب الشركات المفضلة.
class GetFavoriteCompanies implements UseCase<List<Company>, NoParams> {
  final ServicesRepository repository;
  const GetFavoriteCompanies(this.repository);

  @override
  Future<Either<Failure, List<Company>>> call(NoParams params) {
    return repository.getFavoriteCompanies();
  }
}
