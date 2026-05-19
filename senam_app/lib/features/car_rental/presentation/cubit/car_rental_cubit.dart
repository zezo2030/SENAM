import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/usecases/usecase.dart';
import '../../domain/entities/car_rental.dart';
import '../../domain/usecases/get_cars.dart';

part 'car_rental_state.dart';

/// Cubit لإدارة حالة شاشة تأجير السيارات.
class CarRentalCubit extends Cubit<CarRentalState> {
  final GetCars getCars;

  CarRentalCubit({required this.getCars}) : super(const CarRentalState());

  Future<void> load() async {
    emit(state.copyWith(status: CarRentalStatus.loading));
    final result = await getCars(const NoParams());
    result.fold(
      (failure) => emit(state.copyWith(
        status: CarRentalStatus.failure,
        errorMessage: failure.message,
      )),
      (cars) => emit(state.copyWith(
        status: CarRentalStatus.success,
        cars: cars,
      )),
    );
  }

  void setFilter(int index) => emit(state.copyWith(filterIndex: index));
}
