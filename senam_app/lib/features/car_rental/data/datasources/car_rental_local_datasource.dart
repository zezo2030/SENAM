import 'package:flutter/material.dart';
import '../models/car_rental_model.dart';

/// مصدر بيانات تأجير السيارات — يُستبدل لاحقاً بمصدر بعيد.
abstract class CarRentalDataSource {
  Future<List<CarRentalModel>> getCars();
}

class CarRentalLocalDataSource implements CarRentalDataSource {
  @override
  Future<List<CarRentalModel>> getCars() async {
    await Future.delayed(const Duration(milliseconds: 400));
    return const [
      CarRentalModel(
        name: 'تويوتا كامري 2023',
        year: 2023,
        type: 'اقتصادية',
        seats: 5,
        transmission: 'أوتوماتيك',
        pricePerDay: 150,
        color: Color(0xFFBDBDBD),
      ),
      CarRentalModel(
        name: 'BMW 520 2023',
        year: 2023,
        type: 'فخم',
        seats: 5,
        transmission: 'أوتوماتيك',
        pricePerDay: 350,
        color: Color(0xFF1565C0),
      ),
      CarRentalModel(
        name: 'لاند كروزر 2023',
        year: 2023,
        type: 'SUV',
        seats: 7,
        transmission: 'أوتوماتيك',
        pricePerDay: 450,
        color: Color(0xFF424242),
      ),
      CarRentalModel(
        name: 'فورد موستنج 2023',
        year: 2023,
        type: 'رياضية',
        seats: 4,
        transmission: 'أوتوماتيك',
        pricePerDay: 400,
        color: Color(0xFFD32F2F),
      ),
    ];
  }
}
