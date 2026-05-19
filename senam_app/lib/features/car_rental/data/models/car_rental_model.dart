import 'package:flutter/material.dart';
import '../../domain/entities/car_rental.dart';

/// نموذج بيانات سيارة التأجير — يضيف تحويل JSON.
class CarRentalModel extends CarRental {
  const CarRentalModel({
    required super.name,
    required super.year,
    required super.type,
    required super.seats,
    required super.transmission,
    required super.pricePerDay,
    required super.color,
  });

  factory CarRentalModel.fromJson(Map<String, dynamic> json) {
    return CarRentalModel(
      name: json['name'] as String? ?? '',
      year: json['year'] as int? ?? 0,
      type: json['type'] as String? ?? '',
      seats: json['seats'] as int? ?? 0,
      transmission: json['transmission'] as String? ?? '',
      pricePerDay: json['pricePerDay'] as int? ?? 0,
      color: Color(json['color'] as int? ?? 0xFFBDBDBD),
    );
  }

  Map<String, dynamic> toJson() => {
        'name': name,
        'year': year,
        'type': type,
        'seats': seats,
        'transmission': transmission,
        'pricePerDay': pricePerDay,
        'color': color.toARGB32(),
      };
}
