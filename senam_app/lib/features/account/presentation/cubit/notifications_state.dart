part of 'notifications_cubit.dart';

enum NotificationsStatus { initial, loading, success, failure }

class NotificationsState extends Equatable {
  final NotificationsStatus status;
  final List<AppNotification> notifications;
  final String? errorMessage;

  const NotificationsState({
    this.status = NotificationsStatus.initial,
    this.notifications = const [],
    this.errorMessage,
  });

  NotificationsState copyWith({
    NotificationsStatus? status,
    List<AppNotification>? notifications,
    String? errorMessage,
  }) {
    return NotificationsState(
      status: status ?? this.status,
      notifications: notifications ?? this.notifications,
      errorMessage: errorMessage,
    );
  }

  @override
  List<Object?> get props => [status, notifications, errorMessage];
}
