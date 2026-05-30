import '../../../../core/config/media_url.dart';
import '../../domain/entities/review.dart';

/// نموذج التقييم في طبقة الـ Data.
class ReviewModel extends Review {
  const ReviewModel({
    required super.authorName,
    super.authorPhotoUrl,
    required super.stars,
    required super.comment,
  });

  factory ReviewModel.fromJson(Map<String, dynamic> json) {
    final starsValue = json['stars'] ?? json['ratingCompany'];
    final photo = (json['authorPhotoUrl'] ??
            json['authorPhoto'] ??
            json['customerPhotoUrl'] ??
            '')
        .toString();
    return ReviewModel(
      authorName:
          json['authorName'] as String? ?? json['customerName'] as String? ?? '',
      authorPhotoUrl: photo.isEmpty ? '' : resolveMediaUrl(photo),
      stars: starsValue is num ? starsValue.toInt() : 0,
      comment: json['comment'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
        'authorName': authorName,
        'authorPhotoUrl': authorPhotoUrl,
        'stars': stars,
        'comment': comment,
      };
}
