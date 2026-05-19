import 'package:get_it/get_it.dart';
import 'data/datasources/offers_local_datasource.dart';
import 'data/repositories/offers_repository_impl.dart';
import 'domain/repositories/offers_repository.dart';
import 'domain/usecases/get_offers.dart';
import 'presentation/cubit/offers_cubit.dart';

/// تسجيل اعتماديات ميزة العروض في حاوية الـ DI.
void initOffersDi(GetIt sl) {
  sl.registerLazySingleton<OffersDataSource>(() => OffersLocalDataSource());
  sl.registerLazySingleton<OffersRepository>(
      () => OffersRepositoryImpl(sl()));
  sl.registerLazySingleton(() => GetOffers(sl()));
  sl.registerFactory(() => OffersCubit(getOffers: sl()));
}
