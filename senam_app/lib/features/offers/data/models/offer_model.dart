import '../../domain/entities/offer.dart';

/// نموذج بيانات العرض في طبقة الـ Data — يضيف تحويل JSON.
class OfferModel extends Offer {
  const OfferModel({
    required super.title,
    required super.subtitle,
    required super.code,
    required super.discount,
  });

  factory OfferModel.fromJson(Map<String, dynamic> json) {
    return OfferModel(
      title: json['title'] as String? ?? '',
      subtitle: json['subtitle'] as String? ?? '',
      code: json['code'] as String? ?? '',
      discount: json['discount'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
        'title': title,
        'subtitle': subtitle,
        'code': code,
        'discount': discount,
      };
}
