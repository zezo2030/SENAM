import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/usecases/cancel_order.dart';

part 'order_tracking_state.dart';

/// Cubit لإدارة تتبع الطلب وإلغائه.
class OrderTrackingCubit extends Cubit<OrderTrackingState> {
  final CancelOrder cancelOrder;

  OrderTrackingCubit({required this.cancelOrder})
      : super(const OrderTrackingState());

  /// عدد خطوات التتبع.
  static const stepCount = 6;

  void initStep(int step) {
    emit(state.copyWith(currentStep: step));
  }

  void advanceStep() {
    if (state.currentStep < stepCount - 1) {
      emit(state.copyWith(currentStep: state.currentStep + 1));
    }
  }

  Future<void> cancel(String orderNumber) async {
    emit(state.copyWith(status: OrderTrackingStatus.loading));
    final result = await cancelOrder(orderNumber);
    result.fold(
      (failure) => emit(state.copyWith(
        status: OrderTrackingStatus.failure,
        errorMessage: failure.message,
      )),
      (_) => emit(state.copyWith(status: OrderTrackingStatus.cancelled)),
    );
  }
}
