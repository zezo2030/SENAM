import 'package:flutter/material.dart';
import 'package:equatable/equatable.dart';

/// كيان سيارة التأجير في طبقة الـ Domain.
class CarRental extends Equatable {
  final String name, type, transmission;
  final int year, seats, pricePerDay;
  final Color color;

  const CarRental({
    required this.name,
    required this.year,
    required this.type,
    required this.seats,
    required this.transmission,
    required this.pricePerDay,
    required this.color,
  });

  @override
  List<Object?> get props => [name, year];
}
