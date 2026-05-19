import 'package:flutter/material.dart';
import '../../domain/entities/app_notification.dart';

/// نموذج بيانات الإشعار — يضيف تحويل JSON.
/// يُمثَّل الأيقونة عبر codePoint للتبسيط.
class AppNotificationModel extends AppNotification {
  const AppNotificationModel({
    required super.icon,
    required super.title,
    required super.body,
    required super.time,
    super.isUnread,
  });

  factory AppNotificationModel.fromJson(Map<String, dynamic> json) {
    return AppNotificationModel(
      icon: IconData(
        json['icon'] as int? ?? Icons.notifications.codePoint,
        fontFamily: 'MaterialIcons',
      ),
      title: json['title'] as String? ?? '',
      body: json['body'] as String? ?? '',
      time: json['time'] as String? ?? '',
      isUnread: json['isUnread'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() => {
        'icon': icon.codePoint,
        'title': title,
        'body': body,
        'time': time,
        'isUnread': isUnread,
      };
}
