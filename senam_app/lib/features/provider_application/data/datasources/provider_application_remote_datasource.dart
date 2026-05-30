import 'dart:io';
import 'package:dio/dio.dart';

import '../../../../core/error/exceptions.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/error_mapper.dart';
import '../../domain/entities/kyc_document.dart';
import '../models/application_status_model.dart';

abstract class ProviderApplicationDataSource {
  Future<String> uploadFile({
    required File file,
    required String contentType,
    required String purpose,
  });

  Future<CompanyApplicationResultModel> submit(CompanyApplicationDraft draft);

  Future<CompanyApplicationStatusModel> getStatus(String companyId);

  Future<List<CatalogCategory>> fetchCategories();

  Future<List<CatalogService>> fetchServices({String? categoryId});
}

class ProviderApplicationRemoteDataSource
    implements ProviderApplicationDataSource {
  final ApiClient apiClient;

  /// Dio بدون auth interceptor — يُستخدم لرفع الملف على الـ signed URL مباشرة.
  final Dio rawDio;

  ProviderApplicationRemoteDataSource(this.apiClient)
      : rawDio = Dio(BaseOptions(
          connectTimeout: const Duration(seconds: 30),
          sendTimeout: const Duration(minutes: 2),
          receiveTimeout: const Duration(seconds: 30),
          validateStatus: (s) => s != null && s >= 200 && s < 300,
        ));

  Dio get _dio => apiClient.dio;

  @override
  Future<String> uploadFile({
    required File file,
    required String contentType,
    required String purpose,
  }) async {
    try {
      final presign = await _dio.post<Map<String, dynamic>>(
        '/v1/uploads/presign',
        data: {
          'purpose': purpose,
          'contentType': contentType,
        },
      );
      final data = presign.data;
      if (data == null) {
        throw const ServerException('استجابة غير صالحة من الخادم');
      }
      final uploadUrl = data['uploadUrl'] as String?;
      final objectKey = data['objectKey'] as String?;
      if (uploadUrl == null || objectKey == null) {
        throw const ServerException('استجابة رفع غير صالحة');
      }

      final bytes = await file.readAsBytes();
      await rawDio.put<void>(
        uploadUrl,
        data: bytes,
        options: Options(
          headers: {
            Headers.contentTypeHeader: contentType,
            Headers.contentLengthHeader: bytes.length,
          },
        ),
      );

      return objectKey;
    } on DioException catch (e) {
      throwFromDio(e);
    }
  }

  @override
  Future<CompanyApplicationResultModel> submit(
    CompanyApplicationDraft draft,
  ) async {
    try {
      final body = <String, dynamic>{
        'legalName': draft.legalName,
        'displayName': draft.displayName,
        'slug': draft.slug,
        'hasCommercialRegistration': draft.hasCommercialRegistration,
        'ownerEmail': draft.ownerEmail.trim().toLowerCase(),
        'ownerPassword': draft.ownerPassword,
        'documents': draft.documents
            .map((d) => {'kind': d.kind.apiValue, 'objectKey': d.objectKey})
            .toList(),
      };

      // Step 1 optionals
      if (draft.logoObjectKey != null) body['logoObjectKey'] = draft.logoObjectKey;
      if (draft.categoryId != null && _isUuid(draft.categoryId!)) {
        body['categoryId'] = draft.categoryId;
      }
      if (_isFilled(draft.commercialRegistrationNo)) {
        body['commercialRegistrationNo'] = draft.commercialRegistrationNo;
      }
      if (_isFilled(draft.description)) body['description'] = draft.description;
      if (_isFilled(draft.phone)) body['phone'] = draft.phone;
      if (_isFilled(draft.email)) body['email'] = draft.email!.trim().toLowerCase();
      if (_isFilled(draft.website)) body['website'] = draft.website;
      if (_isFilled(draft.instagram)) body['instagram'] = draft.instagram;
      if (_isFilled(draft.region)) body['region'] = draft.region;
      if (_isFilled(draft.city)) body['city'] = draft.city;

      // Step 2
      final cleanServiceIds =
          draft.serviceIds.where((id) => _isUuid(id.trim())).toList();
      if (cleanServiceIds.isNotEmpty) body['serviceIds'] = cleanServiceIds;
      if (_isFilled(draft.customServiceText)) {
        body['customServiceText'] = draft.customServiceText;
      }

      // Step 3
      if (draft.portfolioPhotos.isNotEmpty) {
        body['portfolioPhotos'] = draft.portfolioPhotos
            .map((p) => {'objectKey': p.objectKey, 'sortOrder': p.sortOrder})
            .toList();
      }
      if (_isFilled(draft.landline)) body['landline'] = draft.landline;
      if (_isFilled(draft.whatsappLink)) body['whatsappLink'] = draft.whatsappLink;
      if (_isFilled(draft.additionalNotes)) {
        body['additionalNotes'] = draft.additionalNotes;
      }

      // Step 4
      if (draft.subscriptionPlan != null) {
        body['subscriptionPlan'] = draft.subscriptionPlan!.apiValue;
      }
      if (draft.subscriptionPeriod != null) {
        body['subscriptionPeriod'] = draft.subscriptionPeriod!.apiValue;
      }
      if (draft.subscriptionPrice != null) {
        body['subscriptionPrice'] = draft.subscriptionPrice;
      }

      if (_isFilled(draft.ownerDisplayName)) {
        body['ownerDisplayName'] = draft.ownerDisplayName;
      }

      final res = await _dio.post<Map<String, dynamic>>(
        '/v1/provider/applications',
        data: body,
      );
      final data = res.data;
      if (data == null) {
        throw const ServerException('استجابة فارغة من الخادم');
      }
      return CompanyApplicationResultModel.fromJson(data);
    } on DioException catch (e) {
      throwFromDio(e);
    }
  }

  static bool _isFilled(String? v) => v != null && v.trim().isNotEmpty;

  static final RegExp _uuidRegex = RegExp(
    r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$',
  );

  static bool _isUuid(String v) => _uuidRegex.hasMatch(v);

  @override
  Future<CompanyApplicationStatusModel> getStatus(String companyId) async {
    try {
      final res = await _dio.get<Map<String, dynamic>>(
        '/v1/provider/applications/$companyId',
      );
      final data = res.data;
      if (data == null) {
        throw const ServerException('استجابة فارغة من الخادم');
      }
      return CompanyApplicationStatusModel.fromJson(data);
    } on DioException catch (e) {
      throwFromDio(e);
    }
  }

  @override
  Future<List<CatalogCategory>> fetchCategories() async {
    try {
      final res = await _dio.get<dynamic>('/v1/categories');
      final raw = res.data;
      final list = raw is List
          ? raw
          : raw is Map<String, dynamic>
              ? (raw['data'] as List? ?? const [])
              : const [];
      return list
          .whereType<Map<String, dynamic>>()
          .map((j) => CatalogCategory(
                id: j['id']?.toString() ?? '',
                slug: j['slug']?.toString() ?? '',
                nameAr: (j['nameAr'] ?? j['name_ar'] ?? j['slug'] ?? '').toString(),
                nameEn: (j['nameEn'] ?? j['name_en'])?.toString(),
              ))
          .where((c) => c.id.isNotEmpty)
          .toList();
    } on DioException catch (e) {
      throwFromDio(e);
    }
  }

  @override
  Future<List<CatalogService>> fetchServices({String? categoryId}) async {
    try {
      final res = await _dio.get<dynamic>(
        '/v1/services',
        queryParameters: {
          if (categoryId != null) 'categoryId': categoryId,
        },
      );
      final raw = res.data;
      final list = raw is List
          ? raw
          : raw is Map<String, dynamic>
              ? (raw['data'] as List? ?? const [])
              : const [];
      return list
          .whereType<Map<String, dynamic>>()
          .map((j) => CatalogService(
                id: j['id']?.toString() ?? '',
                slug: j['slug']?.toString() ?? '',
                nameAr: (j['nameAr'] ?? j['name_ar'] ?? j['slug'] ?? '').toString(),
                nameEn: (j['nameEn'] ?? j['name_en'])?.toString(),
                categoryId: (j['categoryId'] ?? j['category_id'] ?? '').toString(),
              ))
          .where((s) => s.id.isNotEmpty)
          .toList();
    } on DioException catch (e) {
      throwFromDio(e);
    }
  }
}
