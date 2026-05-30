import 'package:flutter/material.dart';
import 'package:equatable/equatable.dart';

/// خدمة فرعية ضمن تصنيف رئيسي.
class SubService extends Equatable {
  final String id;
  final String categoryId;
  final String name;
  final String description;
  final IconData icon;
  final String thumbnail;
  final String iconUrl;
  final String imageUrl;

  const SubService({
    required this.id,
    required this.categoryId,
    required this.name,
    required this.description,
    required this.icon,
    this.thumbnail = '',
    this.iconUrl = '',
    this.imageUrl = '',
  });

  @override
  List<Object?> get props => [id, categoryId, name];
}
