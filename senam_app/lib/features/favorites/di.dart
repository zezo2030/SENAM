import 'package:get_it/get_it.dart';
import 'presentation/cubit/favorites_cubit.dart';

/// تسجيل تبعيات ميزة المفضلة.
///
/// تعتمد على Use Case من ميزة `services` — تُستدعى بعدها.
void initFavoritesDi(GetIt sl) {
  sl.registerFactory(
    () => FavoritesCubit(
      getFavoriteCompanies: sl(),
      tokenStorage: sl(),
    ),
  );
}
