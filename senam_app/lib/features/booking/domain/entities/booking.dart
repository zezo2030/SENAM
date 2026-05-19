import 'package:equatable/equatable.dart';

/// كيان الحجز — يمثّل طلب خدمة قبل إرساله للمستودع.
class Booking extends Equatable {
  final String companyId;
  final String companyName;
  final String companyLogoLabel;
  final String serviceName;
  final int price;
  final int serviceFee;
  final String date;
  final String time;
  final String address;
  final String notes;
  final String paymentMethod;

  const Booking({
    required this.companyId,
    required this.companyName,
    required this.companyLogoLabel,
    required this.serviceName,
    required this.price,
    required this.serviceFee,
    required this.date,
    required this.time,
    required this.address,
    this.notes = '',
    required this.paymentMethod,
  });

  int get total => price + serviceFee;

  @override
  List<Object?> get props => [companyId, serviceName, date, time, total];
}
