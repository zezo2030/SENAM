import 'package:flutter/material.dart';
import '../core/theme/app_colors.dart';
import '../features/account/presentation/pages/account_page.dart';
import '../features/home/presentation/pages/home_page.dart';
import '../features/favorites/presentation/pages/favorites_page.dart';
import '../features/services/presentation/pages/companies_page.dart';

/// الهيكل الرئيسي للتطبيق مع شريط التنقل السفلي.
class MainNav extends StatefulWidget {
  final int initialIndex;
  const MainNav({super.key, this.initialIndex = 0});

  @override
  State<MainNav> createState() => _MainNavState();
}

class _MainNavState extends State<MainNav> {
  late int _index = widget.initialIndex;

  final _pages = const [
    HomePage(),
    CompaniesPage(),
    FavoritesPage(),
    AccountPage(),
  ];

  void _onTap(int i) {
    setState(() => _index = i);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _index, children: _pages),
      bottomNavigationBar: _BottomBar(current: _index, onTap: _onTap),
    );
  }
}

class _BottomBar extends StatelessWidget {
  final int current;
  final ValueChanged<int> onTap;

  const _BottomBar({required this.current, required this.onTap});

  static const _items = [
    ('الرئيسية'),
    ('الشركات'),
    ('المفضلة'),
    ('الحساب'),
  ];

  IconData _getIcon(int i, bool selected) {
    switch (i) {
      case 0:
        return selected ? Icons.home_rounded : Icons.home_outlined;
      case 1:
        return selected ? Icons.apartment_rounded : Icons.apartment_outlined;
      case 2:
        return selected ? Icons.favorite_rounded : Icons.favorite_border_rounded;
      case 3:
        return selected ? Icons.person_rounded : Icons.person_outline_rounded;
      default:
        return Icons.circle;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: AppColors.surface,
        border: Border(top: BorderSide(color: AppColors.border)),
      ),
      child: SafeArea(
        top: false,
        child: SizedBox(
          height: 66,
          child: Row(
            children: List.generate(_items.length, (i) {
              final selected = i == current;
              return Expanded(
                child: InkWell(
                  onTap: () => onTap(i),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        _getIcon(i, selected),
                        size: 24,
                        color: selected
                            ? AppColors.gold
                            : AppColors.textMuted,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _items[i],
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: selected
                              ? FontWeight.w700
                              : FontWeight.w400,
                          color: selected
                              ? AppColors.gold
                              : AppColors.textMuted,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }),
          ),
        ),
      ),
    );
  }
}
