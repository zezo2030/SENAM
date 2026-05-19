import 'package:get_it/get_it.dart';
import 'data/datasources/car_rental_local_datasource.dart';
import 'data/repositories/car_rental_repository_impl.dart';
import 'domain/repositories/car_rental_repository.dart';
import 'domain/usecases/get_cars.dart';
import 'presentation/cubit/car_rental_cubit.dart';

/// تسجيل اعتماديات ميزة تأجير السيارات في حاوية الـ DI.
void initCarRentalDi(GetIt sl) {
  sl.registerLazySingleton<CarRentalDataSource>(
      () => CarRentalLocalDataSource());
  sl.registerLazySingleton<CarRentalRepository>(
      () => CarRentalRepositoryImpl(sl()));
  sl.registerLazySingleton(() => GetCars(sl()));
  sl.registerFactory(() => CarRentalCubit(getCars: sl()));
}
