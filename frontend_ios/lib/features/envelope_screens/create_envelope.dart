import 'package:flutter/material.dart';
import 'package:frontend_ios/core/api/api_service.dart';
import 'package:frontend_ios/features/envelope_screens/widgets/envelope_colors.dart';

class CreateEnvelopeScreen extends StatefulWidget {
  const CreateEnvelopeScreen({super.key});

  @override
  State<CreateEnvelopeScreen> createState() => _CreateEnvelopeScreenState();
}

class _CreateEnvelopeScreenState extends State<CreateEnvelopeScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _goalController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _apiService = ApiService();

  static const List<Color> _colorOptions = envelopeColorOptions;

  Color _selectedColor = _colorOptions.last;
  bool _isSaving = false;
  String? _errorMessage;

  @override
  void dispose() {
    _nameController.dispose();
    _goalController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _handleSave() async {
    if (!_formKey.currentState!.validate()) return;

    final parsedGoal = int.tryParse(
      _goalController.text.replaceAll(',', '').trim(),
    );

    if (parsedGoal == null || parsedGoal < 0) {
      setState(() {
        _errorMessage = 'Allocation goal must be a positive whole number.';
      });
      return;
    }

    final int goalInCents = (parsedGoal * 100);

    FocusScope.of(context).unfocus();
    setState(() {
      _isSaving = true;
      _errorMessage = null;
    });

    try {
      final envelope = await _apiService.createEnvelope(
        name: _nameController.text.trim(),
        monthlyTarget: goalInCents,
        colorHex: _colorToHex(_selectedColor),
        description: _descriptionController.text.trim(),
      );

      if (!mounted) return;
      Navigator.of(context).pop(envelope);
    } catch (e) {
      setState(() {
        final raw = e.toString();
        final cleaned = raw
            .replaceFirst(RegExp(r'^Exception: ?'), '')
            .replaceFirst(RegExp(r'^Failed to create envelope: ?'), '');
        _errorMessage = cleaned.isEmpty ? 'Something went wrong. Please try again.' : cleaned;
      });
    } finally {
      if (mounted) {
        setState(() {
          _isSaving = false;
        });
      }
    }
  }

  String _colorToHex(Color color) {
    final hex = color.value.toRadixString(16).padLeft(8, '0');
    return '#${hex.substring(2).toUpperCase()}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
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
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                  const SizedBox(width: 4),
                  const Expanded(
                    child: Text(
                      'Create Envelope',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF1E1F3D),
                      ),
                    ),
                  ),
                  _SaveButton(onPressed: _handleSave, isSaving: _isSaving),
                ],
              ),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(24, 8, 24, 32),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _LabeledField(
                        label: 'Envelope Name',
                        child: TextFormField(
                          controller: _nameController,
                          textCapitalization: TextCapitalization.words,
                          validator: (value) {
                            if (value == null || value.trim().isEmpty) {
                              return 'Please enter an envelope name';
                            }
                            return null;
                          },
                          decoration: _inputDecoration(hint: 'Label *'),
                        ),
                      ),
                      const SizedBox(height: 20),
                      _LabeledField(
                        label: 'Allocation Goal',
                        child: TextFormField(
                          controller: _goalController,
                          keyboardType: TextInputType.number,
                          decoration: _inputDecoration(hint: 'Label'),
                        ),
                      ),
                      const SizedBox(height: 20),
                      _LabeledField(
                        label: 'Envelope Description',
                        child: TextFormField(
                          controller: _descriptionController,
                          maxLines: 3,
                          decoration: _inputDecoration(hint: 'Label'),
                        ),
                      ),
                      const SizedBox(height: 24),
                      const Text(
                        'Envelope Color',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF1E1F3D),
                        ),
                      ),
                      const SizedBox(height: 12),
                      _EnvelopePreview(color: _selectedColor),
                      const SizedBox(height: 16),
                      Wrap(
                        spacing: 14,
                        runSpacing: 12,
                        children: _colorOptions.map((color) {
                          final isSelected = color == _selectedColor;
                          return GestureDetector(
                            onTap: () {
                              setState(() {
                                _selectedColor = color;
                              });
                            },
                            child: Container(
                              width: 36,
                              height: 36,
                              decoration: BoxDecoration(
                                color: color,
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: isSelected ? const Color(0xFF1E1F3D) : Colors.white,
                                  width: isSelected ? 2.4 : 1,
                                ),
                                boxShadow: isSelected
                                    ? [
                                        BoxShadow(
                                          color: color.withOpacity(0.3),
                                          blurRadius: 8,
                                          offset: const Offset(0, 4),
                                        ),
                                      ]
                                    : null,
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                      if (_errorMessage != null) ...[
                        const SizedBox(height: 20),
                        Text(
                          _errorMessage!,
                          style: const TextStyle(color: Colors.red),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  InputDecoration _inputDecoration({String? hint}) {
    return InputDecoration(
      hintText: hint,
      filled: true,
      fillColor: Colors.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: Color(0xFFD1D5DB)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: Color(0xFFD5D8E2)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: Color(0xFF1E1F3D), width: 1.4),
      ),
    );
  }
}

class _LabeledField extends StatelessWidget {
  const _LabeledField({
    required this.label,
    required this.child,
  });

  final String label;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: Color(0xFF1E1F3D),
          ),
        ),
        const SizedBox(height: 8),
        child,
      ],
    );
  }
}

class _EnvelopePreview extends StatelessWidget {
  const _EnvelopePreview({required this.color});

  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 130,
      decoration: BoxDecoration(
        color: color.withOpacity(0.2),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: color, width: 2),
      ),
      child: CustomPaint(
        painter: _EnvelopeSketchPainter(color.withOpacity(0.8)),
        child: const SizedBox.expand(),
      ),
    );
  }
}

class _EnvelopeSketchPainter extends CustomPainter {
  _EnvelopeSketchPainter(this.strokeColor);

  final Color strokeColor;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = strokeColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;

    final rect = RRect.fromLTRBR(8, 8, size.width - 8, size.height - 8, const Radius.circular(18));
    canvas.drawRRect(rect, paint);
    canvas.drawLine(const Offset(8, 8), Offset(size.width - 8, size.height - 8), paint);
    canvas.drawLine(Offset(8, size.height - 8), Offset(size.width - 8, 8), paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _SaveButton extends StatelessWidget {
  const _SaveButton({required this.onPressed, required this.isSaving});

  final VoidCallback onPressed;
  final bool isSaving;

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: isSaving ? null : onPressed,
      style: ElevatedButton.styleFrom(
        backgroundColor: const Color(0xFF1E1F3D),
        shape: const StadiumBorder(),
        padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
        elevation: 4,
      ),
      child: isSaving
          ? const SizedBox(
              height: 16,
              width: 16,
              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
            )
          : const Text(
              'Save',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w600,
              ),
            ),
    );
  }
}
