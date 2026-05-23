import 'package:get_it/get_it.dart';
import 'data/datasources/orders_local_datasource.dart';
import 'data/datasources/orders_remote_datasource.dart';
import 'data/repositories/orders_repository_impl.dart';
import 'domain/repositories/orders_repository.dart';
import 'domain/usecases/cancel_order.dart';
import 'domain/usecases/get_orders.dart';
import 'domain/usecases/submit_review.dart';
import 'presentation/cubit/order_tracking_cubit.dart';
import 'presentation/cubit/orders_cubit.dart';
import 'presentation/cubit/rating_cubit.dart';

/// تسجيل تبعيات ميزة الطلبات في حاوية الـ DI.
void initOrdersDi(GetIt sl) {
  // Data sources — remote بدلاً من المحلي
  sl.registerLazySingleton<OrdersDataSource>(() => OrdersRemoteDataSource(sl()));

  // Repositories
  sl.registerLazySingleton<OrdersRepository>(
      () => OrdersRepositoryImpl(sl()));

  // Use cases
  sl.registerLazySingleton(() => GetOrders(sl()));
  sl.registerLazySingleton(() => CancelOrder(sl()));
  sl.registerLazySingleton(() => SubmitReview(sl()));

  // Cubits
  sl.registerFactory(() => OrdersCubit(getOrders: sl()));
  sl.registerFactory(() => OrderTrackingCubit(cancelOrder: sl()));
  sl.registerFactory(() => RatingCubit(submitReview: sl()));
}
