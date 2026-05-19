import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/entities/booking.dart';
import '../../domain/usecases/create_booking.dart';

part 'booking_state.dart';

/// Cubit لإدارة حالة إنشاء الحجز.
class BookingCubit extends Cubit<BookingState> {
  final CreateBooking createBookingUseCase;

  BookingCubit({required this.createBookingUseCase})
      : super(const BookingState());

  Future<void> submit(Booking booking) async {
    emit(state.copyWith(status: BookingStatus.loading));
    final result = await createBookingUseCase(booking);
    result.fold(
      (failure) => emit(state.copyWith(
        status: BookingStatus.failure,
        errorMessage: failure.message,
      )),
      (orderNumber) => emit(state.copyWith(
        status: BookingStatus.success,
        orderNumber: orderNumber,
      )),
    );
  }
}
