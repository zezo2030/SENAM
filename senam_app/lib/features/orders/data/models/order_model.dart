import 'package:flutter/material.dart';
import '../../domain/entities/order.dart';

/// نموذج بيانات الطلب — يضيف تحويل JSON فوق الكيان.
class OrderModel extends OrderEntity {
  const OrderModel({
    required super.number,
    required super.companyName,
    required super.companyLogo,
    required super.companyColor,
    required super.serviceName,
    required super.total,
    required super.dateTime,
    required super.status,
    super.trackingStep,
  });

  factory OrderModel.fromJson(Map<String, dynamic> json) {
    return OrderModel(
      number: json['number'] as String? ?? '',
      companyName: json['companyName'] as String? ?? '',
      companyLogo: json['companyLogo'] as String? ?? '',
      companyColor: Color((json['companyColor'] as num?)?.toInt() ?? 0xFF000000),
      serviceName: json['serviceName'] as String? ?? '',
      total: (json['total'] as num?)?.toInt() ?? 0,
      dateTime: json['dateTime'] as String? ?? '',
      status: OrderStatus.values[(json['status'] as num?)?.toInt() ?? 0],
      trackingStep: (json['trackingStep'] as num?)?.toInt() ?? 1,
    );
  }

  Map<String, dynamic> toJson() => {
        'number': number,
        'companyName': companyName,
        'companyLogo': companyLogo,
        'companyColor': companyColor.toARGB32(),
        'serviceName': serviceName,
        'total': total,
        'dateTime': dateTime,
        'status': status.index,
        'trackingStep': trackingStep,
      };
}
