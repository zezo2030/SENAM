part of 'car_rental_cubit.dart';

enum CarRentalStatus { initial, loading, success, failure }

class CarRentalState extends Equatable {
  final CarRentalStatus status;
  final List<CarRental> cars;
  final int filterIndex;
  final String? errorMessage;

  const CarRentalState({
    this.status = CarRentalStatus.initial,
    this.cars = const [],
    this.filterIndex = 0,
    this.errorMessage,
  });

  /// تسميات الفلتر — الفهرس 0 يعني عرض الكل.
  static const filterTypes = ['جميع السيارات', 'اقتصادية', 'فخم', 'SUV', 'رياضية'];

  /// قائمة السيارات بعد تطبيق الفلتر الحالي.
  List<CarRental> get filteredCars {
    if (filterIndex == 0) return cars;
    return cars.where((c) => c.type == filterTypes[filterIndex]).toList();
  }

  CarRentalState copyWith({
    CarRentalStatus? status,
    List<CarRental>? cars,
    int? filterIndex,
    String? errorMessage,
  }) {
    return CarRentalState(
      status: status ?? this.status,
      cars: cars ?? this.cars,
      filterIndex: filterIndex ?? this.filterIndex,
      errorMessage: errorMessage,
    );
  }

  @override
  List<Object?> get props => [status, cars, filterIndex, errorMessage];
}
