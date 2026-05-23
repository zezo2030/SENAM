import 'package:dio/dio.dart';
import 'package:flutter/material.dart';

import '../../../../core/network/api_client.dart';
import '../../../../core/network/error_mapper.dart';
import '../../domain/entities/order.dart';
import '../models/order_model.dart';
import 'orders_local_datasource.dart';

class OrdersRemoteDataSource implements OrdersDataSource {
  final ApiClient apiClient;

  OrdersRemoteDataSource(this.apiClient);

  Dio get _dio => apiClient.dio;

  OrderStatus _mapStatus(String? raw) {
    switch (raw) {
      case 'completed':
        return OrderStatus.completed;
      case 'cancelled':
      case 'canceled':
        return OrderStatus.cancelled;
      default:
        return OrderStatus.current;
    }
  }

  OrderModel _mapOrder(Map<String, dynamic> json) {
    final company = (json['company'] as Map?) ?? const {};
    final companyName = (company['displayName'] ?? company['name'] ?? '').toString();
    final services = (json['services'] as List?) ?? const [];
    final firstService = services.isNotEmpty && services.first is Map
        ? services.first as Map
        : const {};
    final serviceName = (firstService['name'] ?? '').toString();

    final id = (json['id'] ?? '').toString();
    return OrderModel(
      number: id, // backend UUID; UI shows raw id when no display number is available
      companyName: companyName,
      companyLogo: companyName.isNotEmpty
          ? companyName.substring(0, 1).toUpperCase()
          : '?',
      companyColor: const Color(0xFF1E88E5),
      serviceName: serviceName,
      total: ((json['totalAmount'] ?? json['total'] ?? 0) as num).toInt(),
      dateTime: (json['scheduledAt'] ?? json['createdAt'] ?? '').toString(),
      status: _mapStatus((json['status'] as String?)?.toLowerCase()),
      trackingStep: ((json['trackingStep'] ?? 1) as num).toInt(),
    );
  }

  List<Map<String, dynamic>> _listFrom(dynamic data) {
    if (data is List) {
      return data.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
    }
    if (data is Map && data['data'] is List) {
      return (data['data'] as List)
          .whereType<Map>()
          .map((e) => Map<String, dynamic>.from(e))
          .toList();
    }
    return const [];
  }

  @override
  Future<List<OrderModel>> getOrders() async {
    try {
      final res = await _dio.get('/v1/bookings');
      return _listFrom(res.data).map(_mapOrder).toList();
    } on DioException catch (e) {
      throwFromDio(e);
    }
  }

  @override
  Future<List<OrderModel>> getOrdersByStatus(OrderStatus? status) async {
    try {
      final qp = <String, dynamic>{};
      if (status != null) {
        qp['status'] = switch (status) {
          OrderStatus.completed => 'completed',
          OrderStatus.cancelled => 'cancelled',
          OrderStatus.current => 'in_progress',
        };
      }
      final res = await _dio.get('/v1/bookings', queryParameters: qp);
      return _listFrom(res.data).map(_mapOrder).toList();
    } on DioException catch (e) {
      throwFromDio(e);
    }
  }

  @override
  Future<void> cancelOrder(String orderNumber) async {
    try {
      await _dio.post<void>('/v1/bookings/$orderNumber/cancel');
    } on DioException catch (e) {
      throwFromDio(e);
    }
  }

  @override
  Future<void> submitReview({
    required String orderNumber,
    required int companyStars,
    required int techStars,
    required String comment,
  }) async {
    try {
      await _dio.post<void>(
        '/v1/bookings/$orderNumber/review',
        data: {
          'companyRating': companyStars,
          'technicianRating': techStars,
          'comment': comment,
        },
      );
    } on DioException catch (e) {
      throwFromDio(e);
    }
  }
}
