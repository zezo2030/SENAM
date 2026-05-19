import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/usecases/usecase.dart';
import '../../domain/entities/offer.dart';
import '../../domain/usecases/get_offers.dart';

part 'offers_state.dart';

/// Cubit لإدارة حالة شاشة العروض.
class OffersCubit extends Cubit<OffersState> {
  final GetOffers getOffers;

  OffersCubit({required this.getOffers}) : super(const OffersState());

  Future<void> load() async {
    emit(state.copyWith(status: OffersStatus.loading));
    final result = await getOffers(const NoParams());
    result.fold(
      (failure) => emit(state.copyWith(
        status: OffersStatus.failure,
        errorMessage: failure.message,
      )),
      (offers) => emit(state.copyWith(
        status: OffersStatus.success,
        offers: offers,
      )),
    );
  }
}
