part of 'order_tracking_cubit.dart';

enum OrderTrackingStatus { initial, loading, cancelled, failure }

class OrderTrackingState extends Equatable {
  final OrderTrackingStatus status;
  final int currentStep;
  final String? errorMessage;

  const OrderTrackingState({
    this.status = OrderTrackingStatus.initial,
    this.currentStep = 1,
    this.errorMessage,
  });

  OrderTrackingState copyWith({
    OrderTrackingStatus? status,
    int? currentStep,
    String? errorMessage,
  }) {
    return OrderTrackingState(
      status: status ?? this.status,
      currentStep: currentStep ?? this.currentStep,
      errorMessage: errorMessage,
    );
  }

  @override
  List<Object?> get props => [status, currentStep, errorMessage];
}
