const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ============= GET NOTIFICATIONS =============
const getNotifications = async (req, res) => {
  try {
    const userId = req.userId;
    const { unread } = req.query;

    const whereClause = { userId };

    if (unread === "true") {
      whereClause.isRead = false;
    }

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
      },
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get notifications",
      error: error.message,
    });
  }
};

// ============= MARK AS READ =============
const markAsRead = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    await prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true, readAt: new Date() },
    });

    res.json({ success: true, message: "Notification marked as read" });
  } catch (error) {
    console.error("Mark as read error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark notification",
      error: error.message,
    });
  }
};

// ============= MARK ALL AS READ =============
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.userId;

    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    res.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    console.error("Mark all as read error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark all notifications",
      error: error.message,
    });
  }
};

module.exports = { getNotifications, markAsRead, markAllAsRead };