import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/entities/order.dart';
import '../../domain/usecases/get_orders.dart';

part 'orders_state.dart';

/// Cubit لإدارة قائمة الطلبات وتبويباتها.
class OrdersCubit extends Cubit<OrdersState> {
  final GetOrders getOrders;

  OrdersCubit({required this.getOrders}) : super(const OrdersState());

  static const _tabStatuses = <OrderStatus?>[
    null,
    OrderStatus.current,
    OrderStatus.completed,
    OrderStatus.cancelled,
  ];

  Future<void> load(OrderStatus? status) async {
    emit(state.copyWith(status: OrdersStatus.loading));
    final result = await getOrders(status);
    result.fold(
      (failure) => emit(state.copyWith(
        status: OrdersStatus.failure,
        errorMessage: failure.message,
      )),
      (orders) => emit(state.copyWith(
        status: OrdersStatus.success,
        orders: orders,
      )),
    );
  }

  void setTab(int index) {
    emit(state.copyWith(tabIndex: index));
    load(_tabStatuses[index]);
  }
}
