const mongoose = require("mongoose");
const { Schema } = mongoose;

const feeChalanSchema = new Schema(
  {
    client: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    clientName: {
      type: String,
      required: true,
    },
    clientCurrency: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    basicFee: {
      type: Number,
      default: 0,
    },
    totalPaidAmount: {
      type: Number,
      default: 0,
    },
    pendingAmount: {
      type: Number,
      default: function () {
        return this.amount;
      },
    },
    months: {
      type: [String],
      required: true,
    },
    fromDate: {
      type: Date,
      required: true,
    },
    toDate: {
      type: Date,
      required: true,
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    dueMonth: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["paid", "pending", "overdue", "partial"],
      default: "pending",
    },
    paymentDate: {
      type: Date,
    },
    paymentMethod: {
      type: String,
    },
    transactionId: {
      type: String,
    },
    remarks: {
      type: String,
    },
    issuedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    paymentHistory: [
      {
        amount: {
          type: Number,
          required: true, 
        },
        date: {
          type: Date,
          default: Date.now,
        },
        method: {
          type: String,
        },
        receivedBy: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        remarks: {
          type: String,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

feeChalanSchema.methods.updatePaymentStatus = function () {
  const totalPaid = this.paymentHistory.reduce(
    (sum, payment) => sum + (payment.amount || 0),
    0
  );
  this.totalPaidAmount = totalPaid;
  this.pendingAmount = this.amount - totalPaid;

  if (totalPaid >= this.amount) {
    this.status = "paid";
    this.pendingAmount = 0;
  } else if (totalPaid > 0) {
    this.status = "partial";
  } else {
    this.status = "pending";
  }
};

module.exports = mongoose.model("FeeChalan", feeChalanSchema);
