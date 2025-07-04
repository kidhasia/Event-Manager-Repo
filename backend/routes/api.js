const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Event = require('../models/Event');
const auth = require('../middleware/auth');

// User Signup
router.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'User already exists' });
    user = new User({ email, password });
    await user.save();
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// User Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create Event
router.post('/events', auth, async (req, res) => {
  const { title, description, date, location } = req.body;
  try {
    const event = new Event({ title, description, date, location, creator: req.user.id });
    await event.save();
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get All Events
router.get('/events', auth, async (req, res) => {
  try {
    const events = await Event.find({ creator: req.user.id });
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Event
router.put('/events/:id', auth, async (req, res) => {
  const { title, description, date, location } = req.body;
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ msg: 'Event not found' });
    if (event.creator.toString() !== req.user.id) return res.status(403).json({ msg: 'Unauthorized' });
    event.title = title || event.title;
    event.description = description || event.description;
    event.date = date || event.date;
    event.location = location || event.location;
    await event.save();
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Event
router.delete('/events/:id', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ msg: 'Event not found' });
    if (event.creator.toString() !== req.user.id) return res.status(403).json({ msg: 'Unauthorized' });
    await event.remove();
    res.json({ msg: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// RSVP to Event
router.post('/events/:id/rsvp', auth, async (req, res) => {
  const { status } = req.body;
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ msg: 'Event not found' });
    const rsvpIndex = event.rsvps.findIndex(rsvp => rsvp.user.toString() === req.user.id);
    if (rsvpIndex !== -1) {
      event.rsvps[rsvpIndex].status = status;
    } else {
      event.rsvps.push({ user: req.user.id, status });
    }
    await event.save();
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add Checklist Item
router.post('/events/:id/checklist', auth, async (req, res) => {
  const { item } = req.body;
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ msg: 'Event not found' });
    if (event.creator.toString() !== req.user.id) return res.status(403).json({ msg: 'Unauthorized' });
    event.checklist.push({ item });
    await event.save();
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle Checklist Item
router.put('/events/:id/checklist/:itemId', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ msg: 'Event not found' });
    if (event.creator.toString() !== req.user.id) return res.status(403).json({ msg: 'Unauthorized' });
    const item = event.checklist.id(req.params.itemId);
    if (!item) return res.status(404).json({ msg: 'Checklist item not found' });
    item.completed = !item.completed;
    await event.save();
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Set Reminder (Simulated via console log)
router.post('/events/:id/reminders', auth, async (req, res) => {
  const { time, message } = req.body;
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ msg: 'Event not found' });
    if (event.creator.toString() !== req.user.id) return res.status(403).json({ msg: 'Unauthorized' });
    event.reminders.push({ time, message });
    await event.save();
    console.log(`Reminder set for ${event.title} at ${new Date(time).toLocaleString()}: ${message}`);
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;