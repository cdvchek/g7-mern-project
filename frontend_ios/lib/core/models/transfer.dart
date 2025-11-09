import 'package:frontend_ios/core/models/envelope.dart';

class Transfer {
  Transfer({
    required this.id,
    required this.amount,
    required this.fromEnvelope,
    required this.toEnvelope,
    this.notes,
    this.occuredAt,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final int amount;
  final TransferEnvelopeRef fromEnvelope;
  final TransferEnvelopeRef toEnvelope;
  final String? notes;
  final DateTime? occuredAt;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  factory Transfer.fromJson(Map<String, dynamic> json) {
    return Transfer(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      amount: _asInt(json['amount']) ?? 0,
      fromEnvelope: TransferEnvelopeRef.fromDynamic(json['from_envelope_id']),
      toEnvelope: TransferEnvelopeRef.fromDynamic(json['to_envelope_id']),
      notes: json['notes'] as String?,
      occuredAt: _parseDate(json['occured_at']),
      createdAt: _parseDate(json['createdAt']),
      updatedAt: _parseDate(json['updatedAt']),
    );
  }

  static DateTime? _parseDate(dynamic value) {
    if (value is String) return DateTime.tryParse(value);
    if (value is int) {
      return DateTime.fromMillisecondsSinceEpoch(value);
    }
    return null;
  }

  static int? _asInt(dynamic value) {
    if (value == null) return null;
    if (value is int) return value;
    if (value is double) return value.toInt();
    if (value is String) return int.tryParse(value);
    return null;
  }
}

class TransferEnvelopeRef {
  const TransferEnvelopeRef({
    required this.id,
    this.name,
    this.amount,
  });

  final String id;
  final String? name;
  final int? amount;

  factory TransferEnvelopeRef.fromDynamic(dynamic data) {
    if (data is Map<String, dynamic>) {
      final id = (data['id'] ?? data['_id'] ?? '').toString();
      return TransferEnvelopeRef(
        id: id,
        name: data['name'] as String?,
        amount: Transfer._asInt(data['amount']),
      );
    }
    return TransferEnvelopeRef(id: (data ?? '').toString());
  }
}

class TransferActionResult {
  TransferActionResult({
    required this.transfer,
    required this.fromEnvelope,
    required this.toEnvelope,
    this.message,
  });

  final Transfer transfer;
  final Envelope fromEnvelope;
  final Envelope toEnvelope;
  final String? message;

  factory TransferActionResult.fromJson(Map<String, dynamic> json) {
    final transferJson = json['transfer'] as Map<String, dynamic>? ?? <String, dynamic>{};
    final fromJson = json['from_envelope'] as Map<String, dynamic>? ?? <String, dynamic>{};
    final toJson = json['to_envelope'] as Map<String, dynamic>? ?? <String, dynamic>{};

    return TransferActionResult(
      transfer: Transfer.fromJson(transferJson),
      fromEnvelope: Envelope.fromJson(fromJson),
      toEnvelope: Envelope.fromJson(toJson),
      message: json['message'] as String?,
    );
  }
}
