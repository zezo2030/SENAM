import 'package:equatable/equatable.dart';

/// خدمة تقدمها الشركة (الاسم، السعر، المدة).
class CompanyService extends Equatable {
  final String name;
  final int price;
  final String duration;

  const CompanyService({
    required this.name,
    required this.price,
    required this.duration,
  });

  @override
  List<Object?> get props => [name, price, duration];
}
