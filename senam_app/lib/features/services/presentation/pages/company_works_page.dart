import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../../../../core/di/injection_container.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/whatsapp_launcher.dart';
import '../../../../core/widgets/app_widgets.dart';
import '../../domain/entities/company.dart';
import '../../domain/usecases/get_company_detail.dart';

/// صفحة "تصاميم/أعمال الشركة" — فلتر فئات مُعرَّفة من الشركة + شبكة عمودين +
/// زرّ واتساب ذهبي ثابت أسفل.
class CompanyWorksPage extends StatefulWidget {
  final Company company;
  const CompanyWorksPage({super.key, required this.company});

  @override
  State<CompanyWorksPage> createState() => _CompanyWorksPageState();
}

class _CompanyWorksPageState extends State<CompanyWorksPage> {
  /// null = "all categories" filter; '' = uncategorized; otherwise a category id.
  String? _selectedCatId;
  late final Future<Company> _companyFuture;

  @override
  void initState() {
    super.initState();
    _companyFuture = _loadCompanyDetail();
  }

  Future<Company> _loadCompanyDetail() async {
    final result = await sl<GetCompanyDetail>()(widget.company.id);
    return result.getOrElse(() => widget.company);
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Company>(
      future: _companyFuture,
      builder: (context, snapshot) {
        final company = snapshot.data ?? widget.company;
        final isLoading =
            snapshot.connectionState == ConnectionState.waiting &&
                snapshot.data == null;
    final categories = company.galleryCategories;
    final showFilters = categories.isNotEmpty;

    // Filtered photo list.
    final photos = _selectedCatId == null
        ? company.gallery.values.expand((p) => p).toList()
        : (company.gallery[_selectedCatId!] ?? const <GalleryPhoto>[]);

    return Scaffold(
      appBar: AppBar(
        title: Text('تصاميم ${company.name}'),
        centerTitle: true,
      ),
      body: isLoading
          ? const LoadingView()
          : Column(
        children: [
          if (showFilters) ...[
            const SizedBox(height: 8),
            SizedBox(
              height: 40,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                reverse: true,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: categories.length + 1,
                separatorBuilder: (_, _) => const SizedBox(width: 8),
                itemBuilder: (_, i) {
                  if (i == 0) {
                    return _FilterChip(
                      label: 'كل التصاميم',
                      selected: _selectedCatId == null,
                      onTap: () => setState(() => _selectedCatId = null),
                    );
                  }
                  final cat = categories[i - 1];
                  return _FilterChip(
                    label: cat.ar.isEmpty ? cat.en : cat.ar,
                    selected: _selectedCatId == cat.id,
                    onTap: () => setState(() => _selectedCatId = cat.id),
                  );
                },
              ),
            ),
            const SizedBox(height: 12),
          ] else
            const SizedBox(height: 8),
          Expanded(
            child: photos.isEmpty
                ? const EmptyView(
                    message: 'لا توجد تصاميم بعد',
                    icon: Icons.image_outlined,
                  )
                : GridView.builder(
                    padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
                    itemCount: photos.length,
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      mainAxisSpacing: 12,
                      crossAxisSpacing: 12,
                      childAspectRatio: 0.92,
                    ),
                    itemBuilder: (_, i) => ClipRRect(
                      borderRadius: BorderRadius.circular(14),
                      child: CachedNetworkImage(
                        imageUrl: photos[i].url,
                        fit: BoxFit.cover,
                        errorWidget: (c, e, s) => Container(
                          color: AppColors.surfaceLight,
                          alignment: Alignment.center,
                          child: const Icon(
                              Icons.broken_image_outlined,
                              color: AppColors.textMuted),
                        ),
                        placeholder: (c, url) => Container(
                            color: AppColors.surfaceLight,
                            alignment: Alignment.center,
                            child: const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: AppColors.gold,
                              ),
                            ),
                          ),
                      ),
                    ),
                  ),
          ),
        ],
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
        decoration: const BoxDecoration(
          color: AppColors.surface,
          border: Border(top: BorderSide(color: AppColors.border)),
        ),
        child: SafeArea(
          top: false,
          child: GestureDetector(
            onTap: () => openWhatsApp(
              context,
              company.whatsappLink.isNotEmpty
                  ? company.whatsappLink
                  : company.whatsapp,
            ),
            child: Container(
              constraints: const BoxConstraints.tightFor(height: 50),
              padding: const EdgeInsets.symmetric(vertical: 14),
              alignment: Alignment.center,
              decoration: BoxDecoration(
                gradient: AppColors.goldGradient,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: const [
                  Icon(Icons.chat, color: Color(0xFF1A1500), size: 18),
                  SizedBox(width: 8),
                  Text(
                    'تواصل مع الشركة عبر واتساب',
                    style: TextStyle(
                      color: Color(0xFF1A1500),
                      fontWeight: FontWeight.w800,
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
      },
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  const _FilterChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: selected ? AppColors.gold : AppColors.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
              color: selected ? AppColors.gold : AppColors.border),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w700,
            color: selected
                ? const Color(0xFF1A1500)
                : AppColors.textSecondary,
          ),
        ),
      ),
    );
  }
}
