/**
 * Date and Time utilities for appointment scheduling and slot calculations.
 */

/**
 * Convert "HH:mm" string to minutes from start of day (0 to 1439).
 * @param {string} timeStr e.g. "09:30"
 * @returns {number} minutes
 */
function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes from start of day to "HH:mm" string.
 * @param {number} totalMinutes
 * @returns {string} e.g. "09:30"
 */
function minutesToTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Check if two time ranges on the same date overlap.
 * Range A: [startA, endA]
 * Range B: [startB, endB]
 * Overlap condition: max(startA, startB) < min(endA, endB)
 */
function isOverlapping(startA, endA, startB, endB) {
  const aStart = timeToMinutes(startA);
  const aEnd = timeToMinutes(endA);
  const bStart = timeToMinutes(startB);
  const bEnd = timeToMinutes(endB);

  return Math.max(aStart, bStart) < Math.min(aEnd, bEnd);
}

/**
 * Check if the given date and start time is in the past.
 * @param {string} dateStr "YYYY-MM-DD"
 * @param {string} timeStr "HH:mm"
 * @returns {boolean}
 */
function isDateTimeInPast(dateStr, timeStr) {
  const targetDate = new Date(`${dateStr}T${timeStr}:00`);
  const now = new Date();
  return targetDate.getTime() < now.getTime();
}

/**
 * Validate that a time range is within operating hours.
 * @param {string} startTime "HH:mm"
 * @param {string} endTime "HH:mm"
 * @param {string} opStart "HH:mm"
 * @param {string} opEnd "HH:mm"
 * @returns {boolean}
 */
function isWithinOperatingHours(startTime, endTime, opStart = '09:00', opEnd = '18:00') {
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);
  const opStartMin = timeToMinutes(opStart);
  const opEndMin = timeToMinutes(opEnd);

  return startMin >= opStartMin && endMin <= opEndMin && startMin < endMin;
}

/**
 * Generate discrete time slots between operating hours.
 * @param {string} opStart e.g. "09:00"
 * @param {string} opEnd e.g. "18:00"
 * @param {number} slotDurationMin e.g. 30
 * @returns {Array<{ startTime: string, endTime: string }>}
 */
function generateTimeSlots(opStart = '09:00', opEnd = '18:00', slotDurationMin = 30) {
  const slots = [];
  const startMin = timeToMinutes(opStart);
  const endMin = timeToMinutes(opEnd);

  for (let current = startMin; current + slotDurationMin <= endMin; current += slotDurationMin) {
    slots.push({
      startTime: minutesToTime(current),
      endTime: minutesToTime(current + slotDurationMin)
    });
  }

  return slots;
}

module.exports = {
  timeToMinutes,
  minutesToTime,
  isOverlapping,
  isDateTimeInPast,
  isWithinOperatingHours,
  generateTimeSlots
};
