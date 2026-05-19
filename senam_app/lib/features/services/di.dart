import 'package:get_it/get_it.dart';
import 'data/datasources/services_local_datasource.dart';
import 'data/repositories/services_repository_impl.dart';
import 'domain/repositories/services_repository.dart';
import 'domain/usecases/get_categories.dart';
import 'domain/usecases/get_companies.dart';
import 'domain/usecases/get_companies_by_category.dart';
import 'domain/usecases/get_company_reviews.dart';
import 'domain/usecases/get_favorite_companies.dart';
import 'presentation/cubit/companies_cubit.dart';
import 'presentation/cubit/company_details_cubit.dart';

/// تسجيل اعتماديات ميزة الخدمات في حاوية الـ DI.
void initServicesDi(GetIt sl) {
  // datasource
  sl.registerLazySingleton<ServicesDataSource>(
      () => ServicesLocalDataSource());

  // repository
  sl.registerLazySingleton<ServicesRepository>(
      () => ServicesRepositoryImpl(sl()));

  // usecases
  sl.registerLazySingleton(() => GetCategories(sl()));
  sl.registerLazySingleton(() => GetCompanies(sl()));
  sl.registerLazySingleton(() => GetCompaniesByCategory(sl()));
  sl.registerLazySingleton(() => GetCompanyReviews(sl()));
  sl.registerLazySingleton(() => GetFavoriteCompanies(sl()));

  // cubits
  sl.registerFactory(() => CompaniesCubit(
        getCompaniesByCategory: sl(),
        getCompanies: sl(),
      ));
  sl.registerFactory(() => CompanyDetailsCubit(getCompanyReviews: sl()));
}
