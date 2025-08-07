// Sample order creation script for testing
// This can be run in MongoDB shell or through a Node.js script

// Insert sample orders for testing
db.orders.insertMany([
  {
    user_id: ObjectId("60d0fe4f5311236168a109ca"), // Replace with actual user ID
    address_id: ObjectId("60d0fe4f5311236168a109cb"), // Replace with actual address ID
    order_status: "pending",
    status: "pending",
    payment_status: "pending",
    total_amount: 150.99,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    user_id: ObjectId("60d0fe4f5311236168a109ca"),
    address_id: ObjectId("60d0fe4f5311236168a109cb"),
    order_status: "completed",
    status: "delivered",
    payment_status: "paid",
    total_amount: 89.50,
    createdAt: new Date(Date.now() - 86400000), // 1 day ago
    updatedAt: new Date(Date.now() - 3600000)   // 1 hour ago
  },
  {
    user_id: ObjectId("60d0fe4f5311236168a109ca"),
    address_id: ObjectId("60d0fe4f5311236168a109cb"),
    order_status: "pending",
    status: "processing",
    payment_status: "paid",
    total_amount: 234.75,
    createdAt: new Date(Date.now() - 172800000), // 2 days ago
    updatedAt: new Date(Date.now() - 7200000)    // 2 hours ago
  }
]);

// Note: Replace ObjectIds with actual IDs from your database
// You can get user IDs with: db.users.find({}, {_id: 1, username: 1})
// You can get address IDs with: db.addresses.find({}, {_id: 1})
