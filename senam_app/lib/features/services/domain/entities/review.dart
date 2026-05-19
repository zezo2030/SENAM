import 'package:equatable/equatable.dart';

/// تقييم عميل لشركة.
class Review extends Equatable {
  final String authorName;
  final int stars;
  final String comment;

  const Review({
    required this.authorName,
    required this.stars,
    required this.comment,
  });

  @override
  List<Object?> get props => [authorName, stars, comment];
}
