import '../../domain/entities/banner.dart';

/// نموذج بيانات البانر في طبقة الـ Data — يضيف تحويل JSON.
class BannerModel extends Banner {
  const BannerModel({
    required super.id,
    required super.titleAr,
    super.titleEn,
    super.subtitleAr,
    super.subtitleEn,
    required super.imageUrl,
    super.linkUrl,
    super.targetType,
    super.targetId,
  });

  factory BannerModel.fromJson(Map<String, dynamic> json) {
    String? str(dynamic v) {
      if (v == null) return null;
      final s = v.toString();
      return s.isEmpty ? null : s;
    }

    return BannerModel(
      id: (json['id'] ?? '').toString(),
      titleAr: (json['titleAr'] ?? json['title_ar'] ?? '').toString(),
      titleEn: str(json['titleEn'] ?? json['title_en']),
      subtitleAr: str(json['subtitleAr'] ?? json['subtitle_ar']),
      subtitleEn: str(json['subtitleEn'] ?? json['subtitle_en']),
      imageUrl: (json['imageUrl'] ?? json['image_url'] ?? '').toString(),
      linkUrl: str(json['linkUrl'] ?? json['link_url']),
      targetType: str(json['targetType'] ?? json['target_type']),
      targetId: str(json['targetId'] ?? json['target_id']),
    );
  }
}
