import 'package:get_it/get_it.dart';
import 'data/datasources/services_local_datasource.dart';
import 'data/datasources/services_remote_datasource.dart';
import 'data/repositories/services_repository_impl.dart';
import 'domain/repositories/services_repository.dart';
import 'domain/usecases/get_categories.dart';
import 'domain/usecases/get_companies.dart';
import 'domain/usecases/get_companies_by_category.dart';
import 'domain/usecases/get_companies_by_sub_service.dart';
import 'domain/usecases/get_company_detail.dart';
import 'domain/usecases/get_company_reviews.dart';
import 'domain/usecases/get_favorite_companies.dart';
import 'domain/usecases/get_sub_services.dart';
import 'domain/usecases/submit_company_review.dart';
import 'presentation/cubit/companies_cubit.dart';
import 'presentation/cubit/company_details_cubit.dart';
import 'presentation/cubit/sub_services_cubit.dart';

/// تسجيل اعتماديات ميزة الخدمات في حاوية الـ DI.
void initServicesDi(GetIt sl) {
  // datasource — remote بدلاً من المحلي
  sl.registerLazySingleton<ServicesDataSource>(
      () => ServicesRemoteDataSource(sl()));

  // repository
  sl.registerLazySingleton<ServicesRepository>(
      () => ServicesRepositoryImpl(sl()));

  // usecases
  sl.registerLazySingleton(() => GetCategories(sl()));
  sl.registerLazySingleton(() => GetCompanies(sl()));
  sl.registerLazySingleton(() => GetCompanyDetail(sl()));
  sl.registerLazySingleton(() => GetCompaniesByCategory(sl()));
  sl.registerLazySingleton(() => GetCompaniesBySubService(sl()));
  sl.registerLazySingleton(() => GetSubServices(sl()));
  sl.registerLazySingleton(() => GetCompanyReviews(sl()));
  sl.registerLazySingleton(() => SubmitCompanyReview(sl()));
  sl.registerLazySingleton(() => GetFavoriteCompanies(sl()));

  // cubits
  sl.registerFactory(() => CompaniesCubit(
        getCompaniesByCategory: sl(),
        getCompaniesBySubService: sl(),
        getCompanies: sl(),
      ));
  sl.registerFactory(() => SubServicesCubit(
        getSubServices: sl(),
        getCompanies: sl(),
      ));
  sl.registerFactory(() => CompanyDetailsCubit(
        getCompanyReviews: sl(),
        submitCompanyReview: sl(),
      ));
}
