import 'package:dio/dio.dart';
import 'package:flutter/material.dart';

import '../../../../core/network/api_client.dart';
import '../../../../core/network/error_mapper.dart';
import '../models/company_model.dart';
import '../models/review_model.dart';
import '../models/service_category_model.dart';
import 'services_local_datasource.dart';

class ServicesRemoteDataSource implements ServicesDataSource {
  final ApiClient apiClient;
  final ServicesLocalDataSource _fallback = ServicesLocalDataSource();

  ServicesRemoteDataSource(this.apiClient);

  Dio get _dio => apiClient.dio;

  static const _categoryIcons = <String, IconData>{
    'carwash': Icons.local_car_wash,
    'cleaning': Icons.cleaning_services,
    'barber': Icons.content_cut,
    'maintenance': Icons.build,
    'electric': Icons.bolt,
    'plumber': Icons.plumbing,
    'plumbing': Icons.plumbing,
  };

  IconData _iconForSlug(String slug) =>
      _categoryIcons[slug.toLowerCase()] ?? Icons.category;

  Color _colorForId(String id) {
    final palette = <Color>[
      const Color(0xFF1E88E5),
      const Color(0xFF8E24AA),
      const Color(0xFFC9A24B),
      const Color(0xFF26A69A),
      const Color(0xFFEF5350),
      const Color(0xFFE0A93C),
    ];
    final code = id.codeUnits.fold<int>(0, (a, b) => a + b);
    return palette[code % palette.length];
  }

  String _logoLabel(String name) {
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty) return '?';
    if (parts.length == 1) {
      final w = parts.first;
      return w.length >= 2 ? w.substring(0, 2).toUpperCase() : w.toUpperCase();
    }
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  ServiceCategoryModel _mapCategory(Map<String, dynamic> json) {
    final slug = (json['slug'] ?? json['id'] ?? '').toString();
    final nameAr = json['nameAr'] ?? json['name_ar'] ?? json['name'] ?? slug;
    return ServiceCategoryModel(
      id: (json['id'] ?? slug).toString(),
      name: nameAr.toString(),
      icon: _iconForSlug(slug),
    );
  }

  CompanyModel _mapCompany(Map<String, dynamic> json) {
    final id = (json['id'] ?? '').toString();
    final name = (json['displayName'] ??
            json['legalName'] ??
            json['name'] ??
            '')
        .toString();
    final categoryId = (json['categoryId'] ??
            json['primaryCategoryId'] ??
            json['categorySlug'] ??
            '')
        .toString();
    final rating = (json['ratingAvg'] ?? json['rating'] ?? 0) as num;
    final reviews = (json['ratingCount'] ?? json['reviewsCount'] ?? 0) as num;

    final services = ((json['services'] as List?) ?? [])
        .whereType<Map>()
        .map((s) => CompanyServiceModel(
              name: (s['name'] ?? s['displayName'] ?? '').toString(),
              price: ((s['price'] ?? s['startPrice'] ?? 0) as num).toInt(),
              duration: ((s['durationMinutes'] ?? s['duration'] ?? '').toString()),
            ))
        .toList();

    return CompanyModel(
      id: id,
      name: name,
      categoryId: categoryId,
      logoLabel: _logoLabel(name),
      logoColor: _colorForId(id),
      rating: rating.toDouble(),
      reviewsCount: reviews.toInt(),
      startPrice: ((json['startPrice'] ?? 0) as num).toInt(),
      distanceKm: ((json['distanceKm'] ?? 0) as num).toDouble(),
      durationRange: (json['durationRange'] ?? '').toString(),
      isTrusted: json['kycStatus'] == 'approved' ||
          json['status'] == 'active' ||
          json['isTrusted'] == true,
      description: (json['description'] ?? '').toString(),
      services: services,
      address: (json['address'] ?? '').toString(),
      workingHours: (json['workingHours'] ?? '').toString(),
    );
  }

  List<Map<String, dynamic>> _listFrom(dynamic data) {
    if (data is List) return data.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
    if (data is Map && data['data'] is List) {
      return (data['data'] as List)
          .whereType<Map>()
          .map((e) => Map<String, dynamic>.from(e))
          .toList();
    }
    return const [];
  }

  @override
  Future<List<ServiceCategoryModel>> getCategories() async {
    try {
      final res = await _dio.get('/v1/categories');
      return _listFrom(res.data).map(_mapCategory).toList();
    } on DioException catch (e) {
      throwFromDio(e);
    }
  }

  @override
  Future<List<CompanyModel>> getCompanies() async {
    try {
      final res = await _dio.get('/v1/companies');
      return _listFrom(res.data).map(_mapCompany).toList();
    } on DioException catch (e) {
      throwFromDio(e);
    }
  }

  @override
  Future<List<CompanyModel>> getCompaniesByCategory(String categoryId) async {
    try {
      final res = await _dio.get('/v1/companies',
          queryParameters: {'categoryId': categoryId});
      return _listFrom(res.data).map(_mapCompany).toList();
    } on DioException catch (e) {
      throwFromDio(e);
    }
  }

  @override
  Future<List<ReviewModel>> getCompanyReviews(String companyId) async {
    // No public GET endpoint for company reviews exists yet — fall back to mocks.
    return _fallback.getCompanyReviews(companyId);
  }

  @override
  Future<List<CompanyModel>> getFavoriteCompanies() async {
    try {
      final res = await _dio.get('/v1/me/favorites');
      return _listFrom(res.data).map(_mapCompany).toList();
    } on DioException catch (e) {
      throwFromDio(e);
    }
  }
}
