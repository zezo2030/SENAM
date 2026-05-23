import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/banner.dart';
import '../repositories/banners_repository.dart';

/// Use Case: جلب البانرات النشطة الظاهرة حالياً.
class GetActiveBanners implements UseCase<List<Banner>, NoParams> {
  final BannersRepository repository;
  const GetActiveBanners(this.repository);

  @override
  Future<Either<Failure, List<Banner>>> call(NoParams params) {
    return repository.getActiveBanners();
  }
}
