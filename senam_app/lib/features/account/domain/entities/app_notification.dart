import 'package:flutter/material.dart';
import 'package:equatable/equatable.dart';

/// كيان الإشعار في طبقة الـ Domain.
class AppNotification extends Equatable {
  final IconData icon;
  final String title, body, time;
  final bool isUnread;

  const AppNotification({
    required this.icon,
    required this.title,
    required this.body,
    required this.time,
    this.isUnread = false,
  });

  @override
  List<Object?> get props => [title, time];
}
