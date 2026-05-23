const { ObjectId } = require("mongodb");
const connectDB = require("../../db/dbConnect");

async function BookService(req, res) {
  try {
    const { service_id, booking_date, notes } = req.body;

    if (!service_id || !booking_date) {
      return res.status(400).json({ success: false, message: "Service ID and booking date are required" });
    }

    if (!ObjectId.isValid(service_id)) {
      return res.status(400).json({ success: false, message: "Invalid service ID" });
    }

    const db = await connectDB();
    const service = await db.collection("services").findOne({ _id: new ObjectId(service_id), status: "Active" });

    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found" });
    }

    const booking = await db.collection("bookings").insertOne({
      user_id: new ObjectId(req.user._id),
      service_id: new ObjectId(service_id),
      booking_date: new Date(booking_date),
      time_slot: "",
      booking_status: "Pending",
      payment_status: "Pending",
      total_amount: service.price,
      notes: notes || "",
      created_at: new Date(),
      updated_at: new Date(),
    });

    return res.status(201).json({ success: true, message: "Service booked successfully. Time slot will be assigned by admin.", booking: booking.insertedId });
  } catch (error) {
    console.error("BookService.js: ", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

module.exports = { BookService };
