const { ObjectId } = require("mongodb");
const crypto = require("crypto");
const connectDB = require("../../db/dbConnect");

async function VerifyPayment(req, res) {
  try {
    const { booking_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!booking_id || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "All payment fields are required" });
    }

    if (!ObjectId.isValid(booking_id)) {
      return res.status(400).json({ success: false, message: "Invalid booking ID" });
    }

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid payment signature. Payment verification failed." });
    }

    const db = await connectDB();
    const booking = await db.collection("bookings").findOne({
      _id: new ObjectId(booking_id),
      user_id: new ObjectId(req.user._id),
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (booking.payment_status === "Paid") {
      return res.status(400).json({ success: false, message: "Payment already verified" });
    }

    await db.collection("payments").insertOne({
      user_id: new ObjectId(req.user._id),
      booking_id: new ObjectId(booking_id),
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount: booking.total_amount,
      payment_status: "Paid",
      payment_date: new Date(),
    });

    await db.collection("bookings").updateOne(
      { _id: new ObjectId(booking_id) },
      { $set: { payment_status: "Paid", updated_at: new Date() } }
    );

    return res.status(200).json({ success: true, message: "Payment verified successfully" });
  } catch (error) {
    console.error("VerifyPayment.js: ", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

module.exports = { VerifyPayment };
