part of 'offers_cubit.dart';

enum OffersStatus { initial, loading, success, failure }

class OffersState extends Equatable {
  final OffersStatus status;
  final List<Offer> offers;
  final String? errorMessage;

  const OffersState({
    this.status = OffersStatus.initial,
    this.offers = const [],
    this.errorMessage,
  });

  OffersState copyWith({
    OffersStatus? status,
    List<Offer>? offers,
    String? errorMessage,
  }) {
    return OffersState(
      status: status ?? this.status,
      offers: offers ?? this.offers,
      errorMessage: errorMessage,
    );
  }

  @override
  List<Object?> get props => [status, offers, errorMessage];
}
