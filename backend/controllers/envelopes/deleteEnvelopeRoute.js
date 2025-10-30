// Routes the envelope get requests
const router = require('express').Router();
const requireAuth = require('../../middleware/requireAuth');
const { Envelope } = require('../../models');
const mongoose = require('mongoose');

// Delete an envelope by ID
router.delete('/:id', requireAuth, async (req, res) => { // Added requireAuth for the specific route
  try {
      const { id } = req.params;

      // Validate the id is a valid mongoose ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).json({ error: "Invalid envelope ID" });
      }

      // Attempt to delete the envelope for this user
      const envelope = await Envelope.findOneAndDelete({
          _id: id,
          user_id: req.session.userId,
      });

      // If no envelope was found to delete it will return 404
      if (!envelope) {
          return res.status(404).json({ error: "Envelope not found" });
    }
      // Return the deleted envelope
      return res.status(200).json(envelope.toSafeJSON());

    // If there is an error it will be caught and returned with error 500
  } catch (error) {
      console.error("Error envelope could not be deleted:", error);
      return res.status(500).json({ error: 'Internal server error' });
  }
});

// End of file dont write after
module.exports = router;
