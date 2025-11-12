import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:frontend_ios/core/api/api_service.dart';
import 'package:frontend_ios/core/models/envelope.dart';
import 'package:frontend_ios/core/models/transfer.dart';
import 'package:intl/intl.dart';

Future<TransferActionResult?> showTransferEnvelopeSheet(
  BuildContext context, {
  required List<Envelope> envelopes,
  Envelope? initialFrom,
  Envelope? initialTo,
}) {
  return showModalBottomSheet<TransferActionResult>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (sheetContext) {
      return TransferEnvelopeSheet(
        envelopes: envelopes,
        initialFrom: initialFrom,
        initialTo: initialTo,
      );
    },
  );
}

class TransferEnvelopeSheet extends StatefulWidget {
  const TransferEnvelopeSheet({
    super.key,
    required this.envelopes,
    this.initialFrom,
    this.initialTo,
  });

  final List<Envelope> envelopes;
  final Envelope? initialFrom;
  final Envelope? initialTo;

  @override
  State<TransferEnvelopeSheet> createState() => _TransferEnvelopeSheetState();
}

class _TransferEnvelopeSheetState extends State<TransferEnvelopeSheet> {
  final _formKey = GlobalKey<FormState>();
  final _amountController = TextEditingController();
  final _notesController = TextEditingController();
  final _apiService = ApiService();

  Envelope? _fromEnvelope;
  Envelope? _toEnvelope;
  bool _isSubmitting = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    if (widget.envelopes.isNotEmpty) {
      _fromEnvelope = widget.initialFrom ?? widget.envelopes.first;
      _toEnvelope = widget.initialTo;
      if (_toEnvelope != null && _toEnvelope!.id == _fromEnvelope?.id) {
        _toEnvelope = null;
      }
    }
  }

  @override
  void dispose() {
    _amountController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;

    return AnimatedPadding(
      duration: const Duration(milliseconds: 200),
      curve: Curves.easeOut,
      padding: EdgeInsets.only(
        left: 16,
        right: 16,
        bottom: bottomInset == 0 ? 32 : bottomInset,
        top: 32,
      ),
      child: Align(
        alignment: Alignment.bottomCenter,
        child: Container(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(28),
            boxShadow: const [
              BoxShadow(
                color: Color(0x33000000),
                blurRadius: 30,
                offset: Offset(0, 12),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Expanded(
                    child: Text(
                      'Transfer Funds',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF1E1F3D),
                      ),
                    ),
                  ),
                  IconButton(
                    onPressed: _isSubmitting ? null : () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.close_rounded, color: Color(0xFF7C8097)),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              if (widget.envelopes.length < 2)
                const _EmptyStateMessage()
              else
                Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildDropdownField(
                        label: 'From',
                        value: _fromEnvelope?.id,
                        hintText: 'Select envelope',
                        options: widget.envelopes.where((env) => env.id != _toEnvelope?.id).toList(),
                        onChanged: (value) {
                          if (value == null) return;
                          final envelope = _findEnvelope(value);
                          setState(() {
                            _fromEnvelope = envelope;
                            if (_toEnvelope?.id == value) {
                              _toEnvelope = null;
                            }
                          });
                        },
                      ),
                      if (_fromEnvelope != null)
                        Padding(
                          padding: const EdgeInsets.only(top: 8),
                          child: Text(
                            'Available: ${_formatCurrency(_fromEnvelope!.amount)}',
                            style: const TextStyle(color: Color(0xFF7C8097), fontSize: 13),
                          ),
                        ),
                      const SizedBox(height: 20),
                      _buildDropdownField(
                        label: 'To',
                        value: _toEnvelope?.id,
                        hintText: _fromEnvelope == null ? 'Select source first' : 'Select envelope',
                        options: widget.envelopes.where((env) => env.id != _fromEnvelope?.id).toList(),
                        enabled: _fromEnvelope != null,
                        onChanged: (value) {
                          if (value == null) return;
                          final envelope = _findEnvelope(value);
                          setState(() {
                            _toEnvelope = envelope;
                          });
                        },
                      ),
                      const SizedBox(height: 20),
                      TextFormField(
                        controller: _amountController,
                        keyboardType: TextInputType.numberWithOptions(decimal: true),
                        enabled: !_isSubmitting && _fromEnvelope != null,
                        inputFormatters: [
                          FilteringTextInputFormatter.allow(RegExp(r'^\d*\.?\d{0,2}')),
                        ],
                        decoration: _inputDecoration(label: 'Transfer Amount', prefix: '\$'),
                        validator: (_) => _validateAmount(),
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: _notesController,
                        enabled: !_isSubmitting,
                        textCapitalization: TextCapitalization.sentences,
                        decoration: _inputDecoration(label: 'Notes (optional)'),
                        maxLines: 2,
                      ),
                      const SizedBox(height: 12),
                      if (_errorMessage != null)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: Text(
                            _errorMessage!,
                            style: const TextStyle(color: Color(0xFFB91C1C)),
                          ),
                        ),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: _isSubmitting ? null : _handleSubmit,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF1E1F3D),
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: const StadiumBorder(),
                          ),
                          child: _isSubmitting
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                  ),
                                )
                              : const Text(
                                  'Transfer',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDropdownField({
    required String label,
    required String? value,
    required List<Envelope> options,
    required ValueChanged<String?> onChanged,
    String? hintText,
    bool enabled = true,
  }) {
    return DropdownButtonFormField<String>(
      value: value,
      isExpanded: true,
      items: options
          .map(
            (envelope) => DropdownMenuItem(
              value: envelope.id,
              child: Text(envelope.name),
            ),
          )
          .toList(),
      decoration: _inputDecoration(label: label, hintText: hintText),
      onChanged: enabled ? onChanged : null,
      validator: (selected) {
        if (!enabled) return 'Select a source envelope first';
        if (selected == null || selected.isEmpty) {
          return 'Please select an envelope';
        }
        return null;
      },
    );
  }

  InputDecoration _inputDecoration({required String label, String? hintText, String? prefix}) {
    return InputDecoration(
      labelText: label,
      hintText: hintText,
      prefixText: prefix,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: Color(0xFFE3E6F0)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: Color(0xFFE3E6F0)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: Color(0xFF1E1F3D), width: 1.2),
      ),
    );
  }

  String? _validateAmount() {
    if (_fromEnvelope == null) {
      return 'Select a source envelope';
    }
    final raw = _amountController.text.trim();
    if (raw.isEmpty) {
      return 'Enter an amount';
    }
    final amountInDollars = double.tryParse(raw);
    if (amountInDollars == null || amountInDollars <= 0) {
      return 'Enter a valid positive amount';
    }
    final int amountInCents = (amountInDollars * 100).round();

    if (amountInCents > _fromEnvelope!.amount) {
      return 'Amount exceeds available funds';
    }
    return null;
  }

  Envelope? _findEnvelope(String id) {
    try {
      return widget.envelopes.firstWhere((env) => env.id == id);
    } catch (_) {
      return null;
    }
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_fromEnvelope == null || _toEnvelope == null) {
      setState(() {
        _errorMessage = 'Please select both envelopes.';
      });
      return;
    }

    final amountInDollars = double.tryParse(_amountController.text.trim()) ?? 0;
    final int amountInCents = (amountInDollars * 100).round();

    FocusScope.of(context).unfocus();

    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });

    try {
      final result = await _apiService.transferFunds(
        fromEnvelopeId: _fromEnvelope!.id,
        toEnvelopeId: _toEnvelope!.id,
        amount: amountInCents,
        notes: _notesController.text.trim().isEmpty ? null : _notesController.text.trim(),
      );

      if (!mounted) return;
      Navigator.of(context).pop(result);
    } catch (e) {
      setState(() {
        final cleaned = e.toString().replaceFirst(RegExp(r'^Exception: ?'), '');
        _errorMessage = cleaned.isEmpty ? 'Unable to transfer funds.' : cleaned;
        _isSubmitting = false;
      });
    }
  }

  String _formatCurrency(int amountInCents) {
    // Convert cents (int) to dollars (double)
    final double amountInDollars = amountInCents / 100.0;

    // Create a formatter that handles commas and $
    final formatter = NumberFormat.currency(
      locale: 'en_US', // This gives you 1,000.00
      symbol: '\$',
      decimalDigits: 2,
    );
    return formatter.format(amountInDollars);
  }
}

class _EmptyStateMessage extends StatelessWidget {
  const _EmptyStateMessage();

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.symmetric(vertical: 24),
      child: Text(
        'Create at least two envelopes to transfer funds between them.',
        style: TextStyle(color: Color(0xFF7C8097)),
        textAlign: TextAlign.center,
      ),
    );
  }
}
