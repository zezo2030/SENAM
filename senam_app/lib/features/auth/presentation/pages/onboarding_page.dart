import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/app_widgets.dart';
import 'login_page.dart';

/// محتوى شاشات التعريف (نص ثابت — جزء من واجهة المستخدم).
class _OnboardContent {
  static const titles = [
    'كل الخدمات التي تحتاجها',
    'شركات موثوقة ومعتمدة',
    'احجز وتتبع طلبك بسهولة',
  ];
  static const subtitles = [
    'منصة موحدة لحجز خدمات الشركات في قطر — غسيل سيارات، حلاقة، تنظيف، صيانة وأكثر.',
    'كل الشركات مفحوصة ومعتمدة من فريق SENAM لضمان جودة وأمان الخدمة.',
    'حدد الموعد، ادفع إلكترونياً، وتابع الفني لحظة بلحظة حتى وصوله إليك.',
  ];
  static const icons = [
    Icons.grid_view_rounded,
    Icons.verified_user_rounded,
    Icons.local_shipping_rounded,
  ];
}

class OnboardingPage extends StatefulWidget {
  const OnboardingPage({super.key});

  @override
  State<OnboardingPage> createState() => _OnboardingPageState();
}

class _OnboardingPageState extends State<OnboardingPage> {
  final _controller = PageController();
  int _page = 0;

  void _next() {
    if (_page < 2) {
      _controller.nextPage(
        duration: const Duration(milliseconds: 350),
        curve: Curves.easeOut,
      );
    } else {
      _goToLogin();
    }
  }

  void _goToLogin() {
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (_) => const LoginPage()),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isLast = _page == 2;
    return Scaffold(
      body: DarkBackground(
        child: SafeArea(
          child: Column(
            children: [
              Align(
                alignment: Alignment.centerLeft,
                child: TextButton(
                  onPressed: _goToLogin,
                  child: const Text('تخطي',
                      style: TextStyle(color: AppColors.textSecondary)),
                ),
              ),
              Expanded(
                child: PageView.builder(
                  controller: _controller,
                  itemCount: 3,
                  onPageChanged: (i) => setState(() => _page = i),
                  itemBuilder: (_, i) => _OnboardPageView(index: i),
                ),
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(3, (i) {
                  final active = i == _page;
                  return AnimatedContainer(
                    duration: const Duration(milliseconds: 250),
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    width: active ? 26 : 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: active ? AppColors.gold : AppColors.border,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  );
                }),
              ),
              Padding(
                padding: const EdgeInsets.all(24),
                child: ElevatedButton(
                  onPressed: _next,
                  child: Text(isLast ? 'ابدأ الآن' : 'التالي'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _OnboardPageView extends StatelessWidget {
  final int index;
  const _OnboardPageView({required this.index});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 32),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 200,
            height: 200,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: RadialGradient(
                colors: [
                  AppColors.gold.withValues(alpha: 0.22),
                  Colors.transparent,
                ],
              ),
            ),
            child: Center(
              child: Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(34),
                  gradient: AppColors.goldGradient,
                ),
                child: Icon(
                  _OnboardContent.icons[index],
                  size: 60,
                  color: const Color(0xFF1A1500),
                ),
              ),
            ),
          ),
          const SizedBox(height: 44),
          Text(
            _OnboardContent.titles[index],
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w800,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 14),
          Text(
            _OnboardContent.subtitles[index],
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 14,
              height: 1.7,
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}
