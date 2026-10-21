import { useState } from 'react';
import { BookOpen, ExternalLink, Search, Filter, TrendingUp, Heart, Moon, Brain, Activity } from 'lucide-react';
import { useData } from '../store';

const topicColors: Record<string, string> = {
  'Heart Rate Recovery': 'border-[#ff5252] bg-[#ff5252]/10 text-[#ff5252]',
  'Biomechanics': 'border-[#448aff] bg-[#448aff]/10 text-[#448aff]',
  'Sleep Optimization': 'border-[#b388ff] bg-[#b388ff]/10 text-[#b388ff]',
  'Training Load': 'border-[#ffab40] bg-[#ffab40]/10 text-[#ffab40]',
  'HRV': 'border-[#00e676] bg-[#00e676]/10 text-[#00e676]',
};

const topicIcons: Record<string, typeof Heart> = {
  'Heart Rate Recovery': Heart,
  'Biomechanics': Activity,
  'Sleep Optimization': Moon,
  'Training Load': TrendingUp,
  'HRV': Brain,
};

export default function ScientificTab() {
  const { state } = useData();
  const [selectedTopic, setSelectedTopic] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);

  const journals = state.journals;
  const runs = state.runSessions;
  const daily = state.dailyMetrics;
  const profile = state.profile;

  const topics = ['All', ...new Set(journals.map(a => a.topic))];

  const filteredArticles = journals.filter(article => {
    const matchesTopic = selectedTopic === 'All' || article.topic === selectedTopic;
    const matchesSearch = searchQuery === '' || 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.authors.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTopic && matchesSearch;
  });

  // Generate dynamic user correlation based on actual data
  const getDynamicCorrelation = (article: typeof journals[0]) => {
    const latestRun = runs[0];
    switch (article.topic) {
      case 'Heart Rate Recovery':
        return latestRun
          ? `Your HRR of ${latestRun.recoveryRate}bpm/2min ${latestRun.recoveryRate >= 14 ? 'exceeds' : 'is below'} the healthy threshold. ${latestRun.recoveryRate >= 14 ? 'Continue tempo runs to maintain.' : 'Add more aerobic base work.'}`
          : 'Import running data to see your HRR correlation.';
      case 'Biomechanics':
        return latestRun
          ? `Your GCT of ${latestRun.gct}ms and cadence of ${latestRun.cadence}spm ${latestRun.gct < 230 ? 'are in the optimal range' : 'could benefit from plyometric work'}.`
          : 'Import running data to see biomechanical analysis.';
      case 'Sleep Optimization':
        return `Your deep sleep of ${daily.deepSleep}h (${((daily.deepSleep/daily.sleepDuration)*100).toFixed(0)}%) ${daily.deepSleep/daily.sleepDuration > 0.2 ? 'exceeds the 20% athletic minimum' : 'is below optimal — focus on sleep hygiene'}.`;
      case 'Training Load':
        return `Your total training load of ${runs.reduce((s, r) => s + r.trainingLoad, 0)} across ${runs.length} sessions ${runs.length >= 3 ? 'shows consistent training' : 'needs more data for accurate assessment'}. HRV at ${daily.hrv}ms ${daily.hrv >= 55 ? 'supports current load' : 'suggests reducing intensity'}.`;
      case 'HRV':
        return `Your HRV of ${daily.hrv}ms is ${daily.hrv >= 60 ? 'excellent' : daily.hrv >= 50 ? 'good' : 'below optimal'} for age ${profile.age}. Use morning readings to guide training intensity.`;
      default:
        return article.userCorrelation;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen size={16} className="text-[#b388ff]" />
          <h2 className="text-sm font-semibold">Scientific Insights & PubMed</h2>
        </div>
        <p className="text-xs text-[#8888a0]">
          Evidence-based research correlated with your {runs.length} imported activities
        </p>
      </div>

      {/* Search & Filter */}
      <div className="glass-card p-3">
        <div className="relative mb-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555570]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search articles, authors, topics..."
            className="w-full bg-[#12121a] border border-[#2a2a3a] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#f0f0f5] placeholder-[#555570] focus:outline-none focus:border-[#b388ff]/50"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <Filter size={12} className="text-[#555570] flex-shrink-0" />
          {topics.map((topic) => (
            <button
              key={topic}
              onClick={() => setSelectedTopic(topic)}
              className={`text-[10px] px-2.5 py-1 rounded-full whitespace-nowrap transition-all ${
                selectedTopic === topic
                  ? 'bg-[#b388ff]/20 text-[#b388ff] border border-[#b388ff]/30'
                  : 'bg-[#12121a] text-[#8888a0] border border-[#2a2a3a] hover:border-[#b388ff]/30'
              }`}
            >
              {topic}
            </button>
          ))}
        </div>
      </div>

      {/* Articles */}
      <div className="space-y-3">
        {filteredArticles.map((article) => {
          const isExpanded = expandedArticle === article.id;
          const TopicIcon = topicIcons[article.topic] || BookOpen;
          const dynamicCorrelation = getDynamicCorrelation(article);
          
          return (
            <div
              key={article.id}
              className="glass-card p-4 cursor-pointer transition-all"
              onClick={() => setExpandedArticle(isExpanded ? null : article.id)}
            >
              {/* Article Header */}
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${topicColors[article.topic] || 'border-[#555570] bg-[#555570]/10 text-[#555570]'}`}>
                  <TopicIcon size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-semibold leading-snug mb-1">{article.title}</h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] text-[#8888a0]">{article.authors}</span>
                    <span className="text-[10px] text-[#555570]">•</span>
                    <span className="text-[10px] text-[#8888a0]">{article.journal}</span>
                    <span className="text-[10px] text-[#555570]">•</span>
                    <span className="text-[10px] text-[#555570]">{article.year}</span>
                  </div>
                </div>
                <ExternalLink size={12} className="text-[#555570] flex-shrink-0" />
              </div>

              {/* Topic Badge */}
              <div className="mt-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${topicColors[article.topic] || 'border-[#555570] text-[#555570]'}`}>
                  {article.topic}
                </span>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-[#2a2a3a]/30 space-y-3 animate-slide-up">
                  {/* Summary */}
                  <div>
                    <h4 className="text-[10px] font-semibold text-[#8888a0] mb-1">Summary</h4>
                    <p className="text-xs text-[#f0f0f5] leading-relaxed">{article.summary}</p>
                  </div>

                  {/* Key Takeaways */}
                  <div>
                    <h4 className="text-[10px] font-semibold text-[#00e676] mb-1.5">Key Takeaways</h4>
                    <ul className="space-y-1.5">
                      {article.keyTakeaways.map((takeaway, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-[#00e676] text-xs mt-0.5">✓</span>
                          <span className="text-xs text-[#f0f0f5] leading-relaxed">{takeaway}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* User Correlation - Dynamic based on imported data */}
                  <div className="p-3 rounded-xl bg-[#448aff]/5 border border-[#448aff]/20">
                    <h4 className="text-[10px] font-semibold text-[#448aff] mb-1">📊 Your Data Correlation (Live)</h4>
                    <p className="text-xs text-[#8888a0] leading-relaxed">{dynamicCorrelation}</p>
                    {runs.length === 0 && (
                      <p className="text-[10px] text-[#ffab40] mt-2">⚠️ Import activities in the Import tab for personalized correlations.</p>
                    )}
                  </div>

                  {/* DOI Link */}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[9px] text-[#555570]">PubMed ID: {article.pubmedId}</span>
                    <span className="text-[9px] text-[#555570]">•</span>
                    <span className="text-[9px] text-[#448aff]">DOI: {article.doi}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredArticles.length === 0 && (
        <div className="glass-card p-8 text-center">
          <BookOpen size={32} className="mx-auto text-[#555570] mb-3" />
          <p className="text-xs text-[#8888a0]">No articles found matching your criteria.</p>
        </div>
      )}

      {/* Info Footer */}
      <div className="glass-card p-3 border-l-2 border-l-[#b388ff]">
        <p className="text-[10px] text-[#8888a0] leading-relaxed">
          📚 All articles sourced from peer-reviewed journals (PubMed, ACSM, BMJ). 
          Correlations update dynamically based on your imported data.
          {runs.length > 0 && ` Currently correlating with ${runs.length} activities.`}
        </p>
      </div>
    </div>
  );
}
