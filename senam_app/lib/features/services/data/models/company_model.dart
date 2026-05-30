import 'package:flutter/material.dart';
import '../../domain/entities/company.dart';
import '../../domain/entities/company_service.dart';

/// نموذج خدمة الشركة في طبقة الـ Data.
class CompanyServiceModel extends CompanyService {
  const CompanyServiceModel({
    required super.name,
    required super.price,
    required super.duration,
  });

  factory CompanyServiceModel.fromJson(Map<String, dynamic> json) {
    return CompanyServiceModel(
      name: json['name'] as String? ?? '',
      price: json['price'] as int? ?? 0,
      duration: json['duration'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
        'name': name,
        'price': price,
        'duration': duration,
      };
}

/// نموذج الشركة في طبقة الـ Data.
class CompanyModel extends Company {
  const CompanyModel({
    required super.id,
    required super.name,
    required super.categoryId,
    required super.logoLabel,
    required super.logoColor,
    required super.rating,
    required super.reviewsCount,
    required super.startPrice,
    required super.distanceKm,
    required super.durationRange,
    super.isTrusted,
    required super.description,
    required super.services,
    required super.address,
    required super.workingHours,
    super.subServiceIds,
    super.experienceYears,
    super.phone,
    super.whatsapp,
    super.whatsappLink,
    super.instagram,
    super.city,
    super.latitude,
    super.longitude,
    super.mapUrl,
    super.logoUrl,
    super.coverPhoto,
    super.workPhotos,
    super.galleryCategories,
    super.gallery,
    super.features,
    super.ratingBreakdown,
  });

  factory CompanyModel.fromJson(Map<String, dynamic> json) {
    return CompanyModel(
      id: json['id']?.toString() ?? '',
      name: json['name'] as String? ?? '',
      categoryId: json['categoryId'] as String? ?? '',
      logoLabel: json['logoLabel'] as String? ?? '',
      logoColor: Color(json['logoColor'] as int? ?? 0xFF000000),
      rating: (json['rating'] as num?)?.toDouble() ?? 0,
      reviewsCount: json['reviewsCount'] as int? ?? 0,
      startPrice: json['startPrice'] as int? ?? 0,
      distanceKm: (json['distanceKm'] as num?)?.toDouble() ?? 0,
      durationRange: json['durationRange'] as String? ?? '',
      isTrusted: json['isTrusted'] as bool? ?? true,
      description: json['description'] as String? ?? '',
      services: (json['services'] as List<dynamic>? ?? [])
          .map((e) => CompanyServiceModel.fromJson(
              Map<String, dynamic>.from(e as Map)))
          .toList(),
      address: json['address'] as String? ?? '',
      workingHours: json['workingHours'] as String? ?? '',
      subServiceIds: ((json['subServiceIds'] as List<dynamic>?) ?? [])
          .map((e) => e.toString())
          .toList(),
      experienceYears: json['experienceYears'] as String? ?? '',
      phone: json['phone'] as String? ?? '',
      whatsapp: json['whatsapp'] as String? ?? '',
      whatsappLink: json['whatsappLink'] as String? ?? '',
      instagram: json['instagram'] as String? ?? '',
      city: json['city'] as String? ?? 'الدوحة',
      mapUrl: json['mapUrl'] as String? ?? '',
      logoUrl: json['logoUrl'] as String? ?? '',
      coverPhoto: json['coverPhoto'] as String? ?? '',
      workPhotos: ((json['workPhotos'] as List<dynamic>?) ?? [])
          .map((e) => e.toString())
          .toList(),
      galleryCategories: ((json['galleryCategories'] as List<dynamic>?) ?? [])
          .whereType<Map>()
          .map((e) => GalleryCategory(
                id: (e['id'] ?? '').toString(),
                ar: (e['ar'] ?? '').toString(),
                en: (e['en'] ?? '').toString(),
                sortOrder: (e['sortOrder'] as int?) ?? 0,
              ))
          .toList(),
      features: ((json['features'] as List<dynamic>?) ?? [])
          .map((e) {
            if (e is Map) {
              return CompanyFeature(
                ar: (e['ar'] ?? '').toString(),
                en: (e['en'] ?? '').toString(),
                icon: (e['icon'] as String?)?.trim().isNotEmpty == true
                    ? (e['icon'] as String).trim()
                    : null,
              );
            }
            // Tolerate legacy string payloads.
            return CompanyFeature(ar: e.toString());
          })
          .toList(),
      ratingBreakdown: ((json['ratingBreakdown'] as Map?) ?? {})
          .map((k, v) => MapEntry(int.parse(k.toString()), v as int)),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'categoryId': categoryId,
        'logoLabel': logoLabel,
        'logoColor': logoColor.toARGB32(),
        'rating': rating,
        'reviewsCount': reviewsCount,
        'startPrice': startPrice,
        'distanceKm': distanceKm,
        'durationRange': durationRange,
        'isTrusted': isTrusted,
        'description': description,
        'services': services
            .map((e) => e is CompanyServiceModel
                ? e.toJson()
                : CompanyServiceModel(
                        name: e.name,
                        price: e.price,
                        duration: e.duration)
                    .toJson())
            .toList(),
        'address': address,
        'workingHours': workingHours,
        'subServiceIds': subServiceIds,
        'experienceYears': experienceYears,
        'phone': phone,
        'whatsapp': whatsapp,
        'whatsappLink': whatsappLink,
        'instagram': instagram,
        'city': city,
        'mapUrl': mapUrl,
        'logoUrl': logoUrl,
        'coverPhoto': coverPhoto,
        'workPhotos': workPhotos,
        'features': features
            .map((f) => {
                  'ar': f.ar,
                  'en': f.en,
                  if (f.icon != null) 'icon': f.icon,
                })
            .toList(),
        'ratingBreakdown':
            ratingBreakdown.map((k, v) => MapEntry(k.toString(), v)),
      };
}
