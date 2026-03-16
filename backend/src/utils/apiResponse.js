// backend/src/utils/apiResponse.js
const success = (res, data, message = 'OK', status = 200) => {
  return res.status(status).json({ success: true, data, message });
};

const error = (res, message, status = 500, data = null) => {
  return res.status(status).json({ success: false, data, message });
};

module.exports = { success, error };
