export function notFound(req, res) {
  res.status(404).json({ message: 'Route not found.' });
}

export function errorHandler(error, req, res, next) {
  console.error(error);
  if (error.code === '23505') {
    return res.status(409).json({ message: 'You already have a reading for this time slot on this date.' });
  }
  if (error.code === '23503') return res.status(400).json({ message: 'Referenced record does not exist.' });
  res.status(error.status || 500).json({ message: error.status ? error.message : 'Internal server error.' });
}
