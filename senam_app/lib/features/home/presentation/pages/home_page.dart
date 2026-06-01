import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/config/media_url.dart';
import '../../../../core/di/injection_container.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/app_widgets.dart';
import '../../../account/presentation/pages/notifications_page.dart';
import '../../../banners/domain/entities/banner.dart' as domain;
import '../../../services/domain/entities/company.dart';
import '../../../services/domain/entities/service_category.dart';
import '../../../provider_application/presentation/pages/provider_application_page.dart';
import '../../../services/presentation/pages/category_page.dart';
import '../../../services/presentation/pages/company_details_page.dart';
import '../../../services/presentation/pages/how_senam_works_page.dart';
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
              padding: const EdgeInsets.fromLTRB(16, 10, 16, 24),
              children: [
                const _TopBar(),
                const SizedBox(height: 18),
                _HeroBanner(banners: state.banners),
                const SizedBox(height: 22),
                const _SectionHeader(
                  title: 'التصنيفات الرئيسية',
                ),
                const SizedBox(height: 14),
                _CategoriesGrid(categories: state.categories),
                const SizedBox(height: 22),
                _SectionHeader(
                  title: 'شركات مميزة',
                  onSeeAll: () {},
                ),
                const SizedBox(height: 12),
                _FeaturedCompanies(companies: state.trustedCompanies),
                const SizedBox(height: 24),
                const _JoinAsProviderCard(),
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
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        GestureDetector(
          onTap: () => Navigator.push(
            context,
            MaterialPageRoute(
                builder: (_) => const NotificationsPage()),
          ),
          child: const Icon(Icons.notifications_outlined,
              color: AppColors.textPrimary, size: 26),
        ),
        const Spacer(),
        Column(
          mainAxisSize: MainAxisSize.min,
          children: const [
            SenamLogo(fontSize: 20),
            SizedBox(height: 2),
            Text(
              'كل الخدمات. بنقة واحدة',
              style: TextStyle(
                color: AppColors.textSecondary,
                fontSize: 10,
              ),
            ),
          ],
        ),
        const Spacer(),
        Row(
          mainAxisSize: MainAxisSize.min,
          children: const [
            Text('الدوحة',
                style: TextStyle(
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.w600,
                    fontSize: 13)),
            SizedBox(width: 4),
            Icon(Icons.location_on, color: AppColors.gold, size: 18),
          ],
        ),
      ],
    );
  }
}

/// بانر الهيرو — يستقبل البيانات من الباك (`GET /v1/banners`).
/// لو ما وصلت بيانات يعرض شريحة افتراضية ثابتة بنفس التصميم.
class _HeroBanner extends StatefulWidget {
  final List<domain.Banner> banners;
  const _HeroBanner({required this.banners});

  @override
  State<_HeroBanner> createState() => _HeroBannerState();
}

class _HeroBannerState extends State<_HeroBanner> {
  final _controller = PageController();
  int _page = 0;

  static const _fallback = <_HeroSlide>[
    _HeroSlide(
      titleAr: 'خدمات منزلية',
      highlightAr: 'تجربة أسهل',
      subtitleAr: 'شركات موثوقة. تصاميم مميزة',
      imageAsset: 'assets/images/home/promo_home_premium.png',
    ),
  ];

  List<_HeroSlide> get _slides {
    if (widget.banners.isEmpty) return _fallback;
    return widget.banners
        .map(
          (b) => _HeroSlide(
            titleAr: b.titleAr,
            highlightAr: '',
            subtitleAr: b.subtitleAr ?? '',
            imageUrl: b.imageUrl,
          ),
        )
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
    return SizedBox(
      height: 150,
      child: Stack(
        children: [
          PageView.builder(
            controller: _controller,
            itemCount: slides.length,
            onPageChanged: (i) => setState(() => _page = i),
            itemBuilder: (_, i) => _HeroSlideView(slide: slides[i]),
          ),
          if (slides.length > 1)
            Positioned(
              bottom: 8,
              left: 0,
              right: 0,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(slides.length, (i) {
                  final active = i == _page;
                  return AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    margin: const EdgeInsets.symmetric(horizontal: 3),
                    width: active ? 16 : 6,
                    height: 6,
                    decoration: BoxDecoration(
                      color: active
                          ? AppColors.gold
                          : Colors.white.withValues(alpha: 0.35),
                      borderRadius: BorderRadius.circular(3),
                    ),
                  );
                }),
              ),
            ),
        ],
      ),
    );
  }
}

class _HeroSlide {
  final String titleAr;
  final String highlightAr;
  final String subtitleAr;
  final String? imageUrl;
  final String? imageAsset;
  const _HeroSlide({
    required this.titleAr,
    required this.highlightAr,
    required this.subtitleAr,
    this.imageUrl,
    this.imageAsset,
  });
}

class _HeroSlideView extends StatelessWidget {
  final _HeroSlide slide;
  const _HeroSlideView({required this.slide});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => const HowSenamWorksPage()),
      ),
      child: Container(
        clipBehavior: Clip.antiAlias,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: AppColors.gold.withValues(alpha: 0.35)),
        ),
        child: Stack(
          fit: StackFit.expand,
          children: [
            _image(),
            DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    AppColors.background.withValues(alpha: 0.92),
                    AppColors.background.withValues(alpha: 0.0),
                  ],
                  begin: Alignment.centerRight,
                  end: Alignment.centerLeft,
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(18, 16, 18, 18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  if (slide.titleAr.isNotEmpty)
                    Text(
                      slide.titleAr,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  if (slide.highlightAr.isNotEmpty) ...[
                    const SizedBox(height: 2),
                    ShaderMask(
                      shaderCallback: (r) =>
                          AppColors.goldGradient.createShader(r),
                      child: Text(
                        slide.highlightAr,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 24,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ),
                  ],
                  if (slide.subtitleAr.isNotEmpty) ...[
                    const SizedBox(height: 6),
                    Text(
                      slide.subtitleAr,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      textAlign: TextAlign.start,
                      style: const TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 11,
                        height: 1.4,
                      ),
                    ),
                  ],
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      gradient: AppColors.goldGradient,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: const [
                        Icon(Icons.arrow_back,
                            size: 14, color: Color(0xFF1A1500)),
                        SizedBox(width: 6),
                        Text(
                          'استكشف الآن',
                          style: TextStyle(
                            color: Color(0xFF1A1500),
                            fontWeight: FontWeight.w800,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _image() {
    Widget fallback() => Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF2A2418), Color(0xFF161410)],
              begin: Alignment.centerRight,
              end: Alignment.centerLeft,
            ),
          ),
        );
    if (slide.imageUrl != null && slide.imageUrl!.isNotEmpty) {
      return CachedNetworkImage(
        imageUrl: resolveMediaUrl(slide.imageUrl!),
        fit: BoxFit.cover,
        errorWidget: (c, e, s) => fallback(),
        placeholder: (c, url) => fallback(),
      );
    }
    if (slide.imageAsset != null) {
      return Image.asset(
        slide.imageAsset!,
        fit: BoxFit.cover,
        errorBuilder: (c, e, s) => fallback(),
      );
    }
    return fallback();
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  final VoidCallback? onSeeAll;
  const _SectionHeader({required this.title, this.onSeeAll});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Text(
          title,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w800,
            color: AppColors.textPrimary,
          ),
        ),
        const Spacer(),
        if (onSeeAll != null)
          GestureDetector(
            onTap: onSeeAll,
            child: const Text(
              'عرض الكل',
              style: TextStyle(color: AppColors.gold, fontSize: 12),
            ),
          ),
      ],
    );
  }
}

class _CategoriesGrid extends StatelessWidget {
  final List<ServiceCategory> categories;
  const _CategoriesGrid({required this.categories});

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: categories.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 4,
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        childAspectRatio: 0.78,
      ),
      itemBuilder: (_, i) {
        final cat = categories[i];
        // الكارت الثالث (مشاريع منزلية) يظهر بحدّ ذهبي للتميّز
        final highlighted = cat.id == 'home_projects';
        return _CategoryCard(category: cat, highlighted: highlighted);
      },
    );
  }
}

class _CategoryCard extends StatelessWidget {
  final ServiceCategory category;
  final bool highlighted;
  const _CategoryCard({
    required this.category,
    this.highlighted = false,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => CategoryPage(category: category)),
      ),
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: highlighted ? AppColors.gold : AppColors.border,
            width: highlighted ? 1.4 : 1,
          ),
          boxShadow: highlighted
              ? [
                  BoxShadow(
                    color: AppColors.gold.withValues(alpha: 0.25),
                    blurRadius: 14,
                    offset: const Offset(0, 4),
                  ),
                ]
              : null,
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(category.icon,
                color: AppColors.gold, size: 30),
            const SizedBox(height: 8),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: Text(
                category.name,
                maxLines: 2,
                overflow: TextOverflow.visible,
                softWrap: true,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: AppColors.textPrimary,
                  fontWeight: FontWeight.w700,
                  fontSize: 12,
                  height: 1.2,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FeaturedCompanies extends StatelessWidget {
  final List<Company> companies;
  const _FeaturedCompanies({required this.companies});

  @override
  Widget build(BuildContext context) {
    if (companies.isEmpty) return const SizedBox.shrink();
    return SizedBox(
      height: 190,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        itemCount: companies.length,
        separatorBuilder: (_, _) => const SizedBox(width: 10),
        itemBuilder: (_, i) => _FeaturedCard(company: companies[i]),
      ),
    );
  }
}

class _FeaturedCard extends StatelessWidget {
  final Company company;
  const _FeaturedCard({required this.company});

  @override
  Widget build(BuildContext context) {
    final logoUrl = resolveMediaUrl(company.logoUrl);
    final coverUrl = resolveMediaUrl(company.coverPhoto);

    return GestureDetector(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(
            builder: (_) => CompanyDetailsPage(company: company)),
      ),
      child: Container(
        width: 150,
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Stack(
              children: [
                ClipRRect(
                  borderRadius: const BorderRadius.vertical(
                      top: Radius.circular(16)),
                  child: Container(
                    height: 100,
                    color: AppColors.surfaceLight,
                    child: coverUrl.isNotEmpty
                        ? CachedNetworkImage(
                            imageUrl: coverUrl,
                            width: double.infinity,
                            height: 100,
                            fit: BoxFit.cover,
                            errorWidget: (c, e, s) =>
                                _coverFallback(),
                            placeholder: (c, url) =>
                                _coverFallback(),
                          )
                        : _coverFallback(),
                  ),
                ),
                Positioned.fill(
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.black.withValues(alpha: 0.08),
                          Colors.black.withValues(alpha: 0.22),
                        ],
                      ),
                    ),
                  ),
                ),
                Positioned.fill(
                  child: Center(
                    child: _companyLogo(logoUrl),
                  ),
                ),
                PositionedDirectional(
                  top: 6,
                  start: 6,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 6, vertical: 3),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.6),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.star_rounded,
                            color: AppColors.gold, size: 12),
                        const SizedBox(width: 2),
                        Text(
                          company.rating.toStringAsFixed(1),
                          style: const TextStyle(
                            color: AppColors.textPrimary,
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(10, 8, 10, 10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    company.name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w800,
                      fontSize: 13,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    company.description,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: AppColors.textSecondary,
                      fontSize: 10,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(Icons.location_on_outlined,
                          color: AppColors.textMuted, size: 11),
                      const SizedBox(width: 2),
                      Text(
                        company.city,
                        style: const TextStyle(
                          color: AppColors.textMuted,
                          fontSize: 10,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _companyLogo(String logoUrl) {
    const size = 58.0;
    return Container(
      width: size,
      height: size,
      padding: const EdgeInsets.all(3),
      decoration: BoxDecoration(
        color: AppColors.surface.withValues(alpha: 0.88),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: Colors.white.withValues(alpha: 0.12),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.22),
            blurRadius: 12,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(13),
        child: logoUrl.isNotEmpty
            ? CachedNetworkImage(
                imageUrl: logoUrl,
                width: size,
                height: size,
                fit: BoxFit.cover,
                errorWidget: (c, e, s) => _logoFallback(),
                placeholder: (c, url) => _logoFallback(),
              )
            : _logoFallback(),
      ),
    );
  }

  Widget _coverFallback() => Container(
        color: AppColors.surfaceLight,
      );

  Widget _logoFallback() => CompanyLogo(
        label: company.logoLabel,
        color: company.logoColor,
        size: 52,
      );
}

/// كارد دعوة الشركات للانضمام كمزوّد خدمة — يظهر أسفل الصفحة الرئيسية.
class _JoinAsProviderCard extends StatelessWidget {
  const _JoinAsProviderCard();

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => const ProviderApplicationPage()),
      ),
      child: Container(
        clipBehavior: Clip.antiAlias,
        decoration: BoxDecoration(
          gradient: AppColors.cardGradient,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppColors.gold.withValues(alpha: 0.35)),
          boxShadow: [
            BoxShadow(
              color: AppColors.gold.withValues(alpha: 0.12),
              blurRadius: 18,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Stack(
          children: [
            // وهج ذهبي خفيف في الزاوية
            PositionedDirectional(
              top: -30,
              end: -30,
              child: Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      AppColors.gold.withValues(alpha: 0.18),
                      AppColors.gold.withValues(alpha: 0.0),
                    ],
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(18),
              child: Row(
                children: [
                  Container(
                    width: 54,
                    height: 54,
                    decoration: BoxDecoration(
                      gradient: AppColors.goldGradient,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.gold.withValues(alpha: 0.35),
                          blurRadius: 12,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.storefront_rounded,
                      color: Color(0xFF1A1500),
                      size: 28,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'هل تملك شركة خدمات؟',
                          style: TextStyle(
                            color: AppColors.textPrimary,
                            fontSize: 15,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'انضمّ إلى سِنام وقدّم خدماتك لآلاف العملاء',
                          style: TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 11.5,
                            height: 1.4,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 14, vertical: 8),
                          decoration: BoxDecoration(
                            gradient: AppColors.goldGradient,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: const [
                              Text(
                                'قدّم الآن',
                                style: TextStyle(
                                  color: Color(0xFF1A1500),
                                  fontWeight: FontWeight.w800,
                                  fontSize: 12,
                                ),
                              ),
                              SizedBox(width: 6),
                              Icon(Icons.arrow_back,
                                  size: 14, color: Color(0xFF1A1500)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
