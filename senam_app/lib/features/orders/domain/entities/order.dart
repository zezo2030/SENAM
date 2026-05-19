import 'package:equatable/equatable.dart';
import 'package:flutter/material.dart';

/// حالة الطلب.
enum OrderStatus { current, completed, cancelled }

/// كيان الطلب.
class OrderEntity extends Equatable {
  final String number;
  final String companyName;
  final String companyLogo;
  final Color companyColor;
  final String serviceName;
  final int total;
  final String dateTime;
  final OrderStatus status;
  final int trackingStep;

  const OrderEntity({
    required this.number,
    required this.companyName,
    required this.companyLogo,
    required this.companyColor,
    required this.serviceName,
    required this.total,
    required this.dateTime,
    required this.status,
    this.trackingStep = 1,
  });

  @override
  List<Object?> get props => [number];
}
