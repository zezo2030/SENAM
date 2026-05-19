import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/app_widgets.dart';
import 'select_location_page.dart';

/// إكمال الملف الشخصي بعد التحقق من رقم الجوال.
class CompleteProfilePage extends StatefulWidget {
  const CompleteProfilePage({super.key});

  @override
  State<CompleteProfilePage> createState() => _CompleteProfilePageState();
}

class _CompleteProfilePageState extends State<CompleteProfilePage> {
  final _name = TextEditingController();
  final _email = TextEditingController();

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: DarkBackground(
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                IconButton(
                  icon: const Icon(Icons.arrow_forward_rounded,
                      color: AppColors.textPrimary),
                  onPressed: () => Navigator.pop(context),
                ),
                const SizedBox(height: 16),
                const Text('أكمل ملفك',
                    style: TextStyle(
                        fontSize: 26,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textPrimary)),
                const SizedBox(height: 8),
                const Text(
                    'لمساعدتنا في تخصيص تجربتك أكثر، يرجى تعبئة بياناتك.',
                    style: TextStyle(
                        fontSize: 14, color: AppColors.textSecondary)),
                const SizedBox(height: 36),
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
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            gradient: AppColors.goldGradient,
                          ),
                          child: const Icon(Icons.camera_alt,
                              color: Color(0xFF1A1500), size: 18),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 36),
                const _Label('الاسم الكامل *'),
                const SizedBox(height: 10),
                TextField(
                  controller: _name,
                  decoration: const InputDecoration(
                    hintText: 'مثال: أحمد محمد',
                    prefixIcon:
                        Icon(Icons.person_outline, color: AppColors.textMuted),
                  ),
                ),
                const SizedBox(height: 18),
                const _Label('البريد الإلكتروني (اختياري)'),
                const SizedBox(height: 10),
                TextField(
                  controller: _email,
                  keyboardType: TextInputType.emailAddress,
                  textDirection: TextDirection.ltr,
                  decoration: const InputDecoration(
                    hintText: 'example@email.com',
                    prefixIcon:
                        Icon(Icons.mail_outline, color: AppColors.textMuted),
                  ),
                ),
                const SizedBox(height: 36),
                ElevatedButton(
                  onPressed: () => Navigator.pushReplacement(
                    context,
                    MaterialPageRoute(
                        builder: (_) => const SelectLocationPage()),
                  ),
                  child: const Text('متابعة'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _Label extends StatelessWidget {
  final String text;
  const _Label(this.text);
  @override
  Widget build(BuildContext context) => Text(text,
      style: const TextStyle(
          color: AppColors.textPrimary, fontWeight: FontWeight.w700));
}
