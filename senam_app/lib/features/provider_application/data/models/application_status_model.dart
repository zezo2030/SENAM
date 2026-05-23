import '../../domain/entities/application_status.dart';

class CompanyApplicationStatusModel extends CompanyApplicationStatus {
  const CompanyApplicationStatusModel({
    required super.companyId,
    required super.status,
    required super.submittedAt,
    super.approvedAt,
  });

  factory CompanyApplicationStatusModel.fromJson(Map<String, dynamic> json) {
    return CompanyApplicationStatusModel(
      companyId: json['companyId']?.toString() ?? '',
      status: parseApplicationStatus(json['status']?.toString() ?? 'pending'),
      submittedAt: DateTime.tryParse(json['submittedAt']?.toString() ?? '') ??
          DateTime.now(),
      approvedAt: json['approvedAt'] == null
          ? null
          : DateTime.tryParse(json['approvedAt'].toString()),
    );
  }
}

class CompanyApplicationResultModel extends CompanyApplicationResult {
  const CompanyApplicationResultModel({
    required super.companyId,
    required super.ownerUserId,
  });

  factory CompanyApplicationResultModel.fromJson(Map<String, dynamic> json) {
    return CompanyApplicationResultModel(
      companyId: json['companyId']?.toString() ?? '',
      ownerUserId: json['ownerUserId']?.toString() ?? '',
    );
  }
}
