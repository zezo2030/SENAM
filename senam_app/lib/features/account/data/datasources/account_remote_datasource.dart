import 'package:dio/dio.dart';
import 'package:flutter/material.dart';

import '../../../../core/network/api_client.dart';
import '../../../../core/network/error_mapper.dart';
import '../models/app_notification_model.dart';
import '../models/user_profile_model.dart';
import 'account_local_datasource.dart';

class AccountRemoteDataSource implements AccountDataSource {
  final ApiClient apiClient;

  AccountRemoteDataSource(this.apiClient);

  Dio get _dio => apiClient.dio;

  @override
  Future<UserProfileModel> getProfile() async {
    try {
      final res = await _dio.get<Map<String, dynamic>>('/v1/me');
      final data = res.data ?? const {};
      return UserProfileModel(
        name: (data['displayName'] ??
                data['name'] ??
                data['email']?.toString().split('@').first ??
                '')
            .toString(),
        phone: (data['phone'] ?? '').toString(),
        email: data['email']?.toString(),
      );
    } on DioException catch (e) {
      throwFromDio(e);
    }
  }

  IconData _iconForType(String? type) {
    switch (type) {
      case 'order_accepted':
      case 'on_the_way':
        return Icons.local_shipping;
      case 'completed':
        return Icons.check_circle;
      case 'offer':
      case 'promotion':
        return Icons.local_offer;
      case 'rate':
      case 'review_request':
        return Icons.star;
      default:
        return Icons.notifications;
    }
  }

  @override
  Future<List<AppNotificationModel>> getNotifications() async {
    try {
      final res = await _dio.get('/v1/notifications');
      final raw = res.data;
      final list = raw is List
          ? raw
          : (raw is Map && raw['data'] is List ? raw['data'] as List : const []);
      return list.whereType<Map>().map((m) {
        final json = Map<String, dynamic>.from(m);
        return AppNotificationModel(
          icon: _iconForType(json['type'] as String?),
          title: (json['title'] ?? '').toString(),
          body: (json['body'] ?? json['message'] ?? '').toString(),
          time: (json['createdAt'] ?? json['time'] ?? '').toString(),
          isUnread: json['readAt'] == null && json['isUnread'] != false,
        );
      }).toList();
    } on DioException catch (e) {
      throwFromDio(e);
    }
  }
}
