import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:senam_app/features/booking/presentation/pages/booking_page.dart';
import '../../../../core/di/injection_container.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/app_widgets.dart';
import '../../domain/entities/company.dart';
import '../../domain/entities/company_service.dart';
import '../../domain/entities/review.dart';
import '../cubit/company_details_cubit.dart';

/// صفحة تفاصيل الشركة.
class CompanyDetailsPage extends StatelessWidget {
  final Company company;
  const CompanyDetailsPage({super.key, required this.company});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => sl<CompanyDetailsCubit>()..loadReviews(company.id),
      child: _CompanyDetailsView(company: company),
    );
  }
}

class _CompanyDetailsView extends StatefulWidget {
  final Company company;
  const _CompanyDetailsView({required this.company});

  @override
  State<_CompanyDetailsView> createState() => _CompanyDetailsViewState();
}

class _CompanyDetailsViewState extends State<_CompanyDetailsView> {
  int _tab = 0;
  bool _fav = false;
  static const _tabs = ['الخدمات', 'المعلومات', 'التقييمات', 'الموقع'];

  Company get c => widget.company;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 210,
            pinned: true,
            backgroundColor: AppColors.background,
            actions: [
              CircleIconButton(
                icon: _fav ? Icons.favorite : Icons.favorite_border,
                onTap: () => setState(() => _fav = !_fav),
              ),
              const SizedBox(width: 8),
              const CircleIconButton(icon: Icons.share_outlined),
              const SizedBox(width: 8),
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      c.logoColor.withValues(alpha: 0.5),
                      AppColors.background,
                    ],
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                  ),
                ),
                child: Center(
                  child: Icon(Icons.directions_car,
                      size: 90,
                      color: Colors.white.withValues(alpha: 0.2)),
                ),
              ),
            ),
          ),
          SliverToBoxAdapter(child: _header()),
          SliverToBoxAdapter(child: _tabBar()),
          SliverToBoxAdapter(child: _tabContent()),
          const SliverToBoxAdapter(child: SizedBox(height: 90)),
        ],
      ),
      bottomNavigationBar: _bookBar(),
    );
  }

  Widget _header() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          CompanyLogo(label: c.logoLabel, color: c.logoColor, size: 60),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(c.name,
                        style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                            color: AppColors.textPrimary)),
                    const SizedBox(width: 6),
                    const Icon(Icons.verified,
                        color: AppColors.gold, size: 16),
                  ],
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    RatingBadge(
                        rating: c.rating, count: c.reviewsCount),
                    const SizedBox(width: 10),
                    const TagPill(
                        text: 'مفتوح الآن',
                        color: AppColors.success,
                        icon: Icons.circle),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _tabBar() {
    return SizedBox(
      height: 44,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: _tabs.length,
        separatorBuilder: (context, index) => const SizedBox(width: 8),
        itemBuilder: (_, i) {
          final selected = i == _tab;
          return GestureDetector(
            onTap: () => setState(() => _tab = i),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 18),
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: selected ? AppColors.gold : AppColors.surface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                    color: selected
                        ? AppColors.gold
                        : AppColors.border),
              ),
              child: Text(_tabs[i],
                  style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: selected
                          ? const Color(0xFF1A1500)
                          : AppColors.textSecondary)),
            ),
          );
        },
      ),
    );
  }

  Widget _tabContent() {
    switch (_tab) {
      case 1:
        return _infoTab();
      case 2:
        return _reviewsTab();
      case 3:
        return _locationTab();
      default:
        return _servicesTab();
    }
  }

  Widget _servicesTab() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          GradientCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('نبذة عن الشركة',
                    style: TextStyle(
                        fontWeight: FontWeight.w800,
                        color: AppColors.textPrimary)),
                const SizedBox(height: 8),
                Text(c.description,
                    style: const TextStyle(
                        fontSize: 13,
                        height: 1.7,
                        color: AppColors.textSecondary)),
              ],
            ),
          ),
          const SizedBox(height: 16),
          const Align(
            alignment: Alignment.centerRight,
            child: Text('الخدمات والأسعار',
                style: TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 15,
                    color: AppColors.textPrimary)),
          ),
          const SizedBox(height: 10),
          ...c.services.map((s) => _serviceRow(s)),
        ],
      ),
    );
  }

  Widget _serviceRow(CompanyService s) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: AppColors.gold.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.local_car_wash,
                color: AppColors.gold, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(s.name,
                    style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 14,
                        color: AppColors.textPrimary)),
                const SizedBox(height: 3),
                Text('المدة: ${s.duration}',
                    style: const TextStyle(
                        fontSize: 11, color: AppColors.textMuted)),
              ],
            ),
          ),
          Text('${s.price} ر.ق',
              style: const TextStyle(
                  color: AppColors.gold,
                  fontWeight: FontWeight.w800,
                  fontSize: 15)),
        ],
      ),
    );
  }

  Widget _infoTab() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          _infoRow(Icons.access_time, 'ساعات العمل', c.workingHours),
          _infoRow(Icons.location_on_outlined, 'العنوان', c.address),
          _infoRow(Icons.phone_outlined, 'التواصل', '+974 4444 5555'),
          _infoRow(Icons.timer_outlined, 'مدة التنفيذ', c.durationRange),
        ],
      ),
    );
  }

  Widget _infoRow(IconData icon, String title, String value) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Icon(icon, color: AppColors.gold, size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    style: const TextStyle(
                        fontSize: 11, color: AppColors.textMuted)),
                const SizedBox(height: 3),
                Text(value,
                    style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _reviewsTab() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          GradientCard(
            child: Row(
              children: [
                Column(
                  children: [
                    Text(c.rating.toStringAsFixed(1),
                        style: const TextStyle(
                            fontSize: 36,
                            fontWeight: FontWeight.w900,
                            color: AppColors.gold)),
                    RatingBadge(rating: c.rating, iconSize: 16),
                    const SizedBox(height: 4),
                    Text('${c.reviewsCount} تقييم',
                        style: const TextStyle(
                            fontSize: 11,
                            color: AppColors.textMuted)),
                  ],
                ),
                const SizedBox(width: 20),
                Expanded(
                  child: Column(
                    children: List.generate(5, (i) {
                      final star = 5 - i;
                      final pct = [0.8, 0.6, 0.3, 0.1, 0.05][i];
                      return Padding(
                        padding: const EdgeInsets.symmetric(
                            vertical: 2),
                        child: Row(
                          children: [
                            Text('$star',
                                style: const TextStyle(
                                    fontSize: 11,
                                    color: AppColors.textMuted)),
                            const SizedBox(width: 6),
                            Expanded(
                              child: ClipRRect(
                                borderRadius:
                                    BorderRadius.circular(4),
                                child: LinearProgressIndicator(
                                  value: pct,
                                  minHeight: 6,
                                  backgroundColor:
                                      AppColors.border,
                                  color: AppColors.gold,
                                ),
                              ),
                            ),
                          ],
                        ),
                      );
                    }),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          BlocBuilder<CompanyDetailsCubit, CompanyDetailsState>(
            builder: (context, state) {
              if (state.status == CompanyDetailsStatus.loading ||
                  state.status == CompanyDetailsStatus.initial) {
                return const Padding(
                  padding: EdgeInsets.symmetric(vertical: 24),
                  child: LoadingView(),
                );
              }
              if (state.status == CompanyDetailsStatus.failure) {
                return ErrorView(
                  message:
                      state.errorMessage ?? 'تعذّر تحميل التقييمات',
                  onRetry: () => context
                      .read<CompanyDetailsCubit>()
                      .loadReviews(c.id),
                );
              }
              if (state.reviews.isEmpty) {
                return const EmptyView(
                    message: 'لا توجد تقييمات بعد');
              }
              return Column(
                children:
                    state.reviews.map((r) => _reviewCard(r)).toList(),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _reviewCard(Review r) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 16,
                backgroundColor:
                    AppColors.gold.withValues(alpha: 0.2),
                child: Text(
                    r.authorName.isEmpty ? '؟' : r.authorName[0],
                    style: const TextStyle(
                        color: AppColors.gold,
                        fontWeight: FontWeight.w700)),
              ),
              const SizedBox(width: 10),
              Text(r.authorName,
                  style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary)),
              const Spacer(),
              Row(
                children: List.generate(
                    5,
                    (i) => Icon(Icons.star_rounded,
                        size: 14,
                        color: i < r.stars
                            ? AppColors.gold
                            : AppColors.border)),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(r.comment,
              style: const TextStyle(
                  fontSize: 13,
                  height: 1.6,
                  color: AppColors.textSecondary)),
        ],
      ),
    );
  }

  Widget _locationTab() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: Container(
              height: 200,
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFF1C1F26), Color(0xFF0F0F11)],
                ),
              ),
              child: const Center(
                child: Icon(Icons.location_on,
                    color: AppColors.gold, size: 50),
              ),
            ),
          ),
          const SizedBox(height: 12),
          _infoRow(Icons.location_on_outlined, 'العنوان', c.address),
        ],
      ),
    );
  }

  Widget _bookBar() {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
      decoration: const BoxDecoration(
        color: AppColors.surface,
        border: Border(top: BorderSide(color: AppColors.border)),
      ),
      child: SafeArea(
        top: false,
        child: ElevatedButton(
          onPressed: () => Navigator.push(
            context,
            MaterialPageRoute(
                builder: (_) => BookingPage(company: c)),
          ),
          child: const Text('احجز الآن'),
        ),
      ),
    );
  }
}
