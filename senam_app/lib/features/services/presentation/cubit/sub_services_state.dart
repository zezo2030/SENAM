part of 'sub_services_cubit.dart';

enum SubServicesStatus { initial, loading, success, failure }

class SubServicesState extends Equatable {
  final SubServicesStatus status;
  final List<SubService> items;
  final Map<String, int> counts;
  final String? errorMessage;

  const SubServicesState({
    this.status = SubServicesStatus.initial,
    this.items = const [],
    this.counts = const {},
    this.errorMessage,
  });

  SubServicesState copyWith({
    SubServicesStatus? status,
    List<SubService>? items,
    Map<String, int>? counts,
    String? errorMessage,
  }) {
    return SubServicesState(
      status: status ?? this.status,
      items: items ?? this.items,
      counts: counts ?? this.counts,
      errorMessage: errorMessage,
    );
  }

  @override
  List<Object?> get props => [status, items, counts, errorMessage];
}
