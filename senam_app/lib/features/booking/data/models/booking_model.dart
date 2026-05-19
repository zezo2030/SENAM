import '../../domain/entities/booking.dart';

/// نموذج بيانات الحجز — يضيف تحويل JSON فوق الكيان.
class BookingModel extends Booking {
  const BookingModel({
    required super.companyId,
    required super.companyName,
    required super.companyLogoLabel,
    required super.serviceName,
    required super.price,
    required super.serviceFee,
    required super.date,
    required super.time,
    required super.address,
    super.notes,
    required super.paymentMethod,
  });

  factory BookingModel.fromJson(Map<String, dynamic> json) {
    return BookingModel(
      companyId: json['companyId']?.toString() ?? '',
      companyName: json['companyName'] as String? ?? '',
      companyLogoLabel: json['companyLogoLabel'] as String? ?? '',
      serviceName: json['serviceName'] as String? ?? '',
      price: (json['price'] as num?)?.toInt() ?? 0,
      serviceFee: (json['serviceFee'] as num?)?.toInt() ?? 0,
      date: json['date'] as String? ?? '',
      time: json['time'] as String? ?? '',
      address: json['address'] as String? ?? '',
      notes: json['notes'] as String? ?? '',
      paymentMethod: json['paymentMethod'] as String? ?? '',
    );
  }

  factory BookingModel.fromEntity(Booking booking) {
    return BookingModel(
      companyId: booking.companyId,
      companyName: booking.companyName,
      companyLogoLabel: booking.companyLogoLabel,
      serviceName: booking.serviceName,
      price: booking.price,
      serviceFee: booking.serviceFee,
      date: booking.date,
      time: booking.time,
      address: booking.address,
      notes: booking.notes,
      paymentMethod: booking.paymentMethod,
    );
  }

  Map<String, dynamic> toJson() => {
        'companyId': companyId,
        'companyName': companyName,
        'companyLogoLabel': companyLogoLabel,
        'serviceName': serviceName,
        'price': price,
        'serviceFee': serviceFee,
        'date': date,
        'time': time,
        'address': address,
        'notes': notes,
        'paymentMethod': paymentMethod,
      };
}
