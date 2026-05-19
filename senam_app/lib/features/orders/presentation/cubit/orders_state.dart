part of 'orders_cubit.dart';

enum OrdersStatus { initial, loading, success, failure }

class OrdersState extends Equatable {
  final OrdersStatus status;
  final List<OrderEntity> orders;
  final int tabIndex;
  final String? errorMessage;

  const OrdersState({
    this.status = OrdersStatus.initial,
    this.orders = const [],
    this.tabIndex = 0,
    this.errorMessage,
  });

  OrdersState copyWith({
    OrdersStatus? status,
    List<OrderEntity>? orders,
    int? tabIndex,
    String? errorMessage,
  }) {
    return OrdersState(
      status: status ?? this.status,
      orders: orders ?? this.orders,
      tabIndex: tabIndex ?? this.tabIndex,
      errorMessage: errorMessage,
    );
  }

  @override
  List<Object?> get props => [status, orders, tabIndex, errorMessage];
}
