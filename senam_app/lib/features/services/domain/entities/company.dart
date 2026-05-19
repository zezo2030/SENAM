import 'package:flutter/material.dart';
import 'package:equatable/equatable.dart';
import 'company_service.dart';

/// شركة مقدمة للخدمات.
class Company extends Equatable {
  final String id, name, categoryId, logoLabel, description, address,
      workingHours, durationRange;
  final Color logoColor;
  final double rating, distanceKm;
  final int reviewsCount, startPrice;
  final bool isTrusted;
  final List<CompanyService> services;

  const Company({
    required this.id,
    required this.name,
    required this.categoryId,
    required this.logoLabel,
    required this.logoColor,
    required this.rating,
    required this.reviewsCount,
    required this.startPrice,
    required this.distanceKm,
    required this.durationRange,
    this.isTrusted = true,
    required this.description,
    required this.services,
    required this.address,
    required this.workingHours,
  });

  @override
  List<Object?> get props => [id, name];
}
