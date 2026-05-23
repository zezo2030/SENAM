import 'package:flutter/material.dart';

import '../../../../core/di/injection_container.dart';
import '../../../../core/theme/app_colors.dart';
import '../../data/datasources/application_local_storage.dart';
import '../pages/application_status_page.dart';

/// شريط يظهر في شاشة الدخول لو فيه طلب شركة مُقدَّم سابقاً من هذا الجهاز.
class PendingApplicationBanner extends StatefulWidget {
  const PendingApplicationBanner({super.key});

  @override
  State<PendingApplicationBanner> createState() =>
      _PendingApplicationBannerState();
}

class _PendingApplicationBannerState extends State<PendingApplicationBanner> {
  String? _companyId;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final id = await sl<ApplicationLocalStorage>().read();
    if (!mounted) return;
    setState(() {
      _companyId = id;
      _loading = false;
    });
  }

  Future<void> _dismiss() async {
    await sl<ApplicationLocalStorage>().clear();
    if (!mounted) return;
    setState(() => _companyId = null);
  }

  @override
  Widget build(BuildContext context) {
    if (_loading || _companyId == null) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: GestureDetector(
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => ApplicationStatusPage(companyId: _companyId!),
          ),
        ),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            color: AppColors.gold.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.gold.withValues(alpha: 0.4)),
          ),
          child: Row(
            children: [
              const Icon(Icons.business_center_outlined,
                  color: AppColors.gold, size: 22),
              const SizedBox(width: 12),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'لديك طلب شركة قيد المتابعة',
                      style: TextStyle(
                          color: AppColors.textPrimary,
                          fontWeight: FontWeight.w800,
                          fontSize: 13),
                    ),
                    SizedBox(height: 2),
                    Text(
                      'اضغط لعرض حالة الطلب',
                      style: TextStyle(
                          color: AppColors.textMuted, fontSize: 11),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_left,
                  color: AppColors.gold, size: 22),
              IconButton(
                icon: const Icon(Icons.close,
                    color: AppColors.textMuted, size: 18),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
                tooltip: 'إخفاء',
                onPressed: _dismiss,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
