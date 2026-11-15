export function handleError(error, req, res, next) {
  if (res.headersSent) return next(error)

  if (error.code === 11000) {
    return res.status(409).json({ message: 'That value is already in use.' })
  }

  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'The request body must contain valid JSON.' })
  }

  if (error.type === 'entity.too.large') {
    return res.status(413).json({ message: 'The request body is too large.' })
  }

  if (error.name === 'ValidationError' || error.name === 'CastError') {
    return res.status(400).json({ message: 'The submitted data is invalid.' })
  }

  console.error(error)
  return res.status(500).json({ message: 'Something went wrong.' })
}
