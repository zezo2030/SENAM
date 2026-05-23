import 'package:dio/dio.dart';

import '../../../../core/network/api_client.dart';
import '../../../../core/network/error_mapper.dart';
import '../models/banner_model.dart';

abstract class BannersDataSource {
  Future<List<BannerModel>> getActiveBanners();
}

class BannersRemoteDataSource implements BannersDataSource {
  final ApiClient apiClient;
  BannersRemoteDataSource(this.apiClient);

  Dio get _dio => apiClient.dio;

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
    return const [];
  }

  @override
  Future<List<BannerModel>> getActiveBanners() async {
    try {
      final res = await _dio.get('/v1/banners');
      return _listFrom(res.data).map(BannerModel.fromJson).toList();
    } on DioException catch (e) {
      throwFromDio(e);
    }
  }
}
