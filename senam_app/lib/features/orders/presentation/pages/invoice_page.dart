import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/app_widgets.dart';

/// شاشة الفاتورة (Invoice) لطلب مكتمل.
class InvoicePage extends StatelessWidget {
  final String orderNumber;
  const InvoicePage({super.key, this.orderNumber = '1024'});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        title: const Text('الفاتورة'),
        actions: [
          IconButton(
            icon: const Icon(Icons.download, color: AppColors.gold),
            onPressed: () {},
          ),
          IconButton(
            icon: const Icon(Icons.share, color: AppColors.gold),
            onPressed: () {},
          ),
        ],
      ),
      body: DarkBackground(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(20),
              border:
                  Border.all(color: AppColors.gold.withValues(alpha: .25)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const SenamLogo(fontSize: 18),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        const Text('فاتورة ضريبية',
                            style: TextStyle(
                                color: AppColors.gold,
                                fontWeight: FontWeight.w800)),
                        const SizedBox(height: 4),
                        Text('#$orderNumber',
                            style: const TextStyle(
                                color: AppColors.textMuted,
                                fontSize: 12)),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                const Divider(color: AppColors.border),
                const SizedBox(height: 12),
                _kv('التاريخ', '18 مايو 2026 - 14:32'),
                _kv('العميل', 'محمد علي'),
                _kv('الجوال', '+974 5555 1234'),
                _kv('العنوان', 'الدوحة - الوعب، شارع 12'),
                const SizedBox(height: 12),
                const Divider(color: AppColors.border),
                const SizedBox(height: 12),
                _kv('الشركة', 'الفخامة لغسيل السيارات'),
                _kv('الرقم الضريبي', '32100045678'),
                const SizedBox(height: 14),
                const Text('تفاصيل الخدمة',
                    style: TextStyle(
                        color: AppColors.textPrimary,
                        fontWeight: FontWeight.w800)),
                const SizedBox(height: 10),
                _line('غسيل خارجي شامل', '1', 35.0),
                _line('تلميع داخلي', '1', 25.0),
                _line('معطر سيارة', '1', 5.0),
                const SizedBox(height: 12),
                const Divider(color: AppColors.border),
                _total('المجموع الفرعي', '65.00 ر.ق'),
                _total('الخصم (SENAM20)', '-13.00 ر.ق',
                    color: AppColors.success),
                _total('الضريبة (5%)', '2.60 ر.ق'),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppColors.gold.withValues(alpha: .12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: const [
                      Text('الإجمالي',
                          style: TextStyle(
                              color: AppColors.textPrimary,
                              fontWeight: FontWeight.w800,
                              fontSize: 16)),
                      Text('54.60 ر.ق',
                          style: TextStyle(
                              color: AppColors.gold,
                              fontWeight: FontWeight.w900,
                              fontSize: 20)),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    const Icon(Icons.credit_card,
                        size: 16, color: AppColors.textMuted),
                    const SizedBox(width: 6),
                    const Text('Visa **4242',
                        style: TextStyle(color: AppColors.textSecondary)),
                    const Spacer(),
                    const TagPill(
                        text: 'مدفوع',
                        icon: Icons.check_circle,
                        color: AppColors.success),
                  ],
                ),
                const SizedBox(height: 20),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.background,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 60,
                        height: 60,
                        color: Colors.white,
                        child: const Icon(Icons.qr_code_2,
                            size: 56, color: Colors.black),
                      ),
                      const SizedBox(width: 10),
                      const Expanded(
                        child: Text(
                          'يمكنك التحقق من صحة هذه الفاتورة بمسح الـ QR Code',
                          style: TextStyle(
                              color: AppColors.textMuted, fontSize: 11),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _kv(String k, String v) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 3),
        child: Row(
          children: [
            Text('$k: ',
                style: const TextStyle(
                    color: AppColors.textMuted, fontSize: 12)),
            Expanded(
              child: Text(v,
                  style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 13,
                      fontWeight: FontWeight.w600)),
            ),
          ],
        ),
      );

  Widget _line(String name, String qty, double price) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 6),
        child: Row(
          children: [
            Expanded(
              child: Text(name,
                  style: const TextStyle(
                      color: AppColors.textPrimary, fontSize: 13)),
            ),
            SizedBox(
                width: 30,
                child: Text(qty,
                    textAlign: TextAlign.center,
                    style:
                        const TextStyle(color: AppColors.textSecondary))),
            SizedBox(
              width: 70,
              child: Text('${price.toStringAsFixed(2)} ر.ق',
                  textAlign: TextAlign.end,
                  style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w700)),
            ),
          ],
        ),
      );

  Widget _total(String k, String v, {Color? color}) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 3),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(k,
                style: const TextStyle(
                    color: AppColors.textSecondary, fontSize: 13)),
            Text(v,
                style: TextStyle(
                    color: color ?? AppColors.textPrimary,
                    fontWeight: FontWeight.w700)),
          ],
        ),
      );
}
