import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/usecases/usecase.dart';
import '../../domain/entities/app_notification.dart';
import '../../domain/usecases/get_notifications.dart';

part 'notifications_state.dart';

/// Cubit لإدارة حالة شاشة الإشعارات.
class NotificationsCubit extends Cubit<NotificationsState> {
  final GetNotifications getNotifications;

  NotificationsCubit({required this.getNotifications})
      : super(const NotificationsState());

  Future<void> load() async {
    emit(state.copyWith(status: NotificationsStatus.loading));
    final result = await getNotifications(const NoParams());
    result.fold(
      (failure) => emit(state.copyWith(
        status: NotificationsStatus.failure,
        errorMessage: failure.message,
      )),
      (notifications) => emit(state.copyWith(
        status: NotificationsStatus.success,
        notifications: notifications,
      )),
    );
  }
}
