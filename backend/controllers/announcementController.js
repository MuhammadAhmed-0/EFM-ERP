const Announcement = require("../models/Announcement");
const mongoose = require("mongoose");

exports.createAnnouncement = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        msg: "Access denied. Only admins can create announcements.",
      });
    }

    const { title, content, recipients } = req.body;

    if (
      !title ||
      !content ||
      !recipients ||
      !Array.isArray(recipients.role) ||
      recipients.role.length === 0
    ) {
      return res.status(400).json({
        msg: "Title, content, and at least one recipient role are required.",
      });
    }

    const announcement = new Announcement({
      title,
      content,
      sender: req.user.id,
      senderRole: req.user.role,
      recipients,
    });

    await announcement.save();

    const io = req.io;
    if (io) {
      const allRoles = [
        "teacher_subjects",
        "teacher_quran",
        "supervisor_quran",
        "supervisor_subjects",
        "client",
        "admin",
      ];
      const targetRoles = recipients.role.includes("all")
        ? allRoles
        : recipients.role;

      targetRoles.forEach((role) => {
        io.to(role).emit("new_announcement", {
          announcement: {
            ...announcement.toObject(),
            isRead: false,
          },
        });
      });

      if (recipients.role.includes("all")) {
        io.to("all").emit("new_announcement", {
          announcement: {
            ...announcement.toObject(),
            isRead: false,
          },
        });
      }
    } else {
      console.log("No IO instance found");
    }
    res.status(201).json({
      msg: "Announcement created successfully",
      announcement,
    });
  } catch (err) {
    console.error("Error in createAnnouncement:", err.message);
    res.status(500).json({ msg: "Server error while creating announcement" });
  }
};

exports.getAnnouncements = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user.id;
    const { role, startDate, endDate } = req.query;

    if (userRole === "admin") {
      const filter = {
        isQuery: { $ne: true },
      };

      if (role) {
        filter["recipients.role"] = role;
      }

      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) {
          const from = new Date(startDate);
          if (isNaN(from)) {
            return res.status(400).json({ msg: "Invalid startDate format" });
          }
          filter.createdAt.$gte = from;
        }
        if (endDate) {
          const to = new Date(endDate);
          if (isNaN(to)) {
            return res.status(400).json({ msg: "Invalid endDate format" });
          }
          to.setHours(23, 59, 59, 999);
          filter.createdAt.$lte = to;
        }
      }

      const announcements = await Announcement.find(filter)
        .populate("readBy.user", "name profilePicture")
        .sort({
          createdAt: -1,
        });

      const transformedAnnouncements = announcements.map((announcement) => ({
        ...announcement._doc,
        readBy: announcement.readBy.map((read) => ({
          user: {
            _id: read.user?._id,
            name: read.user?.name,
            profilePicture: read.user?.profilePicture,
          },
          readAt: read.readAt,
          _id: read._id,
        })),
      }));

      return res.status(200).json({
        count: transformedAnnouncements.length,
        announcements: transformedAnnouncements,
      });
    }

    const validRoles = [
      "student",
      "teacher_quran",
      "teacher_subjects",
      "supervisor_quran",
      "supervisor_subjects",
      "client",
    ];

    if (!validRoles.includes(userRole)) {
      return res
        .status(403)
        .json({ msg: "Access denied. Not allowed to view announcements." });
    }

    const announcements = await Announcement.find({
      isQuery: { $ne: true },
      $or: [{ "recipients.role": userRole }, { "recipients.role": "all" }],
    })
      .populate("readBy.user", "name profilePicture")
      .sort({ createdAt: -1 });

    const announcementsWithReadStatus = announcements.map((announcement) => {
      const readRecord = announcement.readBy.find(
        (read) => read.user && read.user._id.toString() === userId
      );

      return {
        ...announcement._doc,
        isRead: !!readRecord,
        readAt: readRecord ? readRecord.readAt : null,
        readBy: announcement.readBy.map((read) => ({
          user: {
            _id: read.user?._id,
            name: read.user?.name,
            profilePicture: read.user?.profilePicture,
          },
          readAt: read.readAt,
        })),
      };
    });

    res.status(200).json({
      count: announcementsWithReadStatus.length,
      announcements: announcementsWithReadStatus,
    });
  } catch (err) {
    console.error("Error in getAnnouncements:", err.message);
    res.status(500).json({ msg: "Server error while fetching announcements" });
  }
};

exports.updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, recipients } = req.body;
    if (!title && !content && !recipients) {
      return res
        .status(400)
        .json({ msg: "Please provide at least one field to update." });
    }

    const announcement = await Announcement.findById(id);

    if (!announcement) {
      return res.status(404).json({ msg: "Announcement not found" });
    }

    if (title) announcement.title = title;
    if (content) announcement.content = content;
    if (recipients && recipients.role?.length) {
      announcement.recipients = recipients;
    }

    await announcement.save();

    res.status(200).json({
      msg: "Announcement updated successfully",
      announcement,
    });
  } catch (err) {
    console.error("Error in updateAnnouncement:", err.message);
    res.status(500).json({ msg: "Server error while updating announcement" });
  }
};

exports.deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    const announcement = await Announcement.findById(id);

    if (!announcement) {
      return res.status(404).json({ msg: "Announcement not found" });
    }

    await announcement.deleteOne();

    res.status(200).json({ msg: "Announcement deleted successfully" });
  } catch (err) {
    console.error("Error in deleteAnnouncement:", err.message);
    res.status(500).json({ msg: "Server error while deleting announcement" });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    const announcements = await Announcement.find({
      $or: [{ "recipients.role": userRole }, { "recipients.role": "all" }],
      readBy: {
        $not: {
          $elemMatch: { user: userId },
        },
      },
    });

    res.status(200).json({
      count: announcements.length,
    });
  } catch (err) {
    console.error("Error in getUnreadCount:", err.message);
    res.status(500).json({ msg: "Server error while getting unread count" });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { announcementId } = req.params;
    const userId = req.user.id;

    const announcement = await Announcement.findById(announcementId);
    if (!announcement) {
      return res.status(404).json({ msg: "Announcement not found" });
    }

    const alreadyRead = announcement.readBy.some(
      (read) => read.user.toString() === userId
    );

    if (!alreadyRead) {
      announcement.readBy.push({
        user: userId,
        readAt: new Date(),
      });

      await announcement.save();

      const updatedAnnouncement = await Announcement.findById(
        announcementId
      ).populate("readBy.user", "name profilePicture");

      if (req.io) {
        const latestReadBy =
          updatedAnnouncement.readBy[updatedAnnouncement.readBy.length - 1];
        req.io.emit("announcement_read", {
          announcementId,
          userId,
          userName: latestReadBy.user.name,
          userProfilePicture: latestReadBy.user.profilePicture,
          readAt: latestReadBy.readAt,
        });
      }
    }

    res.status(200).json({ msg: "Announcement marked as read" });
  } catch (err) {
    console.error("Error in markAsRead:", err.message);
    res
      .status(500)
      .json({ msg: "Server error while marking announcement as read" });
  }
};


exports.createRoleQuery = async (req, res) => {
  try {
    if (req.user.role === "admin") {
      return res.status(403).json({
        msg: "Admins cannot create queries.",
      });
    }

    const { queryType, description } = req.body;

    if (!queryType || !description) {
      return res.status(400).json({
        msg: "Query type and description are required.",
      });
    }

    const announcement = new Announcement({
      title: `QUERY: ${queryType}`,
      content: description,
      sender: req.user.id,
      senderRole: req.user.role,
      recipients: {
        role: ["admin"],
      },
      isQuery: true, 
    });

    await announcement.save();

    const populatedAnnouncement = await Announcement.findById(
      announcement._id
    ).populate("sender", "name role");

    const io = req.io;
    if (io) {
      io.to("admin").emit("new_query", {
        announcement: {
          ...populatedAnnouncement.toObject(),
          isRead: false,
        },
      });
    }

    res.status(201).json({
      msg: "Query sent successfully to admin",
      announcement: populatedAnnouncement,
    });
  } catch (err) {
    console.error("Error in createRoleQuery:", err.message);
    res.status(500).json({ msg: "Server error while creating query" });
  }
};

exports.respondToQuery = async (req, res) => {
  try {
    const { queryId } = req.params;
    const { response } = req.body;

    if (req.user.role !== "admin") {
      return res.status(403).json({
        msg: "Only admins can respond to queries.",
      });
    }

    if (!response) {
      return res.status(400).json({
        msg: "Response is required.",
      });
    }

    const query = await Announcement.findById(queryId);

    if (!query || !query.title.startsWith("QUERY:")) {
      return res.status(404).json({ msg: "Query not found" });
    }

    const updatedQuery = await Announcement.findByIdAndUpdate(
      queryId,
      {
        response: {
          content: response,
          respondedBy: req.user.id,
          respondedAt: new Date(),
        },
        $push: {
          readBy: {
            user: req.user.id,
            readAt: new Date(),
          },
        },
      },
      { new: true }
    )
      .populate("sender", "name role")
      .populate("response.respondedBy", "name role");

    const io = req.io;
    if (io) {
      io.to(`user:${query.sender}`).emit("query_response", {
        queryId: query._id,
        response: updatedQuery.response,
      });
    }

    res.status(200).json({
      msg: "Response sent successfully",
      query: updatedQuery,
    });
  } catch (err) {
    console.error("Error in respondToQuery:", err.message);
    res.status(500).json({ msg: "Server error while responding to query" });
  }
};

exports.getMyQueries = async (req, res) => {
  try {
    const queries = await Announcement.find({
      sender: req.user.id,
      isQuery: true,
    })
      .populate("sender", "name role")
      .populate("response.respondedBy", "name role")
      .populate("readBy.user", "name profilePicture")
      .sort({ createdAt: -1 });

    const transformedQueries = queries.map((query) => ({
      ...query._doc,
      queryType: query.title.replace("QUERY: ", ""),
      readBy: query.readBy.map((read) => ({
        user: {
          _id: read.user?._id,
          name: read.user?.name,
          profilePicture: read.user?.profilePicture,
        },
        readAt: read.readAt,
      })),
    }));

    res.status(200).json({
      count: transformedQueries.length,
      queries: transformedQueries,
    });
  } catch (err) {
    console.error("Error in getMyQueries:", err.message);
    res.status(500).json({ msg: "Server error while fetching your queries" });
  }
};
exports.getQueries = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        msg: "Only admins can view all queries.",
      });
    }

    const queries = await Announcement.find({
      title: { $regex: "^QUERY:", $options: "i" },
    })
      .populate("sender", "name role staffId")
      .populate("readBy.user", "name profilePicture")
      .sort({ createdAt: -1 });

    const transformedQueries = queries.map((query) => ({
      ...query._doc,
      queryType: query.title.replace("QUERY: ", ""),
      readBy: query.readBy.map((read) => ({
        user: {
          _id: read.user?._id,
          name: read.user?.name,
          profilePicture: read.user?.profilePicture,
        },
        readAt: read.readAt,
      })),
    }));

    res.status(200).json({
      count: transformedQueries.length,
      queries: transformedQueries,
    });
  } catch (err) {
    console.error("Error in getQueries:", err.message);
    res.status(500).json({ msg: "Server error while fetching queries" });
  }
};

exports.deleteMultipleQueries = async (req, res) => {
  try {
    const { role: userRole } = req.user;
    let { queryIds } = req.body;
    if (userRole !== "admin") {
      return res.status(403).json({
        message: "Access denied. Only admin can delete queries.",
      });
    }
    if (!queryIds) {
      return res.status(400).json({
        message: "Query IDs are required.",
      });
    }
    if (typeof queryIds === "string") {
      queryIds = queryIds
        .split(",")
        .map((id) => id.trim())
        .filter((id) => id);
    }
    if (!Array.isArray(queryIds)) {
      queryIds = [queryIds];
    }
    queryIds = queryIds.filter(
      (id) => id && typeof id === "string" && id.trim()
    );

    if (queryIds.length === 0) {
      return res.status(400).json({
        message: "Valid Query IDs array is required and cannot be empty.",
      });
    }
    const invalidIds = queryIds.filter(
      (id) => !mongoose.Types.ObjectId.isValid(id)
    );
    if (invalidIds.length > 0) {
      return res.status(400).json({
        message: "Invalid ObjectId format detected.",
        invalidIds: invalidIds,
      });
    }
    const objectIds = queryIds.map((id) => new mongoose.Types.ObjectId(id));

    if (objectIds.length > 100) {
      return res.status(400).json({
        message: "Cannot delete more than 100 queries at once.",
      });
    }

    const queries = await Announcement.find({
      _id: { $in: objectIds },
      isQuery: true,
    }).populate("sender", "name staffId");

    if (queries.length !== objectIds.length) {
      const foundIds = queries.map((query) => query._id.toString());
      const notFoundIds = queryIds.filter((id) => !foundIds.includes(id));

      return res.status(404).json({
        message: "Some queries not found or are not valid queries.",
        notFoundIds: notFoundIds,
      });
    }

    const totalQueriesCount = queries.length;

    if (totalQueriesCount === 0) {
      return res.status(404).json({
        message: "No queries found for deletion.",
        selectedQueries: [],
        deletedCount: 0,
      });
    }

    const queryTypeCount = queries.reduce((acc, query) => {
      const queryType = query.title.replace("QUERY: ", "");
      acc[queryType] = (acc[queryType] || 0) + 1;
      return acc;
    }, {});

    const senderDetails = queries.map((query) => ({
      queryId: query._id,
      queryType: query.title.replace("QUERY: ", ""),
      senderName: query.sender?.name || "Unknown",
      staffId: query.sender?.staffId || null,
      isResponded: query.readBy?.length > 0,
      createdAt: query.createdAt,
    }));

    const deleteResult = await Announcement.deleteMany({
      _id: { $in: objectIds },
      isQuery: true,
    });

    const io = req.io;
    if (io) {
      io.emit("queries_deleted", {
        deletedCount: deleteResult.deletedCount,
        deletedBy: req.user.name,
      });
    }

    return res.status(200).json({
      message: `Successfully deleted ${deleteResult.deletedCount} quer${
        deleteResult.deletedCount > 1 ? "ies" : "y"
      }.`,
      totalDeleted: deleteResult.deletedCount,
      deletionSummary: {
        byType: queryTypeCount,
        senderDetails: senderDetails,
      },
      deletedBy: {
        name: req.user.name,
        id: req.user._id,
      },
      deletedAt: new Date(),
    });
  } catch (error) {
    console.error("❌ Error deleting multiple queries:", error);
    return res.status(500).json({
      message: "Server error while deleting queries.",
      error: error.message,
    });
  }
};
