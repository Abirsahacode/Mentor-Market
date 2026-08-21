import db from "../config/db.js";
import Notification from "./Notification.js";

export const REFERRAL_MILESTONES = [
  { key: "starter_ambassador", count: 1, name: "Starter Ambassador", reward: "5% Fee Discount", icon: "Award" },
  { key: "community_builder", count: 3, name: "Community Builder", reward: "10% Fee Discount", icon: "Users" },
  { key: "master_advocate", count: 5, name: "Master Advocate", reward: "15% Fee Discount", icon: "Zap" },
  { key: "legendary_scholar", count: 10, name: "Legendary Scholar", reward: "20% Fee Discount", icon: "Trophy" },
];

export const maskEmail = (email = "") => {
  if (!email || !email.includes("@")) return "Learner";
  const [local, domain] = email.split("@");
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
};

const Referral = {
  async generateUniqueCode(fullName = "STUDENT") {
    const cleanName = String(fullName || "STUDENT")
      .toUpperCase()
      .replace(/[^A-Z]/g, "")
      .slice(0, 6) || "STUDENT";

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      const code = `REF-${cleanName}${randomSuffix}`;
      try {
        const [existing] = await db.query("SELECT id FROM users WHERE UPPER(referral_code) = UPPER(?) LIMIT 1", [code]);
        if (!existing || !existing.length) return code;
      } catch {
        return code;
      }
    }
    return `REF-${Date.now().toString(36).toUpperCase().slice(-6)}`;
  },

  async getReferredCount(userId) {
    const [[result]] = await db.query(
      "SELECT COUNT(*) AS total FROM users WHERE referred_by_id = ?",
      [userId],
    );
    return Number(result?.total || 0);
  },

  async getReferredStudents(userId) {
    const [rows] = await db.query(
      "SELECT id, full_name, email, created_at FROM users WHERE referred_by_id = ? ORDER BY created_at DESC",
      [userId],
    );
    return rows.map((student) => ({
      id: student.id,
      full_name: student.full_name,
      masked_email: maskEmail(student.email),
      joined_at: student.created_at,
    }));
  },

  async checkAndUnlockBadges(userId) {
    const totalReferrals = await this.getReferredCount(userId);
    const newlyUnlocked = [];

    for (const milestone of REFERRAL_MILESTONES) {
      if (totalReferrals >= milestone.count) {
        const [result] = await db.query(
          `INSERT INTO referral_rewards (user_id, badge_key, badge_name, reward_description)
           VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE id = id`,
          [userId, milestone.key, milestone.name, milestone.reward],
        );
        if (result.affectedRows === 1) {
          newlyUnlocked.push(milestone);
          await Notification.create({
            user_id: userId,
            title: `🏆 New Badge Unlocked: ${milestone.name}!`,
            message: `Congratulations! You referred ${totalReferrals} student(s) and unlocked the ${milestone.name} badge (${milestone.reward}).`,
            type: "system",
            is_read: false,
          });
        }
      }
    }
    return newlyUnlocked;
  },

  async getStats(user, originUrl = "") {
    const userId = user.id;
    let referralCode = user.referral_code;

    if (!referralCode) {
      referralCode = await this.generateUniqueCode(user.full_name);
      await db.query("UPDATE users SET referral_code = ? WHERE id = ?", [referralCode, userId]);
    }

    const totalReferrals = await this.getReferredCount(userId);
    await this.checkAndUnlockBadges(userId);

    const [unlockedRows] = await db.query(
      "SELECT badge_key, badge_name, reward_description, unlocked_at FROM referral_rewards WHERE user_id = ?",
      [userId],
    );
    const unlockedMap = new Map(unlockedRows.map((row) => [row.badge_key, row.unlocked_at]));

    const badges = REFERRAL_MILESTONES.map((milestone) => {
      const isUnlocked = unlockedMap.has(milestone.key);
      return {
        ...milestone,
        unlocked: isUnlocked,
        unlocked_at: isUnlocked ? unlockedMap.get(milestone.key) : null,
      };
    });

    const nextMilestone = REFERRAL_MILESTONES.find((m) => totalReferrals < m.count) || null;
    const previousTarget = REFERRAL_MILESTONES.slice().reverse().find((m) => totalReferrals >= m.count)?.count || 0;
    const targetCount = nextMilestone ? nextMilestone.count : REFERRAL_MILESTONES[REFERRAL_MILESTONES.length - 1].count;
    
    const progressPercentage = nextMilestone
      ? Math.min(100, Math.round(((totalReferrals - previousTarget) / (targetCount - previousTarget)) * 100))
      : 100;

    const referredStudents = await this.getReferredStudents(userId);
    const host = originUrl || process.env.FRONTEND_URL || "http://localhost:5173";
    const shareLink = `${host.replace(/\/+$/, "")}/register?ref=${referralCode}`;

    return {
      referral_code: referralCode,
      share_link: shareLink,
      total_referrals: totalReferrals,
      unlocked_badges_count: unlockedMap.size,
      progress_percentage: progressPercentage,
      next_milestone: nextMilestone ? {
        name: nextMilestone.name,
        required_count: nextMilestone.count,
        remaining: nextMilestone.count - totalReferrals,
        reward: nextMilestone.reward,
      } : null,
      badges,
      referred_students: referredStudents,
    };
  },
};

export default Referral;
