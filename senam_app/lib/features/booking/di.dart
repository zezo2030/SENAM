import 'package:get_it/get_it.dart';
import 'data/datasources/booking_local_datasource.dart';
import 'data/repositories/booking_repository_impl.dart';
import 'domain/repositories/booking_repository.dart';
import 'domain/usecases/create_booking.dart';
import 'presentation/cubit/booking_cubit.dart';

/// تسجيل تبعيات ميزة الحجز في حاوية الـ DI.
void initBookingDi(GetIt sl) {
  // Data sources
  sl.registerLazySingleton<BookingDataSource>(() => BookingLocalDataSource());

  // Repositories
  sl.registerLazySingleton<BookingRepository>(
      () => BookingRepositoryImpl(sl()));

  // Use cases
  sl.registerLazySingleton(() => CreateBooking(sl()));

  // Cubits
  sl.registerFactory(() => BookingCubit(createBookingUseCase: sl()));
}
