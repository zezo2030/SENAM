import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/app_widgets.dart';

/// إدارة طرق الدفع المحفوظة.
class PaymentMethodsPage extends StatefulWidget {
  const PaymentMethodsPage({super.key});

  @override
  State<PaymentMethodsPage> createState() => _PaymentMethodsPageState();
}

class _PaymentMethodsPageState extends State<PaymentMethodsPage> {
  final List<_Card> _cards = [
    _Card('Visa', '4242', '12/27', true, Colors.indigoAccent),
    _Card('Mastercard', '8814', '08/26', false, Colors.deepOrangeAccent),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        title: const Text('طرق الدفع'),
      ),
      body: DarkBackground(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('البطاقات المحفوظة',
                  style: TextStyle(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w800,
                      fontSize: 15)),
              const SizedBox(height: 12),
              ..._cards.map((c) => Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: _buildCard(c),
                  )),
              const SizedBox(height: 8),
              GradientCard(
                onTap: () => showModalBottomSheet(
                  context: context,
                  backgroundColor: AppColors.surface,
                  isScrollControlled: true,
                  shape: const RoundedRectangleBorder(
                    borderRadius: BorderRadius.vertical(
                        top: Radius.circular(22)),
                  ),
                  builder: (_) => const _AddCardSheet(),
                ),
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        gradient: AppColors.goldGradient,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.add,
                          color: Color(0xFF1A1500)),
                    ),
                    const SizedBox(width: 12),
                    const Expanded(
                      child: Text('إضافة بطاقة جديدة',
                          style: TextStyle(
                              color: AppColors.textPrimary,
                              fontWeight: FontWeight.w700)),
                    ),
                    const Icon(Icons.chevron_left,
                        color: AppColors.textMuted),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              const Text('طرق دفع أخرى',
                  style: TextStyle(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w800,
                      fontSize: 15)),
              const SizedBox(height: 12),
              _wallet('Apple Pay', Icons.apple, true),
              const SizedBox(height: 10),
              _wallet('Google Pay', Icons.g_mobiledata, true),
              const SizedBox(height: 10),
              _wallet('محفظة سنام', Icons.account_balance_wallet_outlined,
                  true, badge: '250 ر.ق'),
              const SizedBox(height: 10),
              _wallet('الدفع نقداً عند الوصول', Icons.payments_outlined, true),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCard(_Card c) {
    return Container(
      height: 170,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: LinearGradient(
          colors: [c.color, c.color.withValues(alpha: .55)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(c.brand,
                  style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w800,
                      fontSize: 18)),
              if (c.primary)
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: .22),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Text('افتراضية',
                      style: TextStyle(
                          color: Colors.white,
                          fontSize: 11,
                          fontWeight: FontWeight.w700)),
                ),
            ],
          ),
          Text('•••• •••• •••• ${c.last4}',
              style: const TextStyle(
                  color: Colors.white,
                  fontSize: 19,
                  letterSpacing: 3,
                  fontWeight: FontWeight.w700)),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('صلاحية ${c.expiry}',
                  style:
                      const TextStyle(color: Colors.white70, fontSize: 12)),
              Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.delete_outline,
                        color: Colors.white70),
                    onPressed: () =>
                        setState(() => _cards.remove(c)),
                  ),
                  IconButton(
                    icon: const Icon(Icons.check_circle_outline,
                        color: Colors.white),
                    onPressed: () => setState(() {
                      for (var x in _cards) x.primary = false;
                      c.primary = true;
                    }),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _wallet(String label, IconData icon, bool enabled,
      {String? badge}) {
    return GradientCard(
      padding: const EdgeInsets.all(14),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: AppColors.gold.withValues(alpha: .12),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: AppColors.gold),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(label,
                style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.w700)),
          ),
          if (badge != null)
            TagPill(text: badge, icon: Icons.account_balance_wallet),
          const SizedBox(width: 8),
          Switch(
            value: enabled,
            activeColor: AppColors.gold,
            onChanged: (_) {},
          ),
        ],
      ),
    );
  }
}

class _Card {
  final String brand;
  final String last4;
  final String expiry;
  bool primary;
  final Color color;
  _Card(this.brand, this.last4, this.expiry, this.primary, this.color);
}

class _AddCardSheet extends StatelessWidget {
  const _AddCardSheet();
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
        left: 20,
        right: 20,
        top: 16,
      ),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(
                width: 44,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.textMuted,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),
            const Text('إضافة بطاقة جديدة',
                style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary)),
            const SizedBox(height: 20),
            const TextField(
              textDirection: TextDirection.ltr,
              decoration: InputDecoration(
                labelText: 'رقم البطاقة',
                hintText: '1234 5678 9012 3456',
                prefixIcon: Icon(Icons.credit_card),
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: const [
                Expanded(
                  child: TextField(
                    textDirection: TextDirection.ltr,
                    decoration: InputDecoration(
                      labelText: 'الصلاحية',
                      hintText: 'MM/YY',
                    ),
                  ),
                ),
                SizedBox(width: 12),
                Expanded(
                  child: TextField(
                    textDirection: TextDirection.ltr,
                    decoration: InputDecoration(
                      labelText: 'CVV',
                      hintText: '123',
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            const TextField(
              decoration: InputDecoration(
                labelText: 'اسم حامل البطاقة',
              ),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('حفظ البطاقة'),
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }
}
