import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../repositories/orders_repository.dart';

/// Use Case: إلغاء طلب.
class CancelOrder implements UseCase<Unit, String> {
  final OrdersRepository repository;
  const CancelOrder(this.repository);

  @override
  Future<Either<Failure, Unit>> call(String params) {
    return repository.cancelOrder(params);
  }
}
