import 'package:flutter/material.dart';
import '../../domain/entities/service_category.dart';

/// نموذج تصنيف الخدمة في طبقة الـ Data.
class ServiceCategoryModel extends ServiceCategory {
  const ServiceCategoryModel({
    required super.id,
    required super.name,
    required super.icon,
  });

  factory ServiceCategoryModel.fromJson(Map<String, dynamic> json) {
    return ServiceCategoryModel(
      id: json['id']?.toString() ?? '',
      name: json['name'] as String? ?? '',
      icon: IconData(
        json['iconCodePoint'] as int? ?? Icons.category.codePoint,
        fontFamily: 'MaterialIcons',
      ),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'iconCodePoint': icon.codePoint,
      };
}
