import React from 'react';
import { 
  Award, 
  Sparkles, 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  ChevronRight,
  TrendingUp,
  Droplet
} from 'lucide-react';

export const DonorAchievements = ({ donor }) => {
  const verifiedCount = donor?.verified_donation_count || 0;
  const userAchievements = donor?.achievements || [];

  // Master definition of all achievements
  const allAchievements = [
    {
      key: 'first_donation',
      title: 'First Step',
      emoji: '🩸',
      description: 'Complete your first verified blood donation',
      requiredCount: 1,
      category: 'MILESTONE'
    },
    {
      key: 'regular_donor',
      title: 'Dedicated Donor',
      emoji: '❤️',
      description: 'Complete 3 verified donations across any network facilities',
      requiredCount: 3,
      category: 'MILESTONE'
    },
    {
      key: 'bronze_lifesaver',
      title: 'Bronze Lifesaver',
      emoji: '🥉',
      description: 'Reach 5 verified donations and save up to 15 lives',
      requiredCount: 5,
      category: 'TIER'
    },
    {
      key: 'silver_lifesaver',
      title: 'Silver Lifesaver',
      emoji: '🥈',
      description: 'Reach 10 verified donations across the network',
      requiredCount: 10,
      category: 'TIER'
    },
    {
      key: 'gold_lifesaver',
      title: 'Century Club / Gold Lifesaver',
      emoji: '🥇',
      description: 'Reach 20 verified donations to earn apex donor status',
      requiredCount: 20,
      category: 'TIER'
    },
    {
      key: 'emergency_responder',
      title: 'Emergency Responder',
      emoji: '🚨',
      description: 'Answer an urgent call and donate at a critical emergency camp',
      requiredCount: null,
      category: 'SPECIAL'
    },
    {
      key: 'community_contributor',
      title: 'Community Pillar',
      emoji: '🌍',
      description: 'Contribute across 3 or more distinct healthcare facilities',
      requiredCount: null,
      category: 'SPECIAL'
    }
  ];

  const isUnlocked = (key) => {
    return userAchievements.some((a) => a.key === key);
  };

  // Next tier calculation
  const nextTier = allAchievements.find((a) => a.requiredCount && verifiedCount < a.requiredCount);
  const progressPercent = nextTier ? Math.min(100, Math.round((verifiedCount / nextTier.requiredCount) * 100)) : 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-stone-300/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1 w-max">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Donor Milestone Badges
          </span>
          <h2 className="text-2xl font-bold text-stone-900 mt-1">Impact & Achievements</h2>
          <p className="text-sm text-stone-600">
            Earn permanent milestone badges computed dynamically from your verified medical ledger donations.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-stone-50 px-4 py-2 rounded-2xl border border-stone-200">
          <Award className="w-5 h-5 text-amber-500" />
          <div className="text-xs">
            <strong className="text-sm text-stone-900">{userAchievements.length}</strong> / {allAchievements.length} Unlocked
          </div>
        </div>
      </div>

      {/* Progress to Next Tier Card */}
      {nextTier && (
        <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-neutral-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-stone-700/60 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-semibold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Next Goal on BloodChain
            </span>
            <h3 className="text-xl font-bold">
              {nextTier.emoji} {nextTier.title}
            </h3>
            <p className="text-xs text-stone-300 max-w-md">
              {nextTier.description}. You need <strong>{nextTier.requiredCount - verifiedCount} more verified donation(s)</strong> to unlock this badge.
            </p>
          </div>

          <div className="w-full md:w-64 space-y-2">
            <div className="flex justify-between text-xs font-mono text-stone-400">
              <span>{verifiedCount} done</span>
              <span>{nextTier.requiredCount} needed</span>
            </div>
            <div className="w-full h-3 bg-stone-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-400 to-rose-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="text-right text-[10px] font-mono text-amber-300 font-bold">
              {progressPercent}% Complete
            </div>
          </div>
        </div>
      )}

      {/* Badges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allAchievements.map((badge) => {
          const unlocked = isUnlocked(badge.key);

          return (
            <div
              key={badge.key}
              className={`rounded-2xl p-5 border transition flex items-start gap-4 ${
                unlocked
                  ? 'bg-white border-amber-200/90 shadow-sm hover:shadow-md'
                  : 'bg-stone-100/60 border-stone-200/80 opacity-75'
              }`}
            >
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-inner ${
                  unlocked
                    ? 'bg-gradient-to-tr from-amber-100 via-amber-50 to-yellow-100 border border-amber-300'
                    : 'bg-stone-200 text-stone-400 border border-stone-300'
                }`}
              >
                {unlocked ? badge.emoji : <Lock className="w-5 h-5 text-stone-400" />}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <h4 className={`text-sm font-bold ${unlocked ? 'text-stone-900' : 'text-stone-500'}`}>
                    {badge.title}
                  </h4>
                  {unlocked && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  )}
                </div>

                <p className="text-xs text-stone-500 leading-relaxed">
                  {badge.description}
                </p>

                <div className="pt-1">
                  <span
                    className={`inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      unlocked
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-stone-200/70 text-stone-500'
                    }`}
                  >
                    {unlocked ? 'UNLOCKED' : 'LOCKED'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
