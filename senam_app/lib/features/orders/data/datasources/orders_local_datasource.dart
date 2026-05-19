import 'package:flutter/material.dart';
import '../../domain/entities/order.dart';
import '../models/order_model.dart';

/// مصدر بيانات الطلبات (نسخة محلية وهمية).
///
/// تُستبدل لاحقاً بـ `OrdersRemoteDataSource` يتصل بالـ API.
abstract class OrdersDataSource {
  Future<List<OrderModel>> getOrders();
  Future<List<OrderModel>> getOrdersByStatus(OrderStatus? status);
  Future<void> cancelOrder(String orderNumber);
  Future<void> submitReview({
    required String orderNumber,
    required int companyStars,
    required int techStars,
    required String comment,
  });
}

class OrdersLocalDataSource implements OrdersDataSource {
  static const List<OrderModel> _orders = [
    OrderModel(
      number: '#SNM-2024-1256',
      companyName: 'قطر ووش',
      companyLogo: 'QW',
      companyColor: Color(0xFF1E88E5),
      serviceName: 'غسيل خارجي',
      total: 60,
      dateTime: 'اليوم، 10:00 صباحاً',
      status: OrderStatus.current,
      trackingStep: 2,
    ),
    OrderModel(
      number: '#SNM-2024-1255',
      companyName: 'لمسة فاخرة',
      companyLogo: 'LF',
      companyColor: Color(0xFF8E24AA),
      serviceName: 'غسيل شامل',
      total: 120,
      dateTime: '24 مايو، 2:00 م',
      status: OrderStatus.completed,
    ),
    OrderModel(
      number: '#SNM-2024-1254',
      companyName: 'بريق للغسيل المتنقل',
      companyLogo: 'BR',
      companyColor: Color(0xFFC9A24B),
      serviceName: 'غسيل داخلي',
      total: 80,
      dateTime: '23 مايو، 11:00 ص',
      status: OrderStatus.completed,
    ),
  ];

  @override
  Future<List<OrderModel>> getOrders() async {
    await Future.delayed(const Duration(milliseconds: 400));
    return _orders;
  }

  @override
  Future<List<OrderModel>> getOrdersByStatus(OrderStatus? status) async {
    await Future.delayed(const Duration(milliseconds: 400));
    if (status == null) return _orders;
    return _orders.where((o) => o.status == status).toList();
  }

  @override
  Future<void> cancelOrder(String orderNumber) async {
    await Future.delayed(const Duration(milliseconds: 400));
  }

  @override
  Future<void> submitReview({
    required String orderNumber,
    required int companyStars,
    required int techStars,
    required String comment,
  }) async {
    await Future.delayed(const Duration(milliseconds: 400));
  }
}
