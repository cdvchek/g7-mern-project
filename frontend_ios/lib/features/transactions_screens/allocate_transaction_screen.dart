import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:frontend_ios/core/api/api_service.dart';
import 'package:frontend_ios/core/models/envelope.dart';
import 'package:frontend_ios/core/models/transaction.dart';
import 'package:intl/intl.dart';
import 'dart:async';

class AllocateTransactionScreen extends StatefulWidget {
  final Transaction transaction;

  const AllocateTransactionScreen({super.key, required this.transaction});

  @override
  State<AllocateTransactionScreen> createState() =>
      _AllocateTransactionScreenState();
}

class _AllocateTransactionScreenState extends State<AllocateTransactionScreen> {
  final ApiService _apiService = ApiService();
  
  // This holds the state of our form
  List<Envelope> _envelopes = [];
  bool _isLoading = true;
  String? _errorMessage;
  bool _isSaving = false;

  // This tracks the user's input, e.g., {'envelopeId': 5000}
  final Map<String, int> _allocations = {};
  
  late int _unallocatedCents; // This is the amount left on the *transaction*
  int _remainingInForm = 0; // This is the amount left to fill *in the form*

  @override
  void initState() {
    super.initState();
    _unallocatedCents = widget.transaction.unallocatedCents;
    _remainingInForm = _unallocatedCents; // Start with the full unallocated amount
    _loadEnvelopes();
  }

  Future<void> _loadEnvelopes() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      final envelopes = await _apiService.fetchEnvelopes();
      if (mounted) {
        setState(() {
          _envelopes = envelopes;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString().replaceFirst('Exception: ', '');
          _isLoading = false;
        });
      }
    }
  }

  // Helper to format cents to dollars
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

  // This updates our "Remaining" total whenever the user types
  void _updateRemaining() {
    int totalAllocatedInForm = 0;
    _allocations.forEach((key, value) {
      totalAllocatedInForm += value;
    });
    setState(() {
      // The amount left to fill in the form
      _remainingInForm = _unallocatedCents - totalAllocatedInForm;
    });
  }

  // This is the core logic for saving
  Future<void> _onSave() async {
    // Check if the user has allocated more than they have.
    // _remainingInForm = _unallocatedCents - totalAllocatedInForm

    // Case 1: Inflow (e.g., +$110)
    // _remainingInForm must be >= 0
    if (_unallocatedCents > 0 && _remainingInForm < 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('You cannot allocate more than ${_formatCurrency(_unallocatedCents)}.'),
          backgroundColor: Colors.red,
        ),
      );
      return; // Stop
    }

    // Case 2: Outflow (e.g., -$110)
    // _remainingInForm must be <= 0
    if (_unallocatedCents < 0 && _remainingInForm > 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Your de-allocations cannot be less than ${_formatCurrency(_unallocatedCents)}.'),
          backgroundColor: Colors.red,
        ),
      );
      return; // Stop
    }

    setState(() { _isSaving = true; _errorMessage = null; });

    try {
      int totalAllocatedInForm = 0;
      
      // 1. Update all the Envelopes FIRST, one by one.
      for (final envelope in _envelopes) {
        final int allocationAmount = _allocations[envelope.id] ?? 0;
        
        if (allocationAmount != 0) {
          // This math works for both positive and negative:
          // 5000 (current) + (-2000) (expense) = 3000
          final int newAmount = envelope.amount + allocationAmount;
          
          // Backend will throw an error here if newAmount < 0,
          // because = 'putEnvelopeRoute' is correctly rejecting it
          await _apiService.updateEnvelope(id: envelope.id, amount: newAmount);

          // This line is only reached if the update succeeded
          totalAllocatedInForm += allocationAmount;
        }
      }

      // 2. ONLY if all envelope updates succeeded, update the transaction
      final int newTotalAllocatedCents = 
          widget.transaction.allocated + totalAllocatedInForm;

      await _apiService.updateTransaction(
        id: widget.transaction.id, 
        allocated: newTotalAllocatedCents
      );

      // 3. If everything worked, pop the screen
      if (mounted) {
        Navigator.of(context).pop(true); // 'true' signals a refresh
      }

    } catch (e) {
      // If ANY of the awaits fail, we land here.
      // The transaction is NOT marked as allocated, and the UI is safe.
      if (mounted) {
        setState(() {
          _errorMessage = "Error: ${e.toString().replaceFirst('Exception: ', '')}";
          _isSaving = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    // Determine color (green for income, red for outflow)
    final bool isIncome = widget.transaction.amountCents > 0;
    final color = isIncome ? Colors.green[700] : Colors.red[700];

    return Scaffold(
      appBar: AppBar(
        title: Text('Allocate Transaction'),
      ),
      body: Column(
        children: [
          // --- The Header ---
          Container(
            padding: const EdgeInsets.all(16.0),
            width: double.infinity,
            color: Colors.grey[100],
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.transaction.displayName,
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                SizedBox(height: 8),
                Text(
                  'Amount to Allocate:',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                Text(
                  // Show unallocated amount
                  _formatCurrency(_unallocatedCents), 
                  style: Theme.of(context).textTheme.displaySmall?.copyWith(
                        color: color,
                        fontWeight: FontWeight.bold,
                      ),
                ),

                if (_errorMessage != null)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
                    color: Colors.red[50],
                    child: Row(
                      children: [
                        Icon(Icons.error_outline, color: Colors.red[700]),
                        SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            _errorMessage!,
                            style: TextStyle(color: Colors.red[700], fontWeight: FontWeight.w500),
                          ),
                        ),
                        IconButton(
                          icon: Icon(Icons.close, color: Colors.red[700], size: 20),
                          onPressed: () {
                            setState(() {
                              _errorMessage = null; // Allow user to dismiss the error
                            });
                          },
                        )
                      ],
                    ),
                  ),
              ],
            ),
          ),
          
          // --- The Allocation List ---
          Expanded(
            child: _buildBody(),
          ),

          // --- The Footer (Remaining) ---
          Container(
            padding: const EdgeInsets.all(16.0),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(blurRadius: 10, color: Colors.black.withOpacity(0.1))
              ],
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Remaining:',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                Text(
                  _formatCurrency(_remainingInForm),
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        color: _remainingInForm == 0 ? Colors.green[700] : 
                               _remainingInForm < 0 ? Colors.red : Colors.black,
                        fontWeight: FontWeight.bold,
                      ),
                ),
              ],
            ),
          ),

          // --- The Save Button ---
          SafeArea(
            child: Container(
              padding: const EdgeInsets.all(16.0),
              width: double.infinity,
              child: ElevatedButton(
                // Button is enabled as long as it's not saving
                onPressed: _isSaving ? null : _onSave, 
                child: _isSaving
                    ? SizedBox(height: 24, width: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 3))
                    : Text('Save Allocations'),
                style: ElevatedButton.styleFrom(
                  padding: EdgeInsets.symmetric(vertical: 16),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return Center(child: CircularProgressIndicator());
    }
    if (_envelopes.isEmpty) {
      return Center(child: Text("You have no envelopes to allocate to."));
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16.0),
      itemCount: _envelopes.length,
      itemBuilder: (context, index) {
        final envelope = _envelopes[index];
        return _EnvelopeAllocationTile(
          envelope: envelope,
          onChanged: (newAmountCents) {
            setState(() {
              _allocations[envelope.id] = newAmountCents;
            });
            _updateRemaining();
          },
        );
      },
    );
  }
}

// A helper widget to manage the text input for each envelope
class _EnvelopeAllocationTile extends StatefulWidget {
  final Envelope envelope;
  final Function(int) onChanged;

  const _EnvelopeAllocationTile({
    required this.envelope,
    required this.onChanged,
  });

  @override
  State<_EnvelopeAllocationTile> createState() =>
      _EnvelopeAllocationTileState();
}

class _EnvelopeAllocationTileState extends State<_EnvelopeAllocationTile> {
  late final TextEditingController _controller;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _onChanged(String value) {
    // Convert dollar string (e.g., "50.25") to cents (e.g., 5025)
    // Parses a double (e.g., "50.25" or "-20.10")
    final double dollars = double.tryParse(value) ?? 0.0;
    // And converts it to cents
    final int cents = (dollars * 100).round();
    widget.onChanged(cents);
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12.0),
      child: ListTile(
        title: Text(widget.envelope.name),
        subtitle: Text('Current: \$${(widget.envelope.amount / 100.0).toStringAsFixed(2)}'),
        trailing: SizedBox(
          width: 100,
          child: TextFormField(
            controller: _controller,
            decoration: InputDecoration(
              prefixText: '\$',
              border: OutlineInputBorder(),
              contentPadding: EdgeInsets.symmetric(horizontal: 8, vertical: 12),
            ),
            // Allow signed numbers and decimals
            keyboardType: TextInputType.numberWithOptions(signed: true, decimal: true),
            inputFormatters: [
              // This regex allows an optional '-', digits, an optional '.',
              // and up to 2 decimal places
              FilteringTextInputFormatter.allow(RegExp(r'^-?\d*\.?\d{0,2}')),
            ],
            onChanged: _onChanged,
          ),
        ),
      ),
    );
  }
}