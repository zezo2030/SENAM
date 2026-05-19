import 'package:get_it/get_it.dart';
import 'data/datasources/auth_local_datasource.dart';
import 'data/repositories/auth_repository_impl.dart';
import 'domain/repositories/auth_repository.dart';
import 'domain/usecases/login.dart';
import 'presentation/cubit/auth_cubit.dart';

/// تسجيل تبعيات ميزة المصادقة.
void initAuthDi(GetIt sl) {
  // Data sources
  sl.registerLazySingleton<AuthDataSource>(() => AuthLocalDataSource());

  // Repository
  sl.registerLazySingleton<AuthRepository>(
      () => AuthRepositoryImpl(sl()));

  // Use cases
  sl.registerLazySingleton(() => Login(sl()));

  // Cubit
  sl.registerFactory(() => AuthCubit(loginUseCase: sl()));
}
