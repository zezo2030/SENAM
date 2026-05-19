import 'package:equatable/equatable.dart';

/// كيان العرض/الكوبون في طبقة الـ Domain.
class Offer extends Equatable {
  final String title, subtitle, code, discount;

  const Offer({
    required this.title,
    required this.subtitle,
    required this.code,
    required this.discount,
  });

  @override
  List<Object?> get props => [code];
}
