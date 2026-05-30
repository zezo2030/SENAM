import 'package:dio/dio.dart';
import 'package:flutter/material.dart';

import '../../../../core/config/media_url.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/error_mapper.dart';
import '../../domain/entities/company.dart'
    show CompanyFeature, GalleryCategory, GalleryPhoto;
import '../models/company_model.dart';
import '../models/review_model.dart';
import '../models/service_category_model.dart';
import '../models/sub_service_model.dart';
import 'services_local_datasource.dart';

class ServicesRemoteDataSource implements ServicesDataSource {
  final ApiClient apiClient;

  ServicesRemoteDataSource(this.apiClient);

  Dio get _dio => apiClient.dio;

  static const _categoryIcons = <String, IconData>{
    'car-wash': Icons.local_car_wash,
    'carwash': Icons.local_car_wash,
    'detailing': Icons.auto_fix_high,
    'cleaning': Icons.cleaning_services,
    'painting': Icons.format_paint,
    'general-maintenance': Icons.build,
    'maintenance': Icons.build,
    'electrical': Icons.bolt,
    'electric': Icons.bolt,
    'plumbing': Icons.plumbing,
    'plumber': Icons.plumbing,
    'carpentry': Icons.handyman,
    'kitchens-furniture': Icons.kitchen,
    'car-rental': Icons.directions_car,
    'barber': Icons.content_cut,
  };

  static const _subServiceIcons = <String, IconData>{
    // car wash
    'external-wash': Icons.local_car_wash,
    'full-wash': Icons.car_repair,
    'steam-wash': Icons.water_drop,
    // detailing
    'interior-detailing': Icons.airline_seat_recline_normal,
    'full-detailing': Icons.auto_fix_high,
    // cleaning
    'home-cleaning': Icons.home_outlined,
    'office-cleaning': Icons.business_center_outlined,
    'deep-cleaning': Icons.cleaning_services_outlined,
    // painting
    'interior-painting': Icons.format_paint,
    'exterior-painting': Icons.brush_outlined,
    // maintenance
    'ac-maintenance': Icons.ac_unit,
    'general-repair': Icons.handyman_outlined,
    // electrical
    'electric-repair': Icons.electrical_services,
    'electric-install': Icons.power,
    // plumbing
    'leak-fix': Icons.water_damage_outlined,
    'pipe-install': Icons.plumbing,
    // carpentry
    'wood-repair': Icons.carpenter,
    'wood-install': Icons.chair_alt_outlined,
    // kitchens & furniture
    'kitchen-install': Icons.kitchen,
    'furniture-assembly': Icons.chair_outlined,
    // car rental
    'daily-rental': Icons.today,
    'monthly-rental': Icons.date_range,
  };

  IconData _iconForSlug(String slug) =>
      _categoryIcons[slug.toLowerCase()] ?? Icons.category;

  IconData _iconForSubServiceSlug(String slug) =>
      _subServiceIcons[slug.toLowerCase()] ?? Icons.miscellaneous_services;

  // TypeORM serializes Postgres `decimal`/`numeric` columns as strings
  // (e.g. ratingAvg "0.00"), so a plain `as num` cast throws.
  num _toNum(dynamic v, [num fallback = 0]) {
    if (v is num) return v;
    if (v is String) return num.tryParse(v) ?? fallback;
    return fallback;
  }

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

  SubServiceModel _mapSubService(Map<String, dynamic> json) {
    final slug = (json['slug'] ?? '').toString();
    final nameAr =
        json['nameAr'] ?? json['name_ar'] ?? json['name'] ?? slug;
    final descAr = json['descriptionAr'] ??
        json['description_ar'] ??
        json['description'] ??
        '';
    final categoryId = (json['categoryId'] ??
            json['category_id'] ??
            '')
        .toString();
    final iconUrl = resolveMediaUrl(
      (json['iconKey'] ?? json['icon_key'] ?? json['iconUrl'] ?? '')
          .toString(),
    );
    final imageUrl = resolveMediaUrl(
      (json['imageKey'] ?? json['image_key'] ?? json['imageUrl'] ?? '')
          .toString(),
    );
    return SubServiceModel(
      id: (json['id'] ?? slug).toString(),
      categoryId: categoryId,
      name: nameAr.toString(),
      description: descAr.toString(),
      icon: _iconForSubServiceSlug(slug),
      thumbnail: '',
      iconUrl: iconUrl,
      imageUrl: imageUrl,
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
    final rating = _toNum(json['ratingAvg'] ?? json['rating']);
    final reviews = _toNum(json['ratingCount'] ?? json['reviewsCount']);

    final services = ((json['services'] as List?) ?? [])
        .whereType<Map>()
        .map((s) => CompanyServiceModel(
              name: (s['name'] ?? s['displayName'] ?? '').toString(),
              price: _toNum(s['price'] ?? s['startPrice']).toInt(),
              duration: ((s['durationMinutes'] ?? s['duration'] ?? '').toString()),
            ))
        .toList();

    // Catalog service IDs this company offers — used to compute per-service
    // company counts on the category page.
    final subServiceIds = ((json['subServiceIds'] as List?) ?? [])
        .map((e) => e.toString())
        .where((e) => e.isNotEmpty)
        .toList();

    // Contacts may live nested under `contacts` (new shape) or flat on the row.
    final contacts = (json['contacts'] is Map)
        ? Map<String, dynamic>.from(json['contacts'] as Map)
        : const <String, dynamic>{};
    final phone =
        (contacts['phone'] ?? json['phone'] ?? '').toString();
    final whatsappLink =
        (contacts['whatsappLink'] ?? json['whatsappLink'] ?? '').toString();
    final instagram =
        (contacts['instagram'] ?? json['instagram'] ?? '').toString();

    // Location may live nested under `location` (new shape) or flat.
    final location = (json['location'] is Map)
        ? Map<String, dynamic>.from(json['location'] as Map)
        : const <String, dynamic>{};
    final city = (location['city'] ?? json['city'] ?? 'الدوحة').toString();
    final latitude = _toNum(location['latitude'] ?? json['latitude'], double.nan);
    final longitude = _toNum(location['longitude'] ?? json['longitude'], double.nan);
    final mapUrl = (location['mapUrl'] ?? json['mapUrl'] ?? '').toString();

    final logoUrl = resolveMediaUrl(
      (json['logoUrl'] ?? json['logoObjectKey'] ?? '').toString(),
    );
    final coverPhoto = resolveMediaUrl(
      (json['coverUrl'] ?? json['coverObjectKey'] ?? '').toString(),
    );

    final categories = <GalleryCategory>[];
    for (final raw in (json['galleryCategories'] as List? ?? const [])) {
      if (raw is! Map) continue;
      categories.add(GalleryCategory(
        id: (raw['id'] ?? '').toString(),
        ar: (raw['ar'] ?? '').toString(),
        en: (raw['en'] ?? '').toString(),
        sortOrder: (raw['sortOrder'] as int?) ?? 0,
      ));
    }

    final gallery = <String, List<GalleryPhoto>>{};
    final flatWorkPhotos = <String>[];
    for (final raw in (json['gallery'] as List? ?? const [])) {
      if (raw is! Map) continue;
      final catId = (raw['categoryId'] ?? '').toString();
      final photos = <GalleryPhoto>[];
      for (final p in (raw['photos'] as List? ?? const [])) {
        if (p is! Map) continue;
        final url = resolveMediaUrl((p['url'] ?? p['objectKey'] ?? '').toString());
        photos.add(GalleryPhoto(
          id: (p['id'] ?? '').toString(),
          url: url,
          captionAr: (p['captionAr'] ?? '').toString(),
          captionEn: (p['captionEn'] ?? '').toString(),
        ));
        if (url.isNotEmpty) flatWorkPhotos.add(url);
      }
      gallery[catId] = photos;
    }

    // Localized features payload `[{ar, en, icon?}]` from the provider's
    // dashboard. We keep the full object so the details page can render the
    // chosen icon next to each label.
    final features = <CompanyFeature>[];
    for (final raw in (json['features'] as List? ?? const [])) {
      if (raw is Map) {
        final ar = (raw['ar'] ?? '').toString();
        final en = (raw['en'] ?? '').toString();
        if (ar.isEmpty && en.isEmpty) continue;
        final iconRaw = (raw['icon'] ?? '').toString().trim();
        features.add(CompanyFeature(
          ar: ar,
          en: en,
          icon: iconRaw.isEmpty ? null : iconRaw,
        ));
      } else if (raw is String && raw.isNotEmpty) {
        features.add(CompanyFeature(ar: raw));
      }
    }

    return CompanyModel(
      id: id,
      name: name,
      categoryId: categoryId,
      logoLabel: _logoLabel(name),
      logoColor: _colorForId(id),
      rating: rating.toDouble(),
      reviewsCount: reviews.toInt(),
      startPrice: _toNum(json['startPrice']).toInt(),
      distanceKm: _toNum(json['distanceKm']).toDouble(),
      durationRange: (json['durationRange'] ?? '').toString(),
      isTrusted: json['kycStatus'] == 'approved' ||
          json['status'] == 'active' ||
          json['isTrusted'] == true,
      description: (json['description'] ?? '').toString(),
      services: services,
      subServiceIds: subServiceIds,
      address: (json['address'] ?? '').toString(),
      workingHours: (json['workingHours'] ?? '').toString(),
      phone: phone,
      // رقم الواتساب الذي تضبطه الشركة من لوحة التحكم؛ يقع على الهاتف
      // العادي لو لم يُحدَّد رقم واتساب مستقل.
      whatsapp: whatsappLink.isNotEmpty ? whatsappLink : phone,
      whatsappLink: whatsappLink,
      instagram: instagram,
      city: city,
      latitude: latitude.isNaN ? null : latitude.toDouble(),
      longitude: longitude.isNaN ? null : longitude.toDouble(),
      mapUrl: mapUrl,
      logoUrl: logoUrl,
      coverPhoto: coverPhoto,
      workPhotos: flatWorkPhotos,
      galleryCategories: categories,
      gallery: gallery,
      features: features,
    );
  }

  List<Map<String, dynamic>> _listFrom(dynamic data) {
    if (data is List) {
      return data
          .whereType<Map>()
          .map((e) => Map<String, dynamic>.from(e))
          .toList();
    }
    if (data is Map && data['data'] is List) {
      return (data['data'] as List)
          .whereType<Map>()
          .map((e) => Map<String, dynamic>.from(e))
          .toList();
    }
    if (data is Map && data['items'] is List) {
      return (data['items'] as List)
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
  Future<CompanyModel> getCompanyDetail(String companyId) async {
    try {
      final res = await _dio.get('/v1/companies/$companyId');
      final data = res.data is Map && (res.data as Map)['data'] is Map
          ? (res.data as Map)['data']
          : res.data;
      return _mapCompany(Map<String, dynamic>.from(data as Map));
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
  Future<List<CompanyModel>> getCompaniesBySubService(
      String subServiceId) async {
    try {
      final res = await _dio.get('/v1/companies',
          queryParameters: {'serviceId': subServiceId});
      return _listFrom(res.data).map(_mapCompany).toList();
    } on DioException catch (e) {
      throwFromDio(e);
    }
  }

  @override
  Future<List<SubServiceModel>> getSubServices(String categoryId) async {
    try {
      final res = await _dio.get('/v1/services',
          queryParameters: {'categoryId': categoryId});
      return _listFrom(res.data).map(_mapSubService).toList();
    } on DioException catch (e) {
      throwFromDio(e);
    }
  }

  @override
  Future<List<ReviewModel>> getCompanyReviews(String companyId) async {
    try {
      final res = await _dio.get('/v1/companies/$companyId/reviews');
      return _listFrom(res.data).map(ReviewModel.fromJson).toList();
    } on DioException catch (e) {
      throwFromDio(e);
    }
  }

  @override
  Future<ReviewModel> submitCompanyReview({
    required String companyId,
    required int rating,
    String? comment,
  }) async {
    try {
      final res = await _dio.post<Map<String, dynamic>>(
        '/v1/companies/$companyId/reviews',
        data: {
          'ratingCompany': rating,
          if (comment != null && comment.trim().isNotEmpty)
            'comment': comment.trim(),
        },
      );
      return ReviewModel.fromJson(res.data ?? const {});
    } on DioException catch (e) {
      throwFromDio(e);
    }
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
