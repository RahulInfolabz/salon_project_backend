const { ObjectId } = require("mongodb");
const connectDB = require("../../db/dbConnect");

async function MyGeneralInquiries(req, res) {
  try {
    const db = await connectDB();
    const inquiries = await db.collection("general_inquiries")
      .find({ user_id: new ObjectId(req.user._id) })
      .sort({ inquiry_date: -1 })
      .toArray();

    return res.status(200).json({ success: true, message: "Inquiries fetched successfully", data: inquiries });
  } catch (error) {
    console.error("MyGeneralInquiries.js: ", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

module.exports = { MyGeneralInquiries };
