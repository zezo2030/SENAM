import 'package:flutter/material.dart';
import 'package:senam_app/app/main_nav.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/app_widgets.dart';
import '../../../orders/domain/entities/order.dart';
import '../../../orders/presentation/pages/order_tracking_page.dart';
import '../../domain/entities/booking.dart';

class OrderSuccessPage extends StatelessWidget {
  final Booking booking;
  final String orderNumber;

  const OrderSuccessPage({
    super.key,
    required this.booking,
    required this.orderNumber,
  });

  OrderEntity _toOrder() => OrderEntity(
        number: orderNumber,
        companyName: booking.companyName,
        companyLogo: booking.companyLogoLabel,
        companyColor: AppColors.gold,
        serviceName: booking.serviceName,
        total: booking.total,
        dateTime: '${booking.date}، ${booking.time}',
        status: OrderStatus.current,
        trackingStep: 0,
      );

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: DarkBackground(
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              children: [
                const Spacer(),
                Container(
                  width: 110,
                  height: 110,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: AppColors.success.withValues(alpha: 0.15),
                  ),
                  child: Center(
                    child: Container(
                      width: 76,
                      height: 76,
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        color: AppColors.success,
                      ),
                      child: const Icon(Icons.check,
                          color: Colors.white, size: 44),
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                const Text('تم تأكيد حجزك بنجاح!',
                    style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w900,
                        color: AppColors.textPrimary)),
                const SizedBox(height: 8),
                Text('رقم الطلب $orderNumber',
                    style: const TextStyle(
                        fontSize: 14, color: AppColors.textSecondary)),
                const SizedBox(height: 28),
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Column(
                    children: [
                      _row('الخدمة', booking.serviceName),
                      _divider(),
                      _row('الشركة', booking.companyName),
                      _divider(),
                      _row('الموعد', '${booking.date}، ${booking.time}'),
                      _divider(),
                      _row('الإجمالي', '${booking.total} ر.ق', gold: true),
                    ],
                  ),
                ),
                const Spacer(),
                ElevatedButton(
                  onPressed: () => Navigator.pushReplacement(
                    context,
                    MaterialPageRoute(
                      builder: (_) =>
                          OrderTrackingPage(order: _toOrder()),
                    ),
                  ),
                  child: const Text('تتبع الطلب'),
                ),
                const SizedBox(height: 12),
                TextButton(
                  onPressed: () => Navigator.pushAndRemoveUntil(
                    context,
                    MaterialPageRoute(builder: (_) => const MainNav()),
                    (route) => false,
                  ),
                  child: const Text('العودة للرئيسية',
                      style: TextStyle(color: AppColors.textSecondary)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _row(String label, String value, {bool gold = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label,
            style: const TextStyle(
                fontSize: 13, color: AppColors.textSecondary)),
        Text(value,
            style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w800,
                color: gold ? AppColors.gold : AppColors.textPrimary)),
      ],
    );
  }

  Widget _divider() => const Padding(
        padding: EdgeInsets.symmetric(vertical: 10),
        child: Divider(color: AppColors.border, height: 1),
      );
}
