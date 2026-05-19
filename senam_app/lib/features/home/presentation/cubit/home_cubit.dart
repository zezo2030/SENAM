import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/usecases/usecase.dart';
import '../../../offers/domain/entities/offer.dart';
import '../../../offers/domain/usecases/get_offers.dart';
import '../../../services/domain/entities/company.dart';
import '../../../services/domain/entities/service_category.dart';
import '../../../services/domain/usecases/get_categories.dart';
import '../../../services/domain/usecases/get_favorite_companies.dart';

part 'home_state.dart';

/// Cubit الصفحة الرئيسية — يجمّع بيانات من ميزات متعددة (services + offers).
class HomeCubit extends Cubit<HomeState> {
  final GetCategories getCategories;
  final GetFavoriteCompanies getTrustedCompanies;
  final GetOffers getOffers;

  HomeCubit({
    required this.getCategories,
    required this.getTrustedCompanies,
    required this.getOffers,
  }) : super(const HomeState());

  Future<void> load() async {
    emit(state.copyWith(status: HomeStatus.loading));

    final categoriesResult = await getCategories(const NoParams());
    final companiesResult = await getTrustedCompanies(const NoParams());
    final offersResult = await getOffers(const NoParams());

    String? error;
    categoriesResult.fold((f) => error = f.message, (_) {});
    companiesResult.fold((f) => error = f.message, (_) {});
    offersResult.fold((f) => error = f.message, (_) {});

    if (error != null) {
      emit(state.copyWith(
          status: HomeStatus.failure, errorMessage: error));
      return;
    }

    emit(state.copyWith(
      status: HomeStatus.success,
      categories: categoriesResult.getOrElse(() => const []),
      trustedCompanies: companiesResult.getOrElse(() => const []),
      offers: offersResult.getOrElse(() => const []),
    ));
  }
}
