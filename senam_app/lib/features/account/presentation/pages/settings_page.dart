import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/app_widgets.dart';

class SettingsPage extends StatefulWidget {
  const SettingsPage({super.key});

  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  bool _pushOrders = true;
  bool _pushOffers = true;
  bool _pushReminders = true;
  bool _emailNotif = false;
  bool _darkMode = true;
  bool _locationShare = true;
  bool _biometric = false;
  String _language = 'العربية';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        title: const Text('الإعدادات'),
      ),
      body: DarkBackground(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            _section('الإشعارات', [
              _switch('إشعارات الطلبات', _pushOrders,
                  (v) => setState(() => _pushOrders = v),
                  icon: Icons.local_shipping_outlined),
              _switch('العروض والكوبونات', _pushOffers,
                  (v) => setState(() => _pushOffers = v),
                  icon: Icons.local_offer_outlined),
              _switch('تذكير المواعيد', _pushReminders,
                  (v) => setState(() => _pushReminders = v),
                  icon: Icons.alarm_outlined),
              _switch('إشعارات البريد الإلكتروني', _emailNotif,
                  (v) => setState(() => _emailNotif = v),
                  icon: Icons.mail_outline),
            ]),
            const SizedBox(height: 16),
            _section('اللغة والمظهر', [
              ListTile(
                contentPadding:
                    const EdgeInsets.symmetric(horizontal: 16),
                leading: _iconBox(Icons.language),
                title: const Text('اللغة',
                    style: TextStyle(color: AppColors.textPrimary)),
                trailing: DropdownButton<String>(
                  value: _language,
                  dropdownColor: AppColors.surface,
                  underline: const SizedBox(),
                  style: const TextStyle(color: AppColors.gold),
                  items: const [
                    DropdownMenuItem(
                        value: 'العربية', child: Text('العربية')),
                    DropdownMenuItem(
                        value: 'English', child: Text('English')),
                  ],
                  onChanged: (v) =>
                      setState(() => _language = v ?? _language),
                ),
              ),
              _switch('الوضع الداكن', _darkMode,
                  (v) => setState(() => _darkMode = v),
                  icon: Icons.dark_mode_outlined),
            ]),
            const SizedBox(height: 16),
            _section('الخصوصية والأمان', [
              _switch('مشاركة الموقع', _locationShare,
                  (v) => setState(() => _locationShare = v),
                  icon: Icons.location_on_outlined),
              _switch('بصمة الإصبع / Face ID', _biometric,
                  (v) => setState(() => _biometric = v),
                  icon: Icons.fingerprint),
              _link(Icons.lock_outline, 'تغيير كلمة المرور', () {}),
              _link(Icons.privacy_tip_outlined, 'سياسة الخصوصية', () {}),
              _link(Icons.gavel_outlined, 'الشروط والأحكام', () {}),
            ]),
            const SizedBox(height: 16),
            _section('بيانات الحساب', [
              _link(Icons.cloud_download_outlined,
                  'تنزيل بياناتي', () {}),
              _link(Icons.delete_forever, 'حذف الحساب', () {},
                  danger: true),
            ]),
            const SizedBox(height: 24),
            Center(
              child: Column(
                children: const [
                  Text('SENAM • الإصدار 1.0.0',
                      style: TextStyle(
                          color: AppColors.textMuted, fontSize: 12)),
                  SizedBox(height: 4),
                  Text('© 2026 SENAM Qatar',
                      style: TextStyle(
                          color: AppColors.textMuted, fontSize: 11)),
                ],
              ),
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _section(String title, List<Widget> children) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
          child: Text(title,
              style: const TextStyle(
                  color: AppColors.textSecondary,
                  fontWeight: FontWeight.w700,
                  fontSize: 13)),
        ),
        Container(
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.border),
          ),
          child: Column(children: children),
        ),
      ],
    );
  }

  Widget _switch(String label, bool value, ValueChanged<bool> onChanged,
      {required IconData icon}) {
    return SwitchListTile(
      value: value,
      onChanged: onChanged,
      activeColor: AppColors.gold,
      contentPadding:
          const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
      secondary: _iconBox(icon),
      title: Text(label,
          style: const TextStyle(
              color: AppColors.textPrimary, fontSize: 14)),
    );
  }

  Widget _link(IconData icon, String label, VoidCallback onTap,
      {bool danger = false}) {
    return ListTile(
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16),
      leading: _iconBox(icon, danger: danger),
      title: Text(label,
          style: TextStyle(
              color: danger ? Colors.redAccent : AppColors.textPrimary,
              fontSize: 14)),
      trailing:
          const Icon(Icons.chevron_left, color: AppColors.textMuted),
    );
  }

  Widget _iconBox(IconData icon, {bool danger = false}) {
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: (danger ? Colors.redAccent : AppColors.gold)
            .withValues(alpha: .1),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Icon(icon,
          color: danger ? Colors.redAccent : AppColors.gold, size: 18),
    );
  }
}
