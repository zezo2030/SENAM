import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/auth/token_storage.dart';
import '../../../../core/di/injection_container.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/app_widgets.dart';
import '../../../auth/presentation/pages/login_page.dart';
import '../../domain/entities/company.dart';
import '../../domain/entities/review.dart';
import '../cubit/company_details_cubit.dart';
import '../widgets/company_list_card.dart';

Future<bool?> openCompanyReviewFlow(
  BuildContext context,
  Company company, {
  CompanyDetailsCubit? cubit,
}) async {
  final loggedIn = await sl<TokenStorage>().hasRefresh();
  if (!context.mounted) return false;
  if (!loggedIn) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('سجّل الدخول أولاً لتقييم الشركة')),
    );
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const LoginPage()),
    );
    return false;
  }

  final submitted = await showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    backgroundColor: AppColors.surface,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
    ),
    builder: (_) {
      final child = _ReviewSheet(company: company);
      if (cubit != null) {
        return BlocProvider.value(value: cubit, child: child);
      }
      return BlocProvider(
        create: (_) => sl<CompanyDetailsCubit>(),
        child: child,
      );
    },
  );
  if (submitted == true && context.mounted) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('تم إرسال تقييمك بنجاح')),
    );
  }
  return submitted;
}

/// صفحة "تقييمات العملاء" — ملخّص النجوم + قائمة التقييمات + زر واتساب.
class CompanyReviewsPage extends StatelessWidget {
  final Company company;
  const CompanyReviewsPage({super.key, required this.company});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) =>
          sl<CompanyDetailsCubit>()..loadReviews(company.id),
      child: _ReviewsView(company: company),
    );
  }
}

class _ReviewsView extends StatelessWidget {
  final Company company;
  const _ReviewsView({required this.company});

  Future<void> _openReviewFlow(BuildContext context) async {
    await openCompanyReviewFlow(
      context,
      company,
      cubit: context.read<CompanyDetailsCubit>(),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('تقييمات العملاء'),
        centerTitle: true,
      ),
      body: BlocBuilder<CompanyDetailsCubit, CompanyDetailsState>(
        builder: (context, state) {
          return ListView(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
            children: [
              if (company.reviewsCount > 0) ...[
                _SummaryCard(company: company),
                const SizedBox(height: 14),
              ],
              if (state.status == CompanyDetailsStatus.loading ||
                  state.status == CompanyDetailsStatus.initial)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 24),
                  child: LoadingView(),
                )
              else if (state.status == CompanyDetailsStatus.failure)
                ErrorView(
                  message:
                      state.errorMessage ?? 'تعذّر تحميل التقييمات',
                  onRetry: () => context
                      .read<CompanyDetailsCubit>()
                      .loadReviews(company.id),
                )
              else if (state.reviews.isEmpty)
                const EmptyView(message: 'لا توجد تقييمات بعد')
              else
                ...state.reviews.map((r) => Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: _ReviewCard(review: r),
                    )),
            ],
          );
        },
      ),
      bottomNavigationBar: SafeArea(
        top: false,
        child: Container(
          height: 74,
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 10),
          decoration: const BoxDecoration(
            color: AppColors.surface,
            border: Border(top: BorderSide(color: AppColors.border)),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Expanded(
                child: WhatsAppButton(
                  phone: company.whatsapp,
                  expanded: true,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  fontSize: 14,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: GestureDetector(
                  onTap: () => _openReviewFlow(context),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      gradient: AppColors.goldGradient,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Text(
                      'قيّم الشركة',
                      style: TextStyle(
                        color: Color(0xFF1A1500),
                        fontWeight: FontWeight.w800,
                        fontSize: 14,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ReviewSheet extends StatefulWidget {
  final Company company;
  const _ReviewSheet({required this.company});

  @override
  State<_ReviewSheet> createState() => _ReviewSheetState();
}

class _ReviewSheetState extends State<_ReviewSheet> {
  final _commentController = TextEditingController();
  int _rating = 5;

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  Future<void> _submit(BuildContext context) async {
    final ok = await context.read<CompanyDetailsCubit>().submitReview(
          companyId: widget.company.id,
          rating: _rating,
          comment: _commentController.text.trim(),
        );
    if (ok && context.mounted) {
      Navigator.pop(context, true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;
    return Padding(
      padding: EdgeInsets.fromLTRB(18, 18, 18, 18 + bottomInset),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Center(
            child: Container(
              width: 42,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.border,
                borderRadius: BorderRadius.circular(999),
              ),
            ),
          ),
          const SizedBox(height: 18),
          Text(
            'قيّم ${widget.company.name}',
            textAlign: TextAlign.right,
            style: const TextStyle(
              color: AppColors.textPrimary,
              fontWeight: FontWeight.w900,
              fontSize: 18,
            ),
          ),
          const SizedBox(height: 14),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(5, (i) {
              final value = i + 1;
              final active = value <= _rating;
              return IconButton(
                onPressed: () => setState(() => _rating = value),
                icon: Icon(
                  active ? Icons.star_rounded : Icons.star_border_rounded,
                  color: AppColors.gold,
                  size: 34,
                ),
              );
            }),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _commentController,
            minLines: 3,
            maxLines: 5,
            textAlign: TextAlign.right,
            style: const TextStyle(color: AppColors.textPrimary),
            decoration: InputDecoration(
              hintText: 'اكتب تجربتك مع الشركة...',
              hintStyle: const TextStyle(color: AppColors.textMuted),
              filled: true,
              fillColor: AppColors.surfaceLight,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: const BorderSide(color: AppColors.border),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: const BorderSide(color: AppColors.border),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: const BorderSide(color: AppColors.gold),
              ),
            ),
          ),
          const SizedBox(height: 14),
          BlocBuilder<CompanyDetailsCubit, CompanyDetailsState>(
            builder: (context, state) {
              if (state.submitErrorMessage != null) {
                return Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Text(
                    state.submitErrorMessage!,
                    textAlign: TextAlign.right,
                    style: const TextStyle(
                      color: AppColors.error,
                      fontSize: 12,
                    ),
                  ),
                );
              }
              return const SizedBox.shrink();
            },
          ),
          BlocBuilder<CompanyDetailsCubit, CompanyDetailsState>(
            builder: (context, state) {
              return GestureDetector(
                onTap: state.submittingReview ? null : () => _submit(context),
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    gradient: AppColors.goldGradient,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: state.submittingReview
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Color(0xFF1A1500),
                          ),
                        )
                      : const Text(
                          'إرسال التقييم',
                          style: TextStyle(
                            color: Color(0xFF1A1500),
                            fontWeight: FontWeight.w900,
                            fontSize: 14,
                          ),
                        ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}

class _SummaryCard extends StatelessWidget {
  final Company company;
  const _SummaryCard({required this.company});

  @override
  Widget build(BuildContext context) {
    final breakdown = company.ratingBreakdown.isNotEmpty
        ? company.ratingBreakdown
        : const {5: 1050, 4: 150, 3: 30, 2: 10, 1: 10};
    final total = breakdown.values.fold<int>(0, (a, b) => a + b);
    return GradientCard(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Expanded(
            flex: 2,
            child: Column(
              children: [
                for (final star in [5, 4, 3, 2, 1])
                  _Bar(
                    star: star,
                    value: breakdown[star] ?? 0,
                    total: total == 0 ? 1 : total,
                  ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                company.rating.toStringAsFixed(1),
                style: const TextStyle(
                  fontSize: 44,
                  fontWeight: FontWeight.w900,
                  color: AppColors.gold,
                ),
              ),
              Row(
                children: List.generate(
                  5,
                  (i) => const Icon(Icons.star_rounded,
                      color: AppColors.gold, size: 18),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                '(${company.reviewsCount}) تقييم',
                style: const TextStyle(
                  fontSize: 11,
                  color: AppColors.textMuted,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _Bar extends StatelessWidget {
  final int star;
  final int value;
  final int total;
  const _Bar({
    required this.star,
    required this.value,
    required this.total,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        children: [
          SizedBox(
            width: 30,
            child: Text(
              '$value',
              style: const TextStyle(
                fontSize: 10,
                color: AppColors.textMuted,
              ),
              textAlign: TextAlign.left,
            ),
          ),
          Expanded(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: value / total,
                minHeight: 6,
                backgroundColor: AppColors.border,
                color: AppColors.gold,
              ),
            ),
          ),
          const SizedBox(width: 6),
          const Icon(Icons.star_rounded,
              size: 12, color: AppColors.gold),
          const SizedBox(width: 2),
          Text(
            '$star',
            style: const TextStyle(
              fontSize: 11,
              color: AppColors.textPrimary,
            ),
          ),
        ],
      ),
    );
  }
}

class _ReviewCard extends StatelessWidget {
  final Review review;
  const _ReviewCard({required this.review});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Row(
            children: [
              Row(
                children: List.generate(
                  5,
                  (i) => Icon(
                    Icons.star_rounded,
                    size: 14,
                    color: i < review.stars
                        ? AppColors.gold
                        : AppColors.border,
                  ),
                ),
              ),
              const Spacer(),
              Text(
                review.authorName,
                style: const TextStyle(
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(width: 10),
              _ReviewerAvatar(
                name: review.authorName,
                photoUrl: review.authorPhotoUrl,
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            review.comment,
            textAlign: TextAlign.right,
            style: const TextStyle(
              fontSize: 13,
              height: 1.6,
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}

/// أفاتار المقيِّم: صورته إن وُجدت، وإلا دائرة ذهبية بأول حرف من اسمه.
class _ReviewerAvatar extends StatelessWidget {
  final String name;
  final String photoUrl;
  const _ReviewerAvatar({required this.name, required this.photoUrl});

  @override
  Widget build(BuildContext context) {
    final initial = name.trim().isEmpty ? '؟' : name.trim().characters.first;
    return CircleAvatar(
      radius: 16,
      backgroundColor: AppColors.gold.withValues(alpha: 0.2),
      backgroundImage:
          photoUrl.isNotEmpty ? CachedNetworkImageProvider(photoUrl) : null,
      child: photoUrl.isNotEmpty
          ? null
          : Text(
              initial,
              style: const TextStyle(
                color: AppColors.gold,
                fontWeight: FontWeight.w700,
              ),
            ),
    );
  }
}
