import 'package:equatable/equatable.dart';

/// كيان البانر الترويجي على الصفحة الرئيسية.
class Banner extends Equatable {
  final String id;
  final String titleAr;
  final String? titleEn;
  final String? subtitleAr;
  final String? subtitleEn;
  final String imageUrl;
  final String? linkUrl;
  final String? targetType;
  final String? targetId;

  const Banner({
    required this.id,
    required this.titleAr,
    this.titleEn,
    this.subtitleAr,
    this.subtitleEn,
    required this.imageUrl,
    this.linkUrl,
    this.targetType,
    this.targetId,
  });

  @override
  List<Object?> get props => [id];
}
