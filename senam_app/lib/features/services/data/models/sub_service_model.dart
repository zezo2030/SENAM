import 'package:flutter/material.dart';
import '../../domain/entities/sub_service.dart';

/// نموذج الخدمة الفرعية في طبقة الـ Data.
class SubServiceModel extends SubService {
  const SubServiceModel({
    required super.id,
    required super.categoryId,
    required super.name,
    required super.description,
    required super.icon,
    super.thumbnail,
    super.iconUrl,
    super.imageUrl,
  });

  factory SubServiceModel.fromJson(Map<String, dynamic> json) {
    return SubServiceModel(
      id: json['id']?.toString() ?? '',
      categoryId: json['categoryId']?.toString() ?? '',
      name: json['name'] as String? ?? '',
      description: json['description'] as String? ?? '',
      icon: IconData(
        json['iconCodePoint'] as int? ?? Icons.cleaning_services.codePoint,
        fontFamily: 'MaterialIcons',
      ),
      thumbnail: json['thumbnail'] as String? ?? '',
      iconUrl: json['iconUrl'] as String? ?? '',
      imageUrl: json['imageUrl'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'categoryId': categoryId,
        'name': name,
        'description': description,
        'iconCodePoint': icon.codePoint,
        'thumbnail': thumbnail,
        'iconUrl': iconUrl,
        'imageUrl': imageUrl,
      };
}
