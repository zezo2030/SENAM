import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/app_widgets.dart';

/// تعديل بيانات الملف الشخصي.
class EditProfilePage extends StatefulWidget {
  const EditProfilePage({super.key});

  @override
  State<EditProfilePage> createState() => _EditProfilePageState();
}

class _EditProfilePageState extends State<EditProfilePage> {
  final _name = TextEditingController(text: 'محمد علي');
  final _email = TextEditingController(text: 'mohammed@senam.qa');
  final _phone = TextEditingController(text: '+974 5555 1234');
  String _gender = 'ذكر';

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _phone.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        title: const Text('تعديل الملف الشخصي'),
      ),
      body: DarkBackground(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              Center(
                child: Stack(
                  children: [
                    Container(
                      width: 110,
                      height: 110,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: AppColors.surface,
                        border: Border.all(color: AppColors.gold, width: 2),
                      ),
                      child: const Icon(Icons.person,
                          color: AppColors.gold, size: 60),
                    ),
                    Positioned(
                      bottom: 0,
                      left: 0,
                      child: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: const BoxDecoration(
                            shape: BoxShape.circle,
                            gradient: AppColors.goldGradient),
                        child: const Icon(Icons.camera_alt,
                            color: Color(0xFF1A1500), size: 18),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 30),
              _label('الاسم الكامل'),
              const SizedBox(height: 8),
              TextField(
                controller: _name,
                decoration: const InputDecoration(
                  prefixIcon:
                      Icon(Icons.person_outline, color: AppColors.textMuted),
                ),
              ),
              const SizedBox(height: 16),
              _label('البريد الإلكتروني'),
              const SizedBox(height: 8),
              TextField(
                controller: _email,
                textDirection: TextDirection.ltr,
                decoration: const InputDecoration(
                  prefixIcon:
                      Icon(Icons.mail_outline, color: AppColors.textMuted),
                ),
              ),
              const SizedBox(height: 16),
              _label('رقم الجوال'),
              const SizedBox(height: 8),
              TextField(
                controller: _phone,
                enabled: false,
                textDirection: TextDirection.ltr,
                decoration: const InputDecoration(
                  prefixIcon: Icon(Icons.phone, color: AppColors.textMuted),
                  suffixIcon:
                      Icon(Icons.lock_outline, color: AppColors.textMuted),
                ),
              ),
              const SizedBox(height: 16),
              _label('الجنس'),
              const SizedBox(height: 8),
              Row(
                children: [
                  _genderTile('ذكر', Icons.male),
                  const SizedBox(width: 12),
                  _genderTile('أنثى', Icons.female),
                ],
              ),
              const SizedBox(height: 16),
              _label('تاريخ الميلاد'),
              const SizedBox(height: 8),
              GradientCard(
                onTap: () {},
                child: Row(
                  children: const [
                    Icon(Icons.calendar_today, color: AppColors.textMuted),
                    SizedBox(width: 10),
                    Text('1992 / 05 / 14',
                        style: TextStyle(color: AppColors.textPrimary)),
                  ],
                ),
              ),
              const SizedBox(height: 30),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('تم حفظ التغييرات')),
                    );
                    Navigator.pop(context);
                  },
                  child: const Text('حفظ التغييرات'),
                ),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () {},
                  icon:
                      const Icon(Icons.delete_forever, color: Colors.redAccent),
                  label: const Text('حذف الحساب',
                      style: TextStyle(color: Colors.redAccent)),
                  style: OutlinedButton.styleFrom(
                    side:
                        BorderSide(color: Colors.redAccent.withValues(alpha: .4)),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _label(String t) => Align(
        alignment: Alignment.centerRight,
        child: Text(t,
            style: const TextStyle(
                color: AppColors.textPrimary, fontWeight: FontWeight.w700)),
      );

  Widget _genderTile(String label, IconData icon) {
    final selected = _gender == label;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _gender = label),
        child: Container(
          height: 52,
          decoration: BoxDecoration(
            color: selected
                ? AppColors.gold.withValues(alpha: .12)
                : AppColors.surface,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
                color: selected ? AppColors.gold : AppColors.border),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon,
                  color: selected ? AppColors.gold : AppColors.textMuted),
              const SizedBox(width: 8),
              Text(label,
                  style: TextStyle(
                      color: AppColors.textPrimary,
                      fontWeight:
                          selected ? FontWeight.w800 : FontWeight.w500)),
            ],
          ),
        ),
      ),
    );
  }
}
