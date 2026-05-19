import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/order.dart';
import '../repositories/orders_repository.dart';

/// Use Case: جلب الطلبات (يمكن تصفيتها حسب الحالة، null = الكل).
class GetOrders implements UseCase<List<OrderEntity>, OrderStatus?> {
  final OrdersRepository repository;
  const GetOrders(this.repository);

  @override
  Future<Either<Failure, List<OrderEntity>>> call(OrderStatus? params) {
    return repository.getOrdersByStatus(params);
  }
}
