import 'package:get_it/get_it.dart';
import 'presentation/cubit/home_cubit.dart';

/// تسجيل تبعيات ميزة الصفحة الرئيسية.
///
/// الميزة تعتمد على Use Cases من ميزتي `services` و`offers`،
/// لذا يجب استدعاء [initHomeDi] بعد تسجيل تلك الميزتين.
void initHomeDi(GetIt sl) {
  sl.registerFactory(
    () => HomeCubit(
      getCategories: sl(),
      getTrustedCompanies: sl(),
      getOffers: sl(),
      getActiveBanners: sl(),
    ),
  );
}
