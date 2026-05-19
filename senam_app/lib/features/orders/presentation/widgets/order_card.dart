import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/app_widgets.dart';
import '../../domain/entities/order.dart';

/// بطاقة طلب في قائمة "طلباتي".
class OrderCard extends StatelessWidget {
  final OrderEntity order;
  final VoidCallback? onTap;

  const OrderCard({super.key, required this.order, this.onTap});

  (String, Color) get _statusInfo {
    switch (order.status) {
      case OrderStatus.current:
        return ('قيد التنفيذ', AppColors.info);
      case OrderStatus.completed:
        return ('مكتمل', AppColors.success);
      case OrderStatus.cancelled:
        return ('ملغي', AppColors.error);
    }
  }

  @override
  Widget build(BuildContext context) {
    final (label, color) = _statusInfo;
    return GestureDetector(
      onTap: onTap,
      child: Container(
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
                Text(order.number,
                    style: const TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 13,
                        color: AppColors.textPrimary)),
                const Spacer(),
                TagPill(text: label, color: color),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                CompanyLogo(
                    label: order.companyLogo,
                    color: order.companyColor,
                    size: 48),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(order.companyName,
                          style: const TextStyle(
                              fontWeight: FontWeight.w800,
                              fontSize: 14,
                              color: AppColors.textPrimary)),
                      const SizedBox(height: 3),
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
                const Icon(Icons.access_time,
                    size: 14, color: AppColors.textMuted),
                const SizedBox(width: 5),
                Text(order.dateTime,
                    style: const TextStyle(
                        fontSize: 12, color: AppColors.textSecondary)),
                const Spacer(),
                if (order.status == OrderStatus.completed)
                  const Text('إعادة الطلب',
                      style: TextStyle(
                          color: AppColors.gold,
                          fontWeight: FontWeight.w700,
                          fontSize: 12))
                else if (order.status == OrderStatus.current)
                  const Text('تتبع الطلب',
                      style: TextStyle(
                          color: AppColors.gold,
                          fontWeight: FontWeight.w700,
                          fontSize: 12)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
