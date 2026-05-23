import 'package:dio/dio.dart';

import '../../../../core/error/exceptions.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/error_mapper.dart';
import '../models/booking_model.dart';
import 'booking_local_datasource.dart';

/// Posts to `POST /v1/bookings`. NOTE: the existing `BookingModel` carries
/// display-only fields (`companyName`, `serviceName`, `date`, `time`) instead
/// of the UUIDs (`companyServiceId`, `slotId`, `addressId`) the backend
/// requires. Until the booking UI captures those IDs the backend call will
/// 400 — that's expected and surfaces the gap rather than hiding it.
class BookingRemoteDataSource implements BookingDataSource {
  final ApiClient apiClient;

  BookingRemoteDataSource(this.apiClient);

  Dio get _dio => apiClient.dio;

  String _mapPaymentMethod(String raw) {
    final v = raw.toLowerCase();
    if (v.contains('apple')) return 'applepay';
    if (v.contains('google')) return 'googlepay';
    if (v.contains('cash') || v.contains('cod')) return 'cod';
    return 'card';
  }

  @override
  Future<String> createBooking(BookingModel booking) async {
    try {
      final res = await _dio.post<Map<String, dynamic>>(
        '/v1/bookings',
        data: {
          'companyId': booking.companyId,
          'services': [
            {
              'companyServiceId': booking.serviceName, // FIXME: needs UUID from UI
              'quantity': 1,
            },
          ],
          'slotId': '${booking.date} ${booking.time}', // FIXME: needs slot UUID from UI
          'addressId': booking.address, // FIXME: needs address UUID from UI
          'paymentMethod': _mapPaymentMethod(booking.paymentMethod),
          if (booking.notes.isNotEmpty) 'notes': booking.notes,
        },
      );
      final id = res.data?['id']?.toString();
      if (id == null || id.isEmpty) {
        throw const ServerException('استجابة إنشاء الحجز غير صالحة');
      }
      return id;
    } on DioException catch (e) {
      throwFromDio(e);
    }
  }
}
