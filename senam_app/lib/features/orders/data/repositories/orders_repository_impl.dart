import 'package:dartz/dartz.dart';
import '../../../../core/error/exceptions.dart';
import '../../../../core/error/failures.dart';
import '../../domain/entities/order.dart';
import '../../domain/repositories/orders_repository.dart';
import '../datasources/orders_local_datasource.dart';

/// تنفيذ مستودع الطلبات — يحوّل الاستثناءات إلى Failures.
class OrdersRepositoryImpl implements OrdersRepository {
  final OrdersDataSource dataSource;
  const OrdersRepositoryImpl(this.dataSource);

  @override
  Future<Either<Failure, List<OrderEntity>>> getOrders() async {
    try {
      final orders = await dataSource.getOrders();
      return Right(orders);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (_) {
      return const Left(ServerFailure());
    }
  }

  @override
  Future<Either<Failure, List<OrderEntity>>> getOrdersByStatus(
      OrderStatus? status) async {
    try {
      final orders = await dataSource.getOrdersByStatus(status);
      return Right(orders);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (_) {
      return const Left(ServerFailure());
    }
  }

  @override
  Future<Either<Failure, Unit>> cancelOrder(String orderNumber) async {
    try {
      await dataSource.cancelOrder(orderNumber);
      return const Right(unit);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (_) {
      return const Left(ServerFailure());
    }
  }

  @override
  Future<Either<Failure, Unit>> submitReview({
    required String orderNumber,
    required int companyStars,
    required int techStars,
    required String comment,
  }) async {
    try {
      await dataSource.submitReview(
        orderNumber: orderNumber,
        companyStars: companyStars,
        techStars: techStars,
        comment: comment,
      );
      return const Right(unit);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (_) {
      return const Left(ServerFailure());
    }
  }
}
