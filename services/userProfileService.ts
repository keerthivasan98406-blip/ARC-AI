export interface UserProfile {
  name?: string;
  interests: string[];
  preferences: Record<string, string>;
  facts: string[];
  lastUpdated: Date;
}

const STORAGE_KEY = 'arc_ai_user_profile';

export const getUserProfile = (): UserProfile => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const profile = JSON.parse(stored);
    profile.lastUpdated = new Date(profile.lastUpdated);
    return profile;
  }
  return {
    interests: [],
    preferences: {},
    facts: [],
    lastUpdated: new Date()
  };
};

export const saveUserProfile = (profile: UserProfile): void => {
  profile.lastUpdated = new Date();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
};

export const extractUserInfo = (message: string): Partial<UserProfile> => {
  const updates: Partial<UserProfile> = {};
  const lowerMsg = message.toLowerCase();

  // Extract name
  const namePatterns = [
    /my name is (\w+)/i,
    /i am (\w+)/i,
    /call me (\w+)/i,
    /i'm (\w+)/i
  ];
  
  for (const pattern of namePatterns) {
    const match = message.match(pattern);
    if (match) {
      updates.name = match[1];
      break;
    }
  }

  // Extract interests
  const interestPatterns = [
    /i like (.+?)(?:\.|$)/i,
    /i love (.+?)(?:\.|$)/i,
    /i enjoy (.+?)(?:\.|$)/i,
    /i'm interested in (.+?)(?:\.|$)/i,
    /my hobby is (.+?)(?:\.|$)/i,
    /my hobbies are (.+?)(?:\.|$)/i
  ];

  for (const pattern of interestPatterns) {
    const match = message.match(pattern);
    if (match) {
      if (!updates.interests) updates.interests = [];
      updates.interests.push(match[1].trim());
    }
  }

  return updates;
};

export const updateUserProfile = (message: string): void => {
  const profile = getUserProfile();
  const updates = extractUserInfo(message);

  if (updates.name) {
    profile.name = updates.name;
  }

  if (updates.interests && updates.interests.length > 0) {
    updates.interests.forEach(interest => {
      if (!profile.interests.includes(interest)) {
        profile.interests.push(interest);
      }
    });
  }

  saveUserProfile(profile);
};

export const formatUserProfileForAI = (profile: UserProfile): string => {
  if (!profile.name && profile.interests.length === 0 && profile.facts.length === 0) {
    return '';
  }

  let context = '\n\nUSER PROFILE (Information learned about the current user):';
  
  if (profile.name) {
    context += `\n- User's name: ${profile.name}`;
  }

  if (profile.interests.length > 0) {
    context += `\n- Interests: ${profile.interests.join(', ')}`;
  }

  if (profile.facts.length > 0) {
    context += `\n- Additional facts: ${profile.facts.join('; ')}`;
  }

  context += '\n- Use this information to personalize responses when appropriate.';

  return context;
};
