import '../models/offer_model.dart';

/// مصدر بيانات العروض — يُستبدل لاحقاً بمصدر بعيد يتصل بالـ API.
abstract class OffersDataSource {
  Future<List<OfferModel>> getOffers();
}

class OffersLocalDataSource implements OffersDataSource {
  @override
  Future<List<OfferModel>> getOffers() async {
    await Future.delayed(const Duration(milliseconds: 400));
    return const [
      OfferModel(
        title: 'عرض خاص لأول طلب',
        subtitle: 'خصم 20% على جميع الخدمات',
        code: 'SENAM20',
        discount: '20%',
      ),
      OfferModel(
        title: 'عرض الإطلاق',
        subtitle: 'خصم 30% على أول طلب لك',
        code: 'SENAM30',
        discount: '30%',
      ),
      OfferModel(
        title: 'عرض نهاية الأسبوع',
        subtitle: 'خصم 15% على غسيل السيارات',
        code: 'WEEKEND15',
        discount: '15%',
      ),
    ];
  }
}
