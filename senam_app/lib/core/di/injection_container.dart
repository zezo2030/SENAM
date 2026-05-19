import 'package:get_it/get_it.dart';

import '../../features/account/di.dart';
import '../../features/auth/di.dart';
import '../../features/booking/di.dart';
import '../../features/car_rental/di.dart';
import '../../features/favorites/di.dart';
import '../../features/home/di.dart';
import '../../features/offers/di.dart';
import '../../features/orders/di.dart';
import '../../features/services/di.dart';

/// حاوية حقن التبعيات (Dependency Injection) لتطبيق SENAM.
///
/// تُسجَّل كل التبعيات هنا ويُحصَل عليها عبر `sl<T>()`.
final GetIt sl = GetIt.instance;

/// تهيئة كل تبعيات التطبيق — تُستدعى مرة واحدة في `main()`.
///
/// تُسجَّل ميزتا `services` و`offers` أولاً لأن ميزات أخرى
/// (`home`, `favorites`) تعتمد على Use Cases منهما.
Future<void> initDependencies() async {
  // الميزات المشتركة (يجب تسجيلها أولاً)
  initServicesDi(sl);
  initOffersDi(sl);

  // بقية الميزات
  initAuthDi(sl);
  initHomeDi(sl);
  initBookingDi(sl);
  initOrdersDi(sl);
  initFavoritesDi(sl);
  initCarRentalDi(sl);
  initAccountDi(sl);
}
