import 'package:get_it/get_it.dart';
import 'data/datasources/banners_remote_datasource.dart';
import 'data/repositories/banners_repository_impl.dart';
import 'domain/repositories/banners_repository.dart';
import 'domain/usecases/get_active_banners.dart';

/// تسجيل اعتماديات ميزة البانرات.
void initBannersDi(GetIt sl) {
  sl.registerLazySingleton<BannersDataSource>(
      () => BannersRemoteDataSource(sl()));
  sl.registerLazySingleton<BannersRepository>(
      () => BannersRepositoryImpl(sl()));
  sl.registerLazySingleton(() => GetActiveBanners(sl()));
}
