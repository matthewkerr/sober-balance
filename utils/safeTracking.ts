// Safe Tracking Utilities
// Provides compassionate messaging and safe tracking features

export interface TrackingMode {
  mode: 'sober' | 'trying' | 'reducing' | 'paused';
  description: string;
  encouragement: string;
  icon: string;
}

export const TRACKING_MODES: Record<string, TrackingMode> = {
  sober: { 
    mode: 'sober',
    description: "Staying completely sober", 
    encouragement: "Every day is a victory!",
    icon: "🌟"
  },
  trying: { 
    mode: 'trying',
    description: "Working towards sobriety", 
    encouragement: "Every effort counts!",
    icon: "💪"
  },
  reducing: { 
    mode: 'reducing',
    description: "Cutting back gradually", 
    encouragement: "Progress, not perfection!",
    icon: "📈"
  },
  paused: { 
    mode: 'paused',
    description: "Taking a break from tracking", 
    encouragement: "Self-care is important too!",
    icon: "🤗"
  }
};

export const getEncouragementMessage = (days: number, mode: string): string => {
  if (days === 0) return "Today you chose to start. That's courage.";
  if (days === 1) return "One day at a time. You're doing it!";
  if (days < 7) return "Every day you choose yourself is a victory.";
  if (days < 30) return "You're building something beautiful, one day at a time.";
  if (days < 90) return "Look how far you've come. You're amazing.";
  if (days < 365) return "Your dedication is inspiring. Keep going!";
  return "You are a living example of strength and resilience.";
};

export const getCompassionateAlert = (type: 'reset' | 'delete' | 'pause' | 'skip') => {
  const alerts = {
    reset: {
      title: 'Pause Sobriety Tracking?',
      message: 'Starting over is brave, not failure. Every day you choose to try again is a victory. Would you like to pause your current tracking?',
      buttons: [
        { text: 'Keep Going', style: 'cancel' as const },
        { text: 'Pause with Love', style: 'default' as const }
      ]
    },
    delete: {
      title: 'Remove This Entry?',
      message: 'This was part of your journey. Are you sure you want to remove it?',
      buttons: [
        { text: 'Keep It', style: 'cancel' as const },
        { text: 'Remove', style: 'destructive' as const }
      ]
    },
    pause: {
      title: 'Save for Later?',
      message: 'Your thoughts are valuable. Would you like to save them for later or discard them?',
      buttons: [
        { text: 'Keep Writing', style: 'cancel' as const },
        { text: 'Save for Later', style: 'default' as const },
        { text: 'Discard', style: 'destructive' as const }
      ]
    },
    skip: {
      title: 'Skip Setup?',
      message: 'You can always complete this later in settings. Continue without finishing setup?',
      buttons: [
        { text: 'Go Back', style: 'cancel' as const },
        { text: 'Skip', style: 'default' as const }
      ]
    }
  };
  
  return alerts[type];
};

export const getSuccessMessage = (action: string): string => {
  const messages = {
    saved: 'Your courage to start fresh is inspiring. You can resume tracking anytime in settings.',
    removed: 'Your journey continues.',
    updated: 'Your progress is being honored.',
    paused: 'Self-care comes first - you can always start later.',
    completed: 'Taking time to reflect is a gift to yourself.'
  };
  
  return messages[action] || 'Your effort is appreciated.';
};

export const getContextualReminder = (userState: {
  recentStruggles?: number;
  streak?: number;
  lastCheckIn?: Date;
}): string => {
  if (userState.recentStruggles && userState.recentStruggles > 3) {
    return "You've been through a lot lately. How can we support you today?";
  }
  
  if (userState.streak && userState.streak > 30) {
    return "You're on fire! What's helping you stay strong?";
  }
  
  if (userState.lastCheckIn) {
    const daysSince = Math.floor((Date.now() - userState.lastCheckIn.getTime()) / (24 * 60 * 60 * 1000));
    if (daysSince > 3) {
      return "We miss you! How are you feeling today?";
    }
  }
  
  return "How are you feeling today? Remember, every day counts.";
};

export const formatSobrietyTime = (days: number): string => {
  if (days === 0) return 'Today';
  if (days === 1) return '1 Day';
  if (days < 7) return `${days} Days`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    const remainingDays = days % 7;
    if (remainingDays === 0) return `${weeks} Week${weeks > 1 ? 's' : ''}`;
    return `${weeks} Week${weeks > 1 ? 's' : ''} ${remainingDays} Day${remainingDays > 1 ? 's' : ''}`;
  }
  if (days < 365) {
    const months = Math.floor(days / 30);
    const remainingDays = days % 30;
    if (remainingDays === 0) return `${months} Month${months > 1 ? 's' : ''}`;
    return `${months} Month${months > 1 ? 's' : ''} ${remainingDays} Day${remainingDays > 1 ? 's' : ''}`;
  }
  const years = Math.floor(days / 365);
  const remainingDays = days % 365;
  if (remainingDays === 0) return `${years} Year${years > 1 ? 's' : ''}`;
  return `${years} Year${years > 1 ? 's' : ''} ${remainingDays} Day${remainingDays > 1 ? 's' : ''}`;
};

export const getMilestoneMessage = (days: number): string => {
  const milestones = {
    1: "🎉 One day! You're doing it!",
    3: "🌟 Three days strong! You're building momentum!",
    7: "🎊 One week! Look at your strength!",
    14: "💪 Two weeks! You're incredible!",
    30: "🏆 One month! You're amazing!",
    60: "🌟 Two months! Your dedication is inspiring!",
    90: "🎉 Three months! You're unstoppable!",
    180: "💎 Six months! You're a living example of strength!",
    365: "🏅 One year! You are absolutely incredible!"
  };
  
  return milestones[days] || `🎯 ${days} days! You're doing amazing!`;
};

export const shouldShowMilestone = (days: number): boolean => {
  const milestoneDays = [1, 3, 7, 14, 30, 60, 90, 180, 365];
  return milestoneDays.includes(days);
};
