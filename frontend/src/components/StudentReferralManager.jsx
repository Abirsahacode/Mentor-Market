import {
  Award, Check, Copy, Crown, Gift, Share2, Sparkles, Trophy, Users, Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../api/axios.js";
import Alert from "./Alert.jsx";
import LoadingSpinner from "./LoadingSpinner.jsx";

const iconMap = {
  Award,
  Users,
  Zap,
  Trophy,
  Crown,
};

export default function StudentReferralManager() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/referrals/stats");
      setStats(response.data.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleCopyCode = async () => {
    if (!stats?.referral_code) return;
    try {
      await navigator.clipboard.writeText(stats.referral_code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      // Fallback if clipboard API unavailable
      setCopiedCode(false);
    }
  };

  const handleCopyLink = async () => {
    if (!stats?.share_link) return;
    try {
      await navigator.clipboard.writeText(stats.share_link);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      setCopiedLink(false);
    }
  };

  if (loading) {
    return (
      <div className="panel referral-manager-card">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="panel referral-manager-card">
        <Alert>{error}</Alert>
        <button type="button" className="button button-ghost" onClick={fetchStats}>
          Try loading again
        </button>
      </div>
    );
  }

  const {
    referral_code,
    share_link,
    total_referrals = 0,
    unlocked_badges_count = 0,
    progress_percentage = 0,
    next_milestone,
    badges = [],
    referred_students = [],
  } = stats || {};

  return (
    <div className="panel referral-manager-card">
      <div className="panel-heading">
        <div>
          <span className="panel-eyebrow"><Sparkles size={14} /> Ambassador Desk</span>
          <h2>Invite Friends & Unlock Rewards</h2>
        </div>
        <span className="badge badge-purple" style={{ fontSize: "0.85rem" }}>
          {total_referrals} {total_referrals === 1 ? "Friend" : "Friends"} Referred · {unlocked_badges_count} Badges Unlocked
        </span>
      </div>

      <div className="referral-share-grid">
        <div className="referral-box referral-code-box">
          <small className="referral-box-label">Your Unique Referral Code</small>
          <div className="referral-input-action">
            <input type="text" readOnly value={referral_code || ""} className="referral-code-input" />
            <button
              type="button"
              className={`button button-small ${copiedCode ? "button-success" : ""}`}
              onClick={handleCopyCode}
            >
              {copiedCode ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy Code</>}
            </button>
          </div>
        </div>

        <div className="referral-box referral-link-box">
          <small className="referral-box-label">Direct Invite Link</small>
          <div className="referral-input-action">
            <input type="text" readOnly value={share_link || ""} className="referral-link-input" />
            <button
              type="button"
              className={`button button-small ${copiedLink ? "button-success" : "button-ghost"}`}
              onClick={handleCopyLink}
            >
              {copiedLink ? <><Check size={14} /> Link Copied</> : <><Share2 size={14} /> Copy Link</>}
            </button>
          </div>
        </div>
      </div>

      {next_milestone ? (
        <div className="referral-progress-card">
          <div className="referral-progress-header">
            <div>
              <strong>Next Reward Milestone: {next_milestone.name}</strong>
              <p>Refer {next_milestone.remaining} more {next_milestone.remaining === 1 ? "friend" : "friends"} to unlock <b>{next_milestone.reward}</b>!</p>
            </div>
            <span className="referral-progress-val">{total_referrals} / {next_milestone.required_count}</span>
          </div>
          <div className="referral-progress-bar-track">
            <div
              className="referral-progress-bar-fill"
              style={{ width: `${progress_percentage}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="referral-progress-card max-level">
          <Sparkles size={18} />
          <div>
            <strong>Top Tier Ambassador Reached!</strong>
            <p>You have unlocked all referral rewards and maximum fee discounts. Thank you for building our community!</p>
          </div>
        </div>
      )}

      <div className="referral-badges-section">
        <h3><Gift size={16} /> Reward Badges & Tiers</h3>
        <div className="referral-badges-grid">
          {badges.map((badge) => {
            const IconComp = iconMap[badge.icon] || Award;
            return (
              <div
                key={badge.key}
                className={`referral-badge-card ${badge.unlocked ? "unlocked" : "locked"}`}
              >
                <div className="referral-badge-icon">
                  <IconComp size={22} />
                </div>
                <div className="referral-badge-info">
                  <div className="referral-badge-top">
                    <h4>{badge.name}</h4>
                    <span className="referral-badge-count">{badge.count} {badge.count === 1 ? "referral" : "referrals"}</span>
                  </div>
                  <span className="referral-badge-reward">{badge.reward}</span>
                  <p className="referral-badge-status">
                    {badge.unlocked ? (
                      <><Check size={12} /> Unlocked {badge.unlocked_at ? `on ${new Date(badge.unlocked_at).toLocaleDateString()}` : ""}</>
                    ) : (
                      <>Requires {badge.count} referrals</>
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {referred_students.length > 0 && (
        <div className="referred-friends-section">
          <h3><Users size={16} /> Your Referred Friends ({referred_students.length})</h3>
          <div className="referred-friends-list">
            {referred_students.map((friend) => (
              <div className="referred-friend-row" key={friend.id}>
                <div className="referred-friend-avatar">
                  {friend.full_name?.charAt(0)?.toUpperCase() || "S"}
                </div>
                <div className="referred-friend-details">
                  <strong>{friend.full_name}</strong>
                  <span>{friend.masked_email}</span>
                </div>
                <div className="referred-friend-date">
                  Joined {new Date(friend.joined_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
