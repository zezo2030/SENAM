import 'package:equatable/equatable.dart';

enum ApplicationStatus { pending, active, suspended }

ApplicationStatus parseApplicationStatus(String raw) {
  switch (raw) {
    case 'active':
      return ApplicationStatus.active;
    case 'suspended':
      return ApplicationStatus.suspended;
    case 'pending':
    default:
      return ApplicationStatus.pending;
  }
}

class CompanyApplicationStatus extends Equatable {
  final String companyId;
  final ApplicationStatus status;
  final DateTime submittedAt;
  final DateTime? approvedAt;

  const CompanyApplicationStatus({
    required this.companyId,
    required this.status,
    required this.submittedAt,
    this.approvedAt,
  });

  @override
  List<Object?> get props => [companyId, status, submittedAt, approvedAt];
}

class CompanyApplicationResult extends Equatable {
  final String companyId;
  final String ownerUserId;

  const CompanyApplicationResult({
    required this.companyId,
    required this.ownerUserId,
  });

  @override
  List<Object?> get props => [companyId, ownerUserId];
}
