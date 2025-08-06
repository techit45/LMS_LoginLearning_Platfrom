export default function handler(req, res) {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Google Drive API is ready',
    timestamp: new Date().toISOString()
  });
}