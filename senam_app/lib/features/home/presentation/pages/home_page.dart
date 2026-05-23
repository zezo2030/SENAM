import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/di/injection_container.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/app_widgets.dart';
import '../../../account/presentation/pages/notifications_page.dart';
import '../../../banners/domain/entities/banner.dart' as domain;
import '../../../offers/domain/entities/offer.dart';
import '../../../services/domain/entities/company.dart';
import '../../../services/domain/entities/service_category.dart';
import '../../../services/presentation/pages/category_page.dart';
import '../../../services/presentation/pages/company_details_page.dart';
import '../cubit/home_cubit.dart';

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => sl<HomeCubit>()..load(),
      child: const _HomeView(),
    );
  }
}

/// مشاريع منزلية — محتوى ثابت تزييني للواجهة.
class _HomeProject {
  final String name;
  final String imagePath;
  const _HomeProject(this.name, this.imagePath);
}

const _homeProjects = [
  _HomeProject('صبغ', 'assets/images/home/project_paint.png'),
  _HomeProject('جبس بورد', 'assets/images/home/project_gypsum.png'),
  _HomeProject('مطابخ', 'assets/images/home/project_kitchen.png'),
  _HomeProject('ترميم', 'assets/images/home/project_restoration.png'),
  _HomeProject('أرضيات', 'assets/images/home/project_flooring.png'),
  _HomeProject('تنسيق حدائق', 'assets/images/home/project_landscaping.png'),
  _HomeProject('مظلات وسواتر', 'assets/images/home/project_pergola.png'),
  _HomeProject('تشطيب داخلي', 'assets/images/home/project_finishing.png'),
];

class _HomeView extends StatelessWidget {
  const _HomeView();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: BlocBuilder<HomeCubit, HomeState>(
          builder: (context, state) {
            if (state.status == HomeStatus.loading ||
                state.status == HomeStatus.initial) {
              return const LoadingView();
            }
            if (state.status == HomeStatus.failure) {
              return ErrorView(
                message: state.errorMessage ?? 'تعذّر تحميل البيانات',
                onRetry: () => context.read<HomeCubit>().load(),
              );
            }
            return ListView(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
              children: [
                const _TopBar(),
                const SizedBox(height: 16),
                _PromoBanner(banners: state.banners),
                const SizedBox(height: 22),
                SectionHeader(title: 'خدمات سريعة', onSeeAll: () {}),
                const SizedBox(height: 12),
                _QuickServices(categories: state.categories),
                const SizedBox(height: 22),
                SectionHeader(title: 'مشاريع منزلية', onSeeAll: () {}),
                const SizedBox(height: 12),
                const _HomeProjectsGrid(),
                const SizedBox(height: 22),
                SectionHeader(title: 'شركات موثوقة', onSeeAll: () {}),
                const SizedBox(height: 12),
                _TrustedCompanies(
                  companies: state.trustedCompanies,
                  categories: state.categories,
                ),
                const SizedBox(height: 22),
                if (state.offers.isNotEmpty)
                  _OfferBanner(offer: state.offers.first),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _TopBar extends StatelessWidget {
  const _TopBar();

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        CircleIconButton(
          icon: Icons.notifications_outlined,
          badgeCount: 3,
          onTap: () => Navigator.push(
            context,
            MaterialPageRoute(
                builder: (_) => const NotificationsPage()),
          ),
        ),
        const Spacer(),
        const SenamLogo(fontSize: 20),
        const Spacer(),
        Row(
          children: const [
            Icon(Icons.keyboard_arrow_down,
                color: AppColors.textSecondary, size: 18),
            Text('الدوحة',
                style: TextStyle(
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.w600)),
            SizedBox(width: 4),
            Icon(Icons.location_on, color: AppColors.gold, size: 18),
          ],
        ),
      ],
    );
  }
}

class _PromoBanner extends StatefulWidget {
  final List<domain.Banner> banners;
  const _PromoBanner({required this.banners});

  @override
  State<_PromoBanner> createState() => _PromoBannerState();
}

class _PromoSlide {
  final String? imageUrl;
  final String? imageAsset;

  const _PromoSlide({this.imageUrl, this.imageAsset});
}

class _PromoBannerState extends State<_PromoBanner> {
  final _controller = PageController();
  int _page = 0;

  static const _fallbackSlides = <_PromoSlide>[
    _PromoSlide(imageAsset: 'assets/images/home/promo_car_premium.png'),
    _PromoSlide(imageAsset: 'assets/images/home/promo_wash_premium.png'),
    _PromoSlide(imageAsset: 'assets/images/home/promo_home_premium.png'),
  ];

  List<_PromoSlide> get _slides {
    if (widget.banners.isEmpty) return _fallbackSlides;
    return widget.banners
        .map((b) => _PromoSlide(imageUrl: b.imageUrl))
        .toList(growable: false);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final slides = _slides;
    return Stack(
      children: [
        SizedBox(
          height: 180,
          child: PageView.builder(
            controller: _controller,
            itemCount: slides.length,
            onPageChanged: (i) => setState(() => _page = i),
            itemBuilder: (_, i) {
              final s = slides[i];
              return Container(
                margin: const EdgeInsets.symmetric(horizontal: 2),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(20),
                  child: s.imageUrl != null
                      ? Image.network(
                          s.imageUrl!,
                          fit: BoxFit.cover,
                          errorBuilder: (c, e, st) => const SizedBox(),
                        )
                      : Image.asset(
                          s.imageAsset!,
                          fit: BoxFit.cover,
                          errorBuilder: (c, e, st) => const SizedBox(),
                        ),
                ),
              );
            },
          ),
        ),
        Positioned(
          bottom: 12,
          left: 0,
          right: 0,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(slides.length, (i) {
              final active = i == _page;
              return AnimatedContainer(
                duration: const Duration(milliseconds: 250),
                margin: const EdgeInsets.symmetric(horizontal: 3),
                width: active ? 16 : 6,
                height: 6,
                decoration: BoxDecoration(
                  color: active ? AppColors.gold : Colors.grey.withValues(alpha: 0.5),
                  borderRadius: BorderRadius.circular(3),
                ),
              );
            }),
          ),
        ),
      ],
    );
  }
}

class _QuickServices extends StatelessWidget {
  final List<ServiceCategory> categories;
  const _QuickServices({required this.categories});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 104,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        itemCount: categories.length,
        separatorBuilder: (_, _) => const SizedBox(width: 12),
        itemBuilder: (_, i) {
          final cat = categories[i];
          return GestureDetector(
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(
                  builder: (_) => CategoryPage(category: cat)),
            ),
            child: SizedBox(
              width: 72,
              child: Column(
                children: [
                  Container(
                    width: 72,
                    height: 72,
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Icon(cat.icon,
                        color: AppColors.gold, size: 28),
                  ),
                  const SizedBox(height: 7),
                  Text(cat.name,
                      textAlign: TextAlign.center,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                          fontSize: 11,
                          color: AppColors.textSecondary)),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

class _HomeProjectsGrid extends StatelessWidget {
  const _HomeProjectsGrid();

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 4,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 0.92,
      children: _homeProjects.map((p) {
        return ClipRRect(
          borderRadius: BorderRadius.circular(14),
          child: Stack(
            fit: StackFit.expand,
            children: [
              Image.asset(
                p.imagePath,
                fit: BoxFit.cover,
                errorBuilder: (c, e, s) => const DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [Color(0xFF353026), Color(0xFF18160F)],
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                    ),
                  ),
                ),
              ),
              Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      Colors.transparent,
                      Colors.black.withValues(alpha: 0.85),
                    ],
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                  ),
                ),
              ),
              Align(
                alignment: Alignment.bottomCenter,
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 5),
                  child: Text(p.name,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textPrimary)),
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }
}

class _TrustedCompanies extends StatelessWidget {
  final List<Company> companies;
  final List<ServiceCategory> categories;
  const _TrustedCompanies(
      {required this.companies, required this.categories});

  String _categoryName(String id) {
    for (final c in categories) {
      if (c.id == id) return c.name;
    }
    return 'خدمات';
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 210,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: companies.length,
        separatorBuilder: (_, _) => const SizedBox(width: 10),
        itemBuilder: (_, i) => _TrustedCompanyCard(
          company: companies[i],
          categoryName: _categoryName(companies[i].categoryId),
        ),
      ),
    );
  }
}

class _TrustedCompanyCard extends StatelessWidget {
  final Company company;
  final String categoryName;
  const _TrustedCompanyCard(
      {required this.company, required this.categoryName});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(
            builder: (_) => CompanyDetailsPage(company: company)),
      ),
      child: Container(
        width: 150,
        height: double.infinity,
        padding: const EdgeInsets.fromLTRB(12, 12, 12, 12),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Align(
              alignment: Alignment.centerLeft,
              child: TagPill(
                  text: 'موثوق',
                  icon: Icons.verified,
                  color: AppColors.gold),
            ),
            const SizedBox(height: 6),
            Expanded(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CompanyLogo(
                      label: company.logoLabel,
                      color: company.logoColor,
                      size: 44),
                  const SizedBox(height: 8),
                  Text(company.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 14,
                          color: AppColors.textPrimary)),
                  const SizedBox(height: 4),
                  RatingBadge(
                      rating: company.rating, count: company.reviewsCount),
                ],
              ),
            ),
            const Divider(height: 1, color: AppColors.border),
            const SizedBox(height: 6),
            Text(categoryName,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                    fontSize: 11, color: AppColors.textSecondary)),
            const SizedBox(height: 2),
            Text('بدء من ${company.startPrice} ر.ق',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                    color: AppColors.gold,
                    fontWeight: FontWeight.w700,
                    fontSize: 12)),
          ],
        ),
      ),
    );
  }
}

class _OfferBanner extends StatelessWidget {
  final Offer offer;
  const _OfferBanner({required this.offer});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: const LinearGradient(
          colors: [Color(0xFF2A2418), Color(0xFF161410)],
          begin: Alignment.centerRight,
          end: Alignment.centerLeft,
        ),
        border: Border.all(color: AppColors.gold.withValues(alpha: 0.4)),
      ),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(18),
            child: Image.asset(
              'assets/images/home/special_offer.png',
              width: 72,
              height: 72,
              fit: BoxFit.cover,
              errorBuilder: (c, e, s) => Container(
                width: 72,
                height: 72,
                color: AppColors.gold.withValues(alpha: 0.15),
                child: const Icon(Icons.card_giftcard,
                    color: AppColors.gold, size: 40),
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(offer.title,
                    style: const TextStyle(
                        fontWeight: FontWeight.w900,
                        fontSize: 17,
                        color: AppColors.gold)),
                const SizedBox(height: 4),
                Text(offer.subtitle,
                    style: const TextStyle(
                        fontSize: 13,
                        color: AppColors.textPrimary)),
                const SizedBox(height: 10),
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 16, vertical: 7),
                  decoration: BoxDecoration(
                    gradient: AppColors.goldGradient,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text('استخدم الكود: ${offer.code}',
                      style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF1A1500))),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
