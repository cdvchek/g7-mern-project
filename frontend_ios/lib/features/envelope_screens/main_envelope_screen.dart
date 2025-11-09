import 'package:flutter/material.dart';

class MainEnvelopeScreen extends StatelessWidget {
  const MainEnvelopeScreen({super.key});

  static const List<_EnvelopeData> _envelopes = [
    _EnvelopeData(name: 'Household Basics', description: 'Weekly groceries & supplies'),
    _EnvelopeData(name: 'Weekend Fun', description: 'Dining out + entertainment'),
    _EnvelopeData(name: 'Emergency Cushion', description: 'Unexpected essentials'),
  ];

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      color: const Color(0xFFF7F7FB),
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(24, 32, 24, 48),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _EnvelopeIntro(theme: theme),
            const SizedBox(height: 32),
            Center(
              child: Column(
                children: [
                  _PrimaryActionButton(
                    label: 'Create New Envelope',
                    icon: Icons.add,
                    onPressed: () {},
                  ),
                  const SizedBox(height: 16),
                  _PrimaryActionButton(
                    label: 'Transfer Funds',
                    icon: Icons.sync_alt,
                    onPressed: () {},
                    width: 180,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 40),
            ..._envelopes.map((envelope) => _EnvelopeCard(data: envelope)),
          ],
        ),
      ),
    );
  }
}

class _EnvelopeIntro extends StatelessWidget {
  const _EnvelopeIntro({required this.theme});

  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Center(
          child: Text(
            'Your Envelopes',
            style: theme.textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.w600,
              color: const Color(0xFF1E1F3D),
            ),
          ),
        ),
      ],
    );
  }
}

class _PrimaryActionButton extends StatelessWidget {
  const _PrimaryActionButton({
    required this.label,
    required this.icon,
    required this.onPressed,
    this.width = 240,
  });

  final String label;
  final IconData icon;
  final VoidCallback onPressed;
  final double width;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: width,
      child: ElevatedButton.icon(
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF1E1F3D),
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
          shape: const StadiumBorder(),
          elevation: 4,
        ),
        onPressed: onPressed,
        icon: Icon(icon, size: 18, color: Colors.white),
        label: Text(
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

class _EnvelopeCard extends StatelessWidget {
  const _EnvelopeCard({required this.data});

  final _EnvelopeData data;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 28),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE3E6F0)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x11000000),
            blurRadius: 18,
            offset: Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      data.name,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF1E1F3D),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      data.description,
                      style: const TextStyle(
                        fontSize: 13,
                        color: Color(0xFF7C8097),
                      ),
                    ),
                  ],
                ),
              ),
              IconButton(
                onPressed: () {},
                icon: const Icon(Icons.more_horiz, color: Color(0xFF1E1F3D)),
                tooltip: 'Envelope actions',
              ),
            ],
          ),
          const SizedBox(height: 16),
          const _EnvelopeSketch(),
        ],
      ),
    );
  }
}

class _EnvelopeSketch extends StatelessWidget {
  const _EnvelopeSketch();

  @override
  Widget build(BuildContext context) {
    return AspectRatio(
      aspectRatio: 16 / 9,
      child: CustomPaint(
        painter: _EnvelopeSketchPainter(),
      ),
    );
  }
}

class _EnvelopeSketchPainter extends CustomPainter {
  final Paint _borderPaint = Paint()
    ..color = const Color(0xFFDADDE7)
    ..style = PaintingStyle.stroke
    ..strokeWidth = 2;

  final Paint _linePaint = Paint()
    ..color = const Color(0xFFC5C8D6)
    ..style = PaintingStyle.stroke
    ..strokeWidth = 1.5;

  @override
  void paint(Canvas canvas, Size size) {
    final rect = RRect.fromLTRBR(0, 0, size.width, size.height, const Radius.circular(18));
    canvas.drawRRect(rect, _borderPaint);

    canvas.drawLine(const Offset(0, 0), Offset(size.width, size.height), _linePaint);
    canvas.drawLine(Offset(0, size.height), Offset(size.width, 0), _linePaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _EnvelopeData {
  const _EnvelopeData({
    required this.name,
    required this.description,
  });

  final String name;
  final String description;
}
