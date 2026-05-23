import 'package:get_it/get_it.dart';
import 'data/datasources/auth_local_datasource.dart';
import 'data/datasources/auth_remote_datasource.dart';
import 'data/repositories/auth_repository_impl.dart';
import 'domain/repositories/auth_repository.dart';
import 'domain/usecases/login_with_password.dart';
import 'domain/usecases/register_account.dart';
import 'domain/usecases/update_profile.dart';
import 'presentation/cubit/auth_cubit.dart';

/// تسجيل تبعيات ميزة المصادقة (Email + Password customer flow).
void initAuthDi(GetIt sl) {
  sl.registerLazySingleton<AuthDataSource>(
    () => AuthRemoteDataSource(sl(), sl()),
  );

  sl.registerLazySingleton<AuthRepository>(() => AuthRepositoryImpl(sl()));

  sl.registerLazySingleton(() => LoginWithPassword(sl()));
  sl.registerLazySingleton(() => RegisterAccount(sl()));
  sl.registerLazySingleton(() => UpdateProfile(sl()));

  sl.registerFactory(
    () => AuthCubit(
      loginUseCase: sl(),
      registerUseCase: sl(),
      updateProfileUseCase: sl(),
    ),
  );
}
