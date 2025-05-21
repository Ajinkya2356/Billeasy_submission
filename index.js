// Import our server file
const app = require('./src/server');

// Start the server
app.listen(process.env.PORT || 3000, () => {
  console.log(`Server running on port ${process.env.PORT || 3000}`);
});