import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';

// Get all calendar events for a specific month and year
export const getCalendarEvents = async (req, res) => {
  try {
    const { year, month } = req.query; // Expected format: year and month

    if (!year || !month) {
      throw new ApiError(400, 'Year and month are required');
    }

    // Fetch all users
    const users = await User.find();

    // Extract all relevant events
    const events = users.flatMap(user => {
      const userEvents = [];

      // User's own birthday
      if (user.dateOfBirth) {
        const dob = new Date(user.dateOfBirth);
        if (dob.getFullYear() === parseInt(year) && dob.getMonth() === parseInt(month) - 1) {
          userEvents.push({
            date: dob,
            type: 'Birthday',
            name: user.fullname
          });
        }
      }

      // User's anniversary
      if (user.anniversaryDate) {
        const anniversary = new Date(user.anniversaryDate);
        if (anniversary.getFullYear() === parseInt(year) && anniversary.getMonth() === parseInt(month) - 1) {
          userEvents.push({
            date: anniversary,
            type: 'Anniversary',
            name: user.fullname
          });
        }
      }

      // Children's birthdays
      user.children.forEach(child => {
        const childBirthday = new Date(child.birthday);
        if (childBirthday.getFullYear() === parseInt(year) && childBirthday.getMonth() === parseInt(month) - 1) {
          userEvents.push({
            date: childBirthday,
            type: 'Child\'s Birthday',
            name: child.name
          });
        }
      });

      // Parents' birthdays
      user.parents.forEach(parent => {
        const parentBirthday = new Date(parent.birthday);
        if (parentBirthday.getFullYear() === parseInt(year) && parentBirthday.getMonth() === parseInt(month) - 1) {
          userEvents.push({
            date: parentBirthday,
            type: 'Parent\'s Birthday',
            name: parent.name
          });
        }
      });

      return userEvents;
    });

    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching calendar events', error });
  }
};
