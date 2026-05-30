import 'package:get_it/get_it.dart';

import '../auth/token_storage.dart';
import '../network/api_client.dart';
import '../../features/account/di.dart';
import '../../features/auth/di.dart';
import '../../features/banners/di.dart';
import '../../features/car_rental/di.dart';
import '../../features/favorites/di.dart';
import '../../features/home/di.dart';
import '../../features/offers/di.dart';
import '../../features/provider_application/di.dart';
import '../../features/services/di.dart';

/// حاوية حقن التبعيات (Dependency Injection) لتطبيق SENAM.
final GetIt sl = GetIt.instance;

Future<void> initDependencies() async {
  // البنية التحتية للشبكة + التخزين الآمن
  sl.registerLazySingleton<TokenStorage>(() => TokenStorage());
  sl.registerLazySingleton<ApiClient>(() => ApiClient(tokenStorage: sl()));

  // الميزات المشتركة (يجب تسجيلها أولاً)
  initServicesDi(sl);
  initOffersDi(sl);
  initBannersDi(sl);

  // بقية الميزات
  initAuthDi(sl);
  initHomeDi(sl);
  initFavoritesDi(sl);
  initCarRentalDi(sl);
  initAccountDi(sl);
  initProviderApplicationDi(sl);
}
