import 'package:get_it/get_it.dart';

import 'data/datasources/application_local_storage.dart';
import 'data/datasources/provider_application_remote_datasource.dart';
import 'data/repositories/provider_application_repository_impl.dart';
import 'domain/repositories/provider_application_repository.dart';
import 'domain/usecases/get_application_status.dart';
import 'domain/usecases/submit_application.dart';
import 'domain/usecases/upload_document.dart';
import 'presentation/cubit/provider_application_cubit.dart';

/// تسجيل تبعيات ميزة تقديم طلب الشركات.
void initProviderApplicationDi(GetIt sl) {
  sl.registerLazySingleton(() => ApplicationLocalStorage());

  sl.registerLazySingleton<ProviderApplicationDataSource>(
    () => ProviderApplicationRemoteDataSource(sl()),
  );

  sl.registerLazySingleton<ProviderApplicationRepository>(
    () => ProviderApplicationRepositoryImpl(sl()),
  );

  sl.registerLazySingleton(() => UploadDocument(sl()));
  sl.registerLazySingleton(() => SubmitApplication(sl()));
  sl.registerLazySingleton(() => GetApplicationStatus(sl()));

  sl.registerFactory(
    () => ProviderApplicationCubit(
      uploadDocumentUseCase: sl(),
      submitApplicationUseCase: sl(),
      getStatusUseCase: sl(),
      localStorage: sl(),
      repository: sl(),
    ),
  );
}
