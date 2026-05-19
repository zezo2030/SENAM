part of 'booking_cubit.dart';

enum BookingStatus { initial, loading, success, failure }

class BookingState extends Equatable {
  final BookingStatus status;
  final String? orderNumber;
  final String? errorMessage;

  const BookingState({
    this.status = BookingStatus.initial,
    this.orderNumber,
    this.errorMessage,
  });

  BookingState copyWith({
    BookingStatus? status,
    String? orderNumber,
    String? errorMessage,
  }) {
    return BookingState(
      status: status ?? this.status,
      orderNumber: orderNumber ?? this.orderNumber,
      errorMessage: errorMessage,
    );
  }

  @override
  List<Object?> get props => [status, orderNumber, errorMessage];
}
