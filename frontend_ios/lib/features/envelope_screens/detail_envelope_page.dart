import 'package:flutter/material.dart';
import 'package:frontend_ios/core/api/api_service.dart';
import 'package:frontend_ios/core/models/envelope.dart';
import 'package:frontend_ios/core/models/transfer.dart';
import 'package:frontend_ios/features/envelope_screens/edit_delete_envelope.dart';

class DetailEnvelopePage extends StatefulWidget {
  const DetailEnvelopePage({super.key, required this.envelope});

  final Envelope envelope;

  @override
  State<DetailEnvelopePage> createState() => _DetailEnvelopePageState();
}

class _DetailEnvelopePageState extends State<DetailEnvelopePage> {
  late Envelope _envelope;
  bool _isDeleting = false;
  String? _errorMessage;
  final _apiService = ApiService();
  bool _hasChanges = false;
  List<Transfer> _transfers = const [];
  bool _isTransfersLoading = true;
  String? _transfersError;

  @override
  void initState() {
    super.initState();
    _envelope = widget.envelope;
    _loadTransfers();
  }

  Future<void> _handleEdit() async {
    final result = await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => EditDeleteEnvelopeScreen(envelope: _envelope),
      ),
    );

    if (result is Map<String, dynamic>) {
      final status = result['status'] as String?;
      if (status == 'updated') {
        final updated = result['envelope'] as Envelope?;
        if (updated != null && mounted) {
          setState(() {
            _envelope = updated;
            _errorMessage = null;
            _hasChanges = true;
          });
        }
      } else if (status == 'deleted') {
        if (mounted) {
          Navigator.of(context).pop({'status': 'deleted', 'id': _envelope.id});
        }
      }
    }
  }

  Future<void> _handleDelete() async {
    final confirm = await showDialog<bool>(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('Delete Envelope?'),
            content: const Text('This action cannot be undone.'),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(ctx).pop(false),
                child: const Text('Cancel'),
              ),
              TextButton(
                onPressed: () => Navigator.of(ctx).pop(true),
                style: TextButton.styleFrom(foregroundColor: const Color(0xFFB91C1C)),
                child: const Text('Delete'),
              ),
            ],
          ),
        ) ??
        false;

    if (!confirm) return;

    setState(() {
      _isDeleting = true;
      _errorMessage = null;
    });

    try {
      await _apiService.deleteEnvelope(_envelope.id);
      if (mounted) {
        Navigator.of(context).pop({'status': 'deleted', 'id': _envelope.id});
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          final cleaned = e.toString().replaceFirst(RegExp(r'^Exception: ?'), '');
          _errorMessage = cleaned.isEmpty ? 'Unable to delete envelope.' : cleaned;
          _isDeleting = false;
        });
      }
    }
  }

  Future<void> _loadTransfers() async {
    setState(() {
      _isTransfersLoading = true;
      _transfersError = null;
    });

    try {
      final transfers = await _apiService.fetchTransfersForEnvelope(_envelope.id);
      if (!mounted) return;
      setState(() {
        _transfers = transfers;
        _isTransfersLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        final cleaned = e.toString().replaceFirst(RegExp(r'^Exception: ?'), '');
        _transfersError = cleaned.isEmpty ? 'Unable to load transfers.' : cleaned;
        _isTransfersLoading = false;
      });
    }
  }


  @override
  Widget build(BuildContext context) {
    final accent = _resolveColor(_envelope.color);

    return WillPopScope(
      onWillPop: () async {
        _popWithResult();
        return false;
      },
      child: Scaffold(
        backgroundColor: const Color(0xFFF7F7FB),
        body: SafeArea(
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                child: Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Color(0xFF1E1F3D)),
                      onPressed: _popWithResult,
                    ),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      _envelope.name,
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF1E1F3D),
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(24, 8, 24, 32),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Text(
                      _envelope.description?.isNotEmpty == true
                          ? _envelope.description!
                          : 'No description provided',
                      style: const TextStyle(color: Color(0xFF7C8097)),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 20),
                    Wrap(
                      spacing: 16,
                      runSpacing: 12,
                      alignment: WrapAlignment.center,
                      children: [
                        _PrimaryPillButton(label: 'Edit', onPressed: _handleEdit),
                        _PrimaryPillButton(
                          label: 'Delete',
                          onPressed: _isDeleting ? null : _handleDelete,
                        ),
                      ],
                    ),
                    const SizedBox(height: 32),
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(color: const Color(0xFFE3E6F0)),
                      ),
                      child: Column(
                        children: [
                          Text(
                            _formatCurrency(_envelope.amount),
                            style: const TextStyle(
                              fontSize: 32,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF1E1F3D),
                            ),
                          ),
                          Text(
                            '${_envelope.monthlyTarget != null ? 'Goal: ' + _formatCurrency(_envelope.monthlyTarget!) : ''}',
                            style: const TextStyle(
                              fontSize: 16,
                              color: Color(0xFF7C8097),
                            ),
                          ),
                          const SizedBox(height: 8),
                          Container(
                            height: 8,
                            decoration: BoxDecoration(
                              color: accent.withOpacity(0.25),
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                        ],
                      ),
                    ),
                    if (_errorMessage != null) ...[
                      const SizedBox(height: 20),
                      Text(
                        _errorMessage!,
                        style: const TextStyle(color: Colors.red),
                      ),
                    ],
                    const SizedBox(height: 32),
                    const Align(
                      alignment: Alignment.centerLeft,
                      child: Text(
                        'Recent Transactions',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF1E1F3D),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    _TransferListCard(
                      isLoading: _isTransfersLoading,
                      errorMessage: _transfersError,
                      transfers: _transfers.take(4).toList(),
                      envelopeId: _envelope.id,
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
        ),
      ),
    );
  }

  void _popWithResult() {
    Navigator.of(context).pop(_hasChanges ? {'status': 'updated'} : null);
  }

  Color _resolveColor(String? hex) {
    if (hex == null || hex.isEmpty) {
      return const Color(0xFF1E1F3D);
    }
    final normalized = hex.replaceFirst('#', '');
    if (normalized.length == 6) {
      final value = int.tryParse(normalized, radix: 16);
      if (value != null) {
        return Color(0xFF000000 | value);
      }
    }
    return const Color(0xFF1E1F3D);
  }

  String _formatCurrency(int amount) {
    final buffer = StringBuffer();
    final digits = amount.abs().toString();
    for (int i = 0; i < digits.length; i++) {
      if (i != 0 && (digits.length - i) % 3 == 0) {
        buffer.write(',');
      }
      buffer.write(digits[i]);
    }
    return '\$${amount < 0 ? '-' : ''}$buffer';
  }
}

class _PrimaryPillButton extends StatelessWidget {
  const _PrimaryPillButton({required this.label, required this.onPressed});

  final String label;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 120,
      child: ElevatedButton(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF1E1F3D),
          padding: const EdgeInsets.symmetric(vertical: 14),
          shape: const StadiumBorder(),
        ),
        child: Text(
          label,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }
}

class _TransferListCard extends StatelessWidget {
  const _TransferListCard({
    required this.isLoading,
    required this.errorMessage,
    required this.transfers,
    required this.envelopeId,
  });

  final bool isLoading;
  final String? errorMessage;
  final List<Transfer> transfers;
  final String envelopeId;

  @override
  Widget build(BuildContext context) {
    Widget child;

    if (isLoading) {
      child = const SizedBox(
        height: 100,
        child: Center(
          child: CircularProgressIndicator(
            strokeWidth: 2,
            valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF1E1F3D)),
          ),
        ),
      );
    } else if (errorMessage != null) {
      child = Text(
        errorMessage!,
        style: const TextStyle(color: Color(0xFFB91C1C)),
        textAlign: TextAlign.center,
      );
    } else if (transfers.isEmpty) {
      child = const Text(
        'No transfers yet.',
        style: TextStyle(color: Color(0xFF7C8097)),
        textAlign: TextAlign.center,
      );
    } else {
      child = Column(
        children: [
          for (int i = 0; i < transfers.length; i++) ...[
            _TransferTile(
              transfer: transfers[i],
              envelopeId: envelopeId,
            ),
            if (i != transfers.length - 1)
              const Divider(
                color: Color(0xFFE3E6F0),
                height: 12,
                thickness: 1,
              ),
          ],
        ],
      );
    }

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFE3E6F0)),
      ),
      child: child,
    );
  }
}

class _TransferTile extends StatelessWidget {
  const _TransferTile({required this.transfer, required this.envelopeId});

  final Transfer transfer;
  final String envelopeId;

  @override
  Widget build(BuildContext context) {
    final isIncoming = transfer.toEnvelope.id == envelopeId;
    final color = isIncoming ? const Color(0xFF0F9D58) : const Color(0xFFB91C1C);
    final counterpart = isIncoming ? transfer.fromEnvelope : transfer.toEnvelope;
    final counterpartName =
        counterpart.name != null && counterpart.name!.isNotEmpty ? counterpart.name! : 'Envelope';
    final directionLabel = isIncoming ? 'From $counterpartName' : 'To $counterpartName';
    final amountValue = transfer.amount.abs().toDouble().toStringAsFixed(2);
    final subtitleParts = <String>[];
    if (transfer.notes != null && transfer.notes!.trim().isNotEmpty) {
      subtitleParts.add(transfer.notes!.trim());
    }
    final dateLabel = _formatTransferDate(transfer.occuredAt ?? transfer.createdAt);
    if (dateLabel != null) {
      subtitleParts.add(dateLabel);
    }

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  directionLabel,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF1E1F3D),
                  ),
                ),
                if (subtitleParts.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text(
                      subtitleParts.join(' • '),
                      style: const TextStyle(
                        color: Color(0xFF7C8097),
                        fontSize: 12,
                      ),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 16),
          Text(
            '${isIncoming ? '+' : '-'} \$$amountValue',
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

String? _formatTransferDate(DateTime? date) {
  if (date == null) return null;
  final month = date.month.toString().padLeft(2, '0');
  final day = date.day.toString().padLeft(2, '0');
  final year = date.year.toString();
  return '$month/$day/$year';
}
