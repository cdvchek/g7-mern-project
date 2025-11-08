// In lib/features/settings/editable_setting_field.dart
import 'package:flutter/material.dart';

// This is the function signature this widget expects
// It's an async function that returns a String? (the error)
typedef OnSaveCallback = Future<String?> Function();

class EditableSettingField extends StatefulWidget {
  final String label;
  final TextEditingController controller;
  final OnSaveCallback onSave;

  const EditableSettingField({
    super.key,
    required this.label,
    required this.controller,
    required this.onSave,
  });

  @override
  State<EditableSettingField> createState() => _EditableSettingFieldState();
}

class _EditableSettingFieldState extends State<EditableSettingField> {
  bool _isEditing = false;
  bool _isLoading = false;
  String? _errorMessage;
  late String _originalValue;

  @override
  void initState() {
    super.initState();
    // Store the original value in case of cancel
    _originalValue = widget.controller.text;
  }

  Future<void> _handleSave() async {
    setState(() { _isLoading = true; _errorMessage = null; });
    
    // Call the onSave function passed from the parent
    final error = await widget.onSave();

    if (error == null) {
      // Success
      setState(() {
        _isEditing = false;
        _originalValue = widget.controller.text; // Update original value
      });
    } else {
      // Failure
      setState(() {
        _errorMessage = error;
      });
    }
    
    setState(() { _isLoading = false; });
  }

  void _handleCancel() {
    setState(() {
      _isEditing = false;
      _errorMessage = null;
      widget.controller.text = _originalValue; // Revert to old text
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_isEditing) {
      // --- EDIT MODE ---
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: widget.controller,
                  decoration: InputDecoration(labelText: widget.label),
                ),
              ),
              if (_isLoading)
                Padding(
                  padding: const EdgeInsets.all(8.0),
                  child: CircularProgressIndicator(),
                )
              else ...[
                // Cancel Button
                IconButton(
                  icon: Icon(Icons.close),
                  onPressed: _handleCancel
                ),
                // Save Button
                IconButton(
                  icon: Icon(Icons.check),
                  onPressed: _handleSave,
                ),
              ],
            ],
          ),
          if (_errorMessage != null)
            Padding(
              padding: const EdgeInsets.only(top: 8.0),
              child: Text(_errorMessage!, style: TextStyle(color: Colors.red)),
            ),
        ],
      );
    }

    // --- VIEW MODE ---
    return ListTile(
      title: Text(widget.label),
      subtitle: Text(widget.controller.text),
      trailing: IconButton(
        icon: Icon(Icons.edit, size: 20),
        onPressed: () {
          setState(() {
            _originalValue = widget.controller.text; // Store current value
            _isEditing = true;
          });
        },
      ),
    );
  }
}