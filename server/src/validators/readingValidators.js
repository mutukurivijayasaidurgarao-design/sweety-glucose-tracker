import { z } from 'zod';
import { isValidDateString, utcToday } from '../utils/dates.js';

export const TIME_SLOTS = ['morning_fasting', 'after_breakfast', 'after_lunch', 'after_dinner'];
export const readingSchema = z.object({
  readingDate: z.string().refine(isValidDateString, 'Please provide a valid date.'),
  timeSlot: z.enum(TIME_SLOTS, { errorMap: () => ({ message: 'Please select a valid time slot.' }) }),
  glucoseValue: z.number({ invalid_type_error: 'Please enter a glucose value.' })
    .int('Glucose value must be a whole number.')
    .min(40, 'Value must be between 40 and 600 mg/dl.')
    .max(600, 'Value must be between 40 and 600 mg/dl.'),
}).superRefine((value, ctx) => {
  if (value.readingDate > utcToday()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['readingDate'], message: 'Date cannot be in the future.' });
  }
});
