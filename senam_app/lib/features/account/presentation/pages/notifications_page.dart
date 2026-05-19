import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/di/injection_container.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/app_widgets.dart';
import '../../domain/entities/app_notification.dart';
import '../cubit/notifications_cubit.dart';

class NotificationsPage extends StatelessWidget {
  const NotificationsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => sl<NotificationsCubit>()..load(),
      child: const _NotificationsView(),
    );
  }
}

class _NotificationsView extends StatelessWidget {
  const _NotificationsView();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('الإشعارات')),
      body: BlocBuilder<NotificationsCubit, NotificationsState>(
        builder: (context, state) {
          if (state.status == NotificationsStatus.loading ||
              state.status == NotificationsStatus.initial) {
            return const LoadingView();
          }
          if (state.status == NotificationsStatus.failure) {
            return ErrorView(
              message: state.errorMessage ?? 'حدث خطأ',
              onRetry: () => context.read<NotificationsCubit>().load(),
            );
          }
          if (state.notifications.isEmpty) {
            return const EmptyView(message: 'لا توجد إشعارات');
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: state.notifications.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (_, i) =>
                _NotificationCard(notification: state.notifications[i]),
          );
        },
      ),
    );
  }
}

class _NotificationCard extends StatelessWidget {
  final AppNotification notification;
  const _NotificationCard({required this.notification});

  @override
  Widget build(BuildContext context) {
    final n = notification;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: n.isUnread
            ? AppColors.gold.withValues(alpha: 0.06)
            : AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
            color: n.isUnread
                ? AppColors.gold.withValues(alpha: 0.3)
                : AppColors.border),
      ),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: AppColors.gold.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(n.icon, color: AppColors.gold, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(n.title,
                          style: const TextStyle(
                              fontWeight: FontWeight.w800,
                              fontSize: 14,
                              color: AppColors.textPrimary)),
                    ),
                    Text(n.time,
                        style: const TextStyle(
                            fontSize: 10,
                            color: AppColors.textMuted)),
                  ],
                ),
                const SizedBox(height: 3),
                Text(n.body,
                    style: const TextStyle(
                        fontSize: 12,
                        height: 1.5,
                        color: AppColors.textSecondary)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
