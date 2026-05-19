import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/di/injection_container.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/app_widgets.dart';
import '../../domain/entities/order.dart';
import '../cubit/order_tracking_cubit.dart';
import 'rating_page.dart';

class OrderTrackingPage extends StatelessWidget {
  final OrderEntity order;
  const OrderTrackingPage({super.key, required this.order});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) =>
          sl<OrderTrackingCubit>()..initStep(order.trackingStep),
      child: _TrackingView(order: order),
    );
  }
}

class _TrackingView extends StatelessWidget {
  final OrderEntity order;
  const _TrackingView({required this.order});

  static const _steps = [
    'تم تأكيد الطلب',
    'جاري التنفيذ',
    'الفني في الطريق إليك',
    'وصل الفني',
    'جاري تنفيذ الخدمة',
    'تم الإنجاز',
  ];

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<OrderTrackingCubit, OrderTrackingState>(
      listener: (context, state) {
        if (state.status == OrderTrackingStatus.cancelled) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('تم إلغاء الطلب'),
              backgroundColor: AppColors.error,
            ),
          );
          Navigator.pop(context);
        } else if (state.status == OrderTrackingStatus.failure) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(state.errorMessage ?? 'تعذّر إلغاء الطلب'),
              backgroundColor: AppColors.error,
            ),
          );
        }
      },
      builder: (context, state) {
        final current = state.currentStep;
        final done = current >= _steps.length - 1;
        return Scaffold(
          appBar: AppBar(title: const Text('تتبع الطلب')),
          body: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              _statusBanner(current),
              const SizedBox(height: 18),
              _stepper(current),
              const SizedBox(height: 18),
              _technicianCard(),
              const SizedBox(height: 14),
              _mapCard(),
              const SizedBox(height: 14),
              _orderInfo(),
              const SizedBox(height: 14),
              if (!done)
                OutlinedButton(
                  onPressed: () =>
                      context.read<OrderTrackingCubit>().advanceStep(),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: AppColors.border),
                    minimumSize: const Size.fromHeight(48),
                  ),
                  child: const Text('تحديث الحالة (محاكاة)',
                      style: TextStyle(color: AppColors.textSecondary)),
                ),
            ],
          ),
          bottomNavigationBar: _bottomBar(context, done, state),
        );
      },
    );
  }

  Widget _statusBanner(int current) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(18),
        gradient: const LinearGradient(
          colors: [Color(0xFF2A2418), Color(0xFF161410)],
        ),
        border: Border.all(color: AppColors.gold.withValues(alpha: 0.4)),
      ),
      child: Column(
        children: [
          Text(_steps[current],
              style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w900,
                  color: AppColors.gold)),
          const SizedBox(height: 6),
          Text(
            current >= _steps.length - 1
                ? 'تم إنجاز الخدمة بنجاح'
                : 'الوقت المقدر للوصول: 15 دقيقة',
            style: const TextStyle(
                fontSize: 13, color: AppColors.textSecondary),
          ),
        ],
      ),
    );
  }

  Widget _stepper(int current) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: List.generate(_steps.length, (i) {
          final stepDone = i <= current;
          final isLast = i == _steps.length - 1;
          return IntrinsicHeight(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Column(
                  children: [
                    Container(
                      width: 26,
                      height: 26,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: stepDone
                            ? AppColors.gold
                            : AppColors.surfaceLight,
                        border: Border.all(
                            color: stepDone
                                ? AppColors.gold
                                : AppColors.border),
                      ),
                      child: Icon(
                        stepDone ? Icons.check : Icons.circle,
                        size: stepDone ? 15 : 8,
                        color: stepDone
                            ? const Color(0xFF1A1500)
                            : AppColors.textMuted,
                      ),
                    ),
                    if (!isLast)
                      Expanded(
                        child: Container(
                          width: 2,
                          color: i < current
                              ? AppColors.gold
                              : AppColors.border,
                        ),
                      ),
                  ],
                ),
                const SizedBox(width: 12),
                Padding(
                  padding: const EdgeInsets.only(bottom: 18, top: 3),
                  child: Text(
                    _steps[i],
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: i == current
                          ? FontWeight.w800
                          : FontWeight.w500,
                      color: stepDone
                          ? AppColors.textPrimary
                          : AppColors.textMuted,
                    ),
                  ),
                ),
              ],
            ),
          );
        }),
      ),
    );
  }

  Widget _technicianCard() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 26,
            backgroundColor: AppColors.gold.withValues(alpha: 0.2),
            child: const Icon(Icons.person,
                color: AppColors.gold, size: 28),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                Text('أحمد محمد',
                    style: TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 15,
                        color: AppColors.textPrimary)),
                SizedBox(height: 4),
                RatingBadge(rating: 4.9),
                SizedBox(height: 2),
                Text('الفني المسؤول',
                    style: TextStyle(
                        fontSize: 11, color: AppColors.textMuted)),
              ],
            ),
          ),
          _circleAction(Icons.chat_bubble_outline),
          const SizedBox(width: 8),
          _circleAction(Icons.phone),
        ],
      ),
    );
  }

  Widget _circleAction(IconData icon) {
    return Container(
      width: 44,
      height: 44,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: AppColors.gold.withValues(alpha: 0.15),
      ),
      child: Icon(icon, color: AppColors.gold, size: 20),
    );
  }

  Widget _mapCard() {
    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: Container(
        height: 160,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFF1C1F26), Color(0xFF0F0F11)],
          ),
        ),
        child: Stack(
          children: [
            const Center(
              child: Icon(Icons.route, color: AppColors.gold, size: 44),
            ),
            Positioned(
              bottom: 12,
              right: 12,
              child: Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: AppColors.background.withValues(alpha: 0.8),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Text('الفني على بُعد 1.2 كم',
                    style: TextStyle(
                        fontSize: 12, color: AppColors.textPrimary)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _orderInfo() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          Row(
            children: [
              CompanyLogo(
                  label: order.companyLogo,
                  color: order.companyColor,
                  size: 44),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(order.companyName,
                        style: const TextStyle(
                            fontWeight: FontWeight.w800,
                            color: AppColors.textPrimary)),
                    Text(order.serviceName,
                        style: const TextStyle(
                            fontSize: 12, color: AppColors.textMuted)),
                  ],
                ),
              ),
              Text('${order.total} ر.ق',
                  style: const TextStyle(
                      color: AppColors.gold,
                      fontWeight: FontWeight.w800,
                      fontSize: 15)),
            ],
          ),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 10),
            child: Divider(color: AppColors.border, height: 1),
          ),
          Row(
            children: [
              const Icon(Icons.calendar_today_outlined,
                  size: 15, color: AppColors.textMuted),
              const SizedBox(width: 6),
              Text(order.dateTime,
                  style: const TextStyle(
                      fontSize: 12, color: AppColors.textSecondary)),
              const Spacer(),
              Text(order.number,
                  style: const TextStyle(
                      fontSize: 12, color: AppColors.textMuted)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _bottomBar(
      BuildContext context, bool done, OrderTrackingState state) {
    final loading = state.status == OrderTrackingStatus.loading;
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
      decoration: const BoxDecoration(
        color: AppColors.surface,
        border: Border(top: BorderSide(color: AppColors.border)),
      ),
      child: SafeArea(
        top: false,
        child: done
            ? ElevatedButton(
                onPressed: () => Navigator.push(
                  context,
                  MaterialPageRoute(
                      builder: (_) => RatingPage(order: order)),
                ),
                child: const Text('قيّم الخدمة'),
              )
            : OutlinedButton(
                onPressed:
                    loading ? null : () => _showCancelSheet(context),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: AppColors.error),
                  minimumSize: const Size.fromHeight(52),
                ),
                child: loading
                    ? const SizedBox(
                        width: 22,
                        height: 22,
                        child: CircularProgressIndicator(
                            strokeWidth: 2.4, color: AppColors.error),
                      )
                    : const Text('إلغاء الطلب',
                        style: TextStyle(
                            color: AppColors.error,
                            fontWeight: FontWeight.w700)),
              ),
      ),
    );
  }

  void _showCancelSheet(BuildContext context) {
    final cubit = context.read<OrderTrackingCubit>();
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
      ),
      builder: (_) => Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('سبب الإلغاء',
                style: TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary)),
            const SizedBox(height: 4),
            const Text('قد تُطبّق رسوم إلغاء حسب سياسة الإلغاء',
                style: TextStyle(
                    fontSize: 12, color: AppColors.textMuted)),
            const SizedBox(height: 14),
            ...['تغيّر موعدي', 'تأخر الفني', 'حجزت بالخطأ', 'سبب آخر']
                .map((r) => ListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Text(r,
                          style: const TextStyle(
                              color: AppColors.textPrimary)),
                      trailing: const Icon(Icons.chevron_left,
                          color: AppColors.textMuted),
                      onTap: () {
                        Navigator.pop(context);
                        cubit.cancel(order.number);
                      },
                    )),
          ],
        ),
      ),
    );
  }
}
