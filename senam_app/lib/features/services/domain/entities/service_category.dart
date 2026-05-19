import 'package:flutter/material.dart';
import 'package:equatable/equatable.dart';

/// تصنيف خدمة (غسيل سيارات، حلاقة، تنظيف ...).
class ServiceCategory extends Equatable {
  final String id;
  final String name;
  final IconData icon;

  const ServiceCategory({
    required this.id,
    required this.name,
    required this.icon,
  });

  @override
  List<Object?> get props => [id, name];
}
