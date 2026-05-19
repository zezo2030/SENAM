import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/app_widgets.dart';

/// شاشة عرض الشركات على الخريطة (Static mock).
class MapViewPage extends StatelessWidget {
  const MapViewPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text('الخريطة'),
      ),
      body: Stack(
        children: [
          Positioned.fill(
            child: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFF1B2C3A), Color(0xFF0D1722)],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                ),
              ),
            ),
          ),
          // خطوط شبكية تشبه الخريطة
          Positioned.fill(
            child: CustomPaint(painter: _GridPainter()),
          ),
          // مواقع الشركات
          ..._pins,
          // مكان المستخدم
          const Center(
            child: Icon(Icons.my_location,
                color: AppColors.info, size: 32),
          ),
          // أدوات
          Positioned(
            top: 100,
            left: 16,
            child: Column(
              children: [
                _toolBtn(Icons.add),
                const SizedBox(height: 8),
                _toolBtn(Icons.remove),
                const SizedBox(height: 8),
                _toolBtn(Icons.my_location),
                const SizedBox(height: 8),
                _toolBtn(Icons.layers_outlined),
              ],
            ),
          ),
          // البطاقة السفلية
          Positioned(
            bottom: 16,
            left: 16,
            right: 16,
            child: SizedBox(
              height: 150,
              child: PageView.builder(
                controller: PageController(viewportFraction: 0.92),
                itemCount: 3,
                itemBuilder: (_, i) => Padding(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 6),
                  child: _MapCard(index: i),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  static final List<Widget> _pins = const [
    Positioned(top: 200, right: 60, child: _Pin(label: '35 ر.ق', selected: true)),
    Positioned(top: 280, left: 80, child: _Pin(label: '45 ر.ق')),
    Positioned(top: 360, right: 130, child: _Pin(label: '55 ر.ق')),
    Positioned(top: 420, left: 60, child: _Pin(label: '40 ر.ق')),
  ];

  static Widget _toolBtn(IconData icon) => Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: AppColors.surface.withValues(alpha: .9),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: AppColors.border),
        ),
        child: Icon(icon, color: AppColors.textPrimary, size: 18),
      );
}

class _GridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final p = Paint()
      ..color = Colors.white.withValues(alpha: .04)
      ..strokeWidth = 1;
    for (double i = 0; i < size.width; i += 40) {
      canvas.drawLine(Offset(i, 0), Offset(i, size.height), p);
    }
    for (double i = 0; i < size.height; i += 40) {
      canvas.drawLine(Offset(0, i), Offset(size.width, i), p);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _Pin extends StatelessWidget {
  final String label;
  final bool selected;
  const _Pin({required this.label, this.selected = false});

  @override
  Widget build(BuildContext context) {
    final color = selected ? AppColors.gold : AppColors.surface;
    final txt = selected ? const Color(0xFF1A1500) : AppColors.textPrimary;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.gold, width: 1.5),
        boxShadow: [
          BoxShadow(
              color: AppColors.gold.withValues(alpha: .35),
              blurRadius: 10),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.location_pin, color: txt, size: 14),
          const SizedBox(width: 4),
          Text(label,
              style: TextStyle(
                  color: txt,
                  fontWeight: FontWeight.w800,
                  fontSize: 12)),
        ],
      ),
    );
  }
}

class _MapCard extends StatelessWidget {
  final int index;
  const _MapCard({required this.index});

  @override
  Widget build(BuildContext context) {
    final names = ['الفخامة لغسيل السيارات', 'سبارك كلين', 'إيليت كار وش'];
    final prices = [35, 45, 55];
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.gold.withValues(alpha: .25)),
      ),
      child: Row(
        children: [
          CompanyLogo(
              label: names[index].substring(0, 1),
              color: AppColors.gold,
              size: 60),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(names[index],
                    style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontWeight: FontWeight.w800)),
                const SizedBox(height: 4),
                const Text('1.2 كم • الوعب',
                    style: TextStyle(
                        color: AppColors.textSecondary, fontSize: 12)),
                const SizedBox(height: 6),
                Row(
                  children: [
                    const RatingBadge(rating: 4.8, count: 240),
                    const SizedBox(width: 10),
                    Text('من ${prices[index]} ر.ق',
                        style: const TextStyle(
                            color: AppColors.gold,
                            fontWeight: FontWeight.w700,
                            fontSize: 12)),
                  ],
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(
                horizontal: 10, vertical: 8),
            decoration: const BoxDecoration(
              gradient: AppColors.goldGradient,
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.arrow_back_ios_new,
                color: Color(0xFF1A1500), size: 14),
          ),
        ],
      ),
    );
  }
}
