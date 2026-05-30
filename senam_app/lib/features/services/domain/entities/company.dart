import 'package:flutter/material.dart';
import 'package:equatable/equatable.dart';
import 'company_service.dart';

/// Owner-defined filter pill in the company's "designs" gallery.
class GalleryCategory extends Equatable {
  final String id;
  final String ar;
  final String en;
  final int sortOrder;
  const GalleryCategory({
    required this.id,
    required this.ar,
    required this.en,
    this.sortOrder = 0,
  });
  @override
  List<Object?> get props => [id, ar, en, sortOrder];
}

/// One photo in the company's gallery (with optional caption).
class GalleryPhoto extends Equatable {
  final String id;
  final String url;
  final String captionAr;
  final String captionEn;
  const GalleryPhoto({
    required this.id,
    required this.url,
    this.captionAr = '',
    this.captionEn = '',
  });
  @override
  List<Object?> get props => [id, url];
}

/// One "مميزات الشركة" chip — Arabic/English label + optional icon id
/// matching the dashboard's icon catalog (e.g. `'warranty'`, `'design'`).
class CompanyFeature extends Equatable {
  final String ar;
  final String en;
  final String? icon;
  const CompanyFeature({required this.ar, this.en = '', this.icon});
  String get label => ar.isNotEmpty ? ar : en;
  @override
  List<Object?> get props => [ar, en, icon];
}

/// شركة مقدمة للخدمات.
class Company extends Equatable {
  final String id, name, categoryId, logoLabel, description, address,
      workingHours, durationRange;
  final Color logoColor;
  final double rating, distanceKm;
  final int reviewsCount, startPrice;
  final bool isTrusted;
  final List<CompanyService> services;
  final List<String> subServiceIds;
  final String experienceYears;

  // Contact channels rendered as the 4 action pills.
  final String phone;
  final String whatsapp;
  final String whatsappLink;
  final String instagram;

  // Location pill / "open in maps" target.
  final String city;
  final double? latitude;
  final double? longitude;
  final String mapUrl;

  // Hero image + portfolio.
  final String logoUrl;
  final String coverPhoto;
  final List<String> workPhotos;
  final List<GalleryCategory> galleryCategories;

  /// `categoryId` → photos. The empty string key ("") holds uncategorized.
  final Map<String, List<GalleryPhoto>> gallery;

  /// مميزات الشركة chips — full `{ar, en, icon}` objects from the API.
  final List<CompanyFeature> features;

  final Map<int, int> ratingBreakdown;

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
    this.subServiceIds = const [],
    this.experienceYears = '',
    this.phone = '',
    this.whatsapp = '',
    this.whatsappLink = '',
    this.instagram = '',
    this.city = 'الدوحة',
    this.latitude,
    this.longitude,
    this.mapUrl = '',
    this.logoUrl = '',
    this.coverPhoto = '',
    this.workPhotos = const [],
    this.galleryCategories = const [],
    this.gallery = const {},
    this.features = const [],
    this.ratingBreakdown = const {},
  });

  @override
  List<Object?> get props => [id, name];
}
