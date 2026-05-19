import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../entities/order.dart';

/// عقد مستودع الطلبات — تُنفّذه طبقة الـ Data.
abstract class OrdersRepository {
  /// جلب كل الطلبات.
  Future<Either<Failure, List<OrderEntity>>> getOrders();

  /// جلب الطلبات حسب الحالة (null = الكل).
  Future<Either<Failure, List<OrderEntity>>> getOrdersByStatus(
      OrderStatus? status);

  /// إلغاء طلب.
  Future<Either<Failure, Unit>> cancelOrder(String orderNumber);

  /// إرسال تقييم لطلب مكتمل.
  Future<Either<Failure, Unit>> submitReview({
    required String orderNumber,
    required int companyStars,
    required int techStars,
    required String comment,
  });
}
