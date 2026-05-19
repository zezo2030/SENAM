import 'package:get_it/get_it.dart';
import 'data/datasources/account_local_datasource.dart';
import 'data/repositories/account_repository_impl.dart';
import 'domain/repositories/account_repository.dart';
import 'domain/usecases/get_notifications.dart';
import 'domain/usecases/get_profile.dart';
import 'presentation/cubit/account_cubit.dart';
import 'presentation/cubit/notifications_cubit.dart';

/// تسجيل اعتماديات ميزة الحساب في حاوية الـ DI.
void initAccountDi(GetIt sl) {
  sl.registerLazySingleton<AccountDataSource>(
      () => AccountLocalDataSource());
  sl.registerLazySingleton<AccountRepository>(
      () => AccountRepositoryImpl(sl()));
  sl.registerLazySingleton(() => GetProfile(sl()));
  sl.registerLazySingleton(() => GetNotifications(sl()));
  sl.registerFactory(() => AccountCubit(getProfile: sl()));
  sl.registerFactory(() => NotificationsCubit(getNotifications: sl()));
}
