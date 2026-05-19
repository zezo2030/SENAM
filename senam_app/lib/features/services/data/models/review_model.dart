import '../../domain/entities/review.dart';

/// نموذج التقييم في طبقة الـ Data.
class ReviewModel extends Review {
  const ReviewModel({
    required super.authorName,
    required super.stars,
    required super.comment,
  });

  factory ReviewModel.fromJson(Map<String, dynamic> json) {
    return ReviewModel(
      authorName: json['authorName'] as String? ?? '',
      stars: json['stars'] as int? ?? 0,
      comment: json['comment'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
        'authorName': authorName,
        'stars': stars,
        'comment': comment,
      };
}
