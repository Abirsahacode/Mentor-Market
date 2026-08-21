USE mentor_market;

-- Add referral_code and referred_by_id to users table if they don't already exist
ALTER TABLE users
  ADD COLUMN referral_code VARCHAR(30) UNIQUE AFTER avatar_url,
  ADD COLUMN referred_by_id BIGINT UNSIGNED NULL AFTER referral_code,
  ADD CONSTRAINT fk_users_referred_by FOREIGN KEY (referred_by_id) REFERENCES users(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS referral_rewards (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  badge_key VARCHAR(50) NOT NULL,
  badge_name VARCHAR(100) NOT NULL,
  reward_description VARCHAR(255) NOT NULL,
  unlocked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_referral_rewards_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT uq_user_badge UNIQUE (user_id, badge_key),
  INDEX idx_referral_rewards_user (user_id)
) ENGINE=InnoDB;
