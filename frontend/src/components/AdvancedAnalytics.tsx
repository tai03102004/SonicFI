import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ScatterChart, Scatter
} from 'recharts';

interface MarketData {
  token: string;
  price: number;
  change24h: number;
  volume: number;
  marketCap: number;
  sentiment: number;
  technicalScore: number;
  socialMentions: number;
  timestamp: string;
}

interface SentimentData {
  source: string;
  sentiment: number;
  confidence: number;
  volume: number;
  trend: 'up' | 'down' | 'stable';
}

interface TechnicalIndicator {
  name: string;
  value: number;
  signal: 'buy' | 'sell' | 'hold';
  strength: number;
}

interface MarketSignal {
  type: string;
  strength: number;
  confidence: number;
  description: string;
  timestamp: string;
  impact: 'high' | 'medium' | 'low';
}

const mockSentimentData: SentimentData[] = [
  { source: 'Twitter', sentiment: 0.3, confidence: 0.8, volume: 15000, trend: 'up' },
  { source: 'Reddit', sentiment: 0.1, confidence: 0.7, volume: 8500, trend: 'stable' },
  { source: 'News', sentiment: 0.4, confidence: 0.9, volume: 2200, trend: 'up' },
  { source: 'Telegram', sentiment: -0.1, confidence: 0.6, volume: 5600, trend: 'down' }
];

const AdvancedAnalytics: React.FC = () => {
  const [, setMarketData] = useState<MarketData[]>([]);
  const [sentimentData] = useState<SentimentData[]>(mockSentimentData);
  const [technicalIndicators, setTechnicalIndicators] = useState<TechnicalIndicator[]>([]);
  const [marketSignals, setMarketSignals] = useState<MarketSignal[]>([]);
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedToken, setSelectedToken] = useState('BTC');
  const [timeFrame, setTimeFrame] = useState('24h');
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchAllData();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchAllData, 30000);
    setRefreshInterval(interval);
    
    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [selectedToken, timeFrame]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [market, technical, signals, historical] = await Promise.all([
        fetch(`/api/analytics/market?token=${selectedToken}&timeframe=${timeFrame}`).then(r => r.json()),
        fetch(`/api/analytics/sentiment?token=${selectedToken}`).then(r => r.json()),
        fetch(`/api/analytics/technical?token=${selectedToken}`).then(r => r.json()),
        fetch(`/api/analytics/signals?token=${selectedToken}`).then(r => r.json()),
        fetch(`/api/analytics/historical?token=${selectedToken}&timeframe=${timeFrame}`).then(r => r.json())
      ]);
      
      setMarketData(market);
      setTechnicalIndicators(technical);
      setMarketSignals(signals);
      setHistoricalData(historical);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const overallSentiment = useMemo(() => {
    if (!sentimentData.length) return 0;
    const weightedSum = sentimentData.reduce((sum, data) => 
      sum + (data.sentiment * data.confidence * data.volume), 0);
    const totalWeight = sentimentData.reduce((sum, data) => 
      sum + (data.confidence * data.volume), 0);
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }, [sentimentData]);

  const technicalScore = useMemo(() => {
    if (!technicalIndicators.length) return 0;
    const buySignals = technicalIndicators.filter(t => t.signal === 'buy').length;
    const sellSignals = technicalIndicators.filter(t => t.signal === 'sell').length;
    const total = technicalIndicators.length;
    return total > 0 ? ((buySignals - sellSignals) / total) * 100 : 0;
  }, [technicalIndicators]);

  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.3) return '#10B981'; // Green
    if (sentiment > -0.3) return '#F59E0B'; // Yellow
    return '#EF4444'; // Red
  };

  const getSignalIcon = (signal: string) => {
    switch (signal) {
      case 'buy': return '📈';
      case 'sell': return '📉';
      default: return '➡️';
    }
  };

  const renderMarketOverview = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
      <div style={{ border: '1px solid #ddd', borderRadius: '12px', padding: '20px', backgroundColor: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#666' }}>Overall Sentiment</p>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: getSentimentColor(overallSentiment) }}>
              {(overallSentiment * 100).toFixed(1)}%
            </p>
          </div>
          <div style={{ fontSize: '32px' }}>🧠</div>
        </div>
        <div style={{ 
          width: '100%', 
          height: '6px', 
          backgroundColor: '#e5e7eb', 
          borderRadius: '3px',
          marginTop: '10px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${Math.abs(overallSentiment) * 100}%`,
            height: '100%',
            backgroundColor: getSentimentColor(overallSentiment),
            borderRadius: '3px'
          }} />
        </div>
      </div>

      <div style={{ border: '1px solid #ddd', borderRadius: '12px', padding: '20px', backgroundColor: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#666' }}>Technical Score</p>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: getSentimentColor(technicalScore / 100) }}>
              {technicalScore.toFixed(1)}
            </p>
          </div>
          <div style={{ fontSize: '32px' }}>🎯</div>
        </div>
        <div style={{ 
          width: '100%', 
          height: '6px', 
          backgroundColor: '#e5e7eb', 
          borderRadius: '3px',
          marginTop: '10px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${Math.abs(technicalScore)}%`,
            height: '100%',
            backgroundColor: getSentimentColor(technicalScore / 100),
            borderRadius: '3px'
          }} />
        </div>
      </div>

      <div style={{ border: '1px solid #ddd', borderRadius: '12px', padding: '20px', backgroundColor: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#666' }}>Active Signals</p>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>
              {marketSignals.filter(s => s.impact === 'high').length}
            </p>
          </div>
          <div style={{ fontSize: '32px' }}>⚡</div>
        </div>
        <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
          High impact signals detected
        </div>
      </div>

      <div style={{ border: '1px solid #ddd', borderRadius: '12px', padding: '20px', backgroundColor: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#666' }}>Social Volume</p>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#6366f1' }}>
              {sentimentData.reduce((sum, d) => sum + d.volume, 0).toLocaleString()}
            </p>
          </div>
          <div style={{ fontSize: '32px' }}>👥</div>
        </div>
        <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
          Across {sentimentData.length} platforms
        </div>
      </div>
    </div>
  );

  const renderSentimentAnalysis = () => (
    <div style={{ border: '1px solid #ddd', borderRadius: '12px', padding: '20px', backgroundColor: '#fff', marginBottom: '30px' }}>
      <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        🧠 Multi-Source Sentiment Analysis
      </h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        {/* Sentiment Breakdown */}
        <div>
          <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px' }}>Sentiment by Source</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sentimentData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="source" />
              <YAxis domain={[-1, 1]} />
              <Tooltip 
                formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, 'Sentiment']}
              />
              <Bar dataKey="sentiment" fill="#8884d8">
                {sentimentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getSentimentColor(entry.sentiment)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Sentiment vs Volume */}
        <div>
          <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px' }}>Sentiment vs Volume</h4>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart data={sentimentData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="volume" name="Volume" />
              <YAxis dataKey="sentiment" name="Sentiment" domain={[-1, 1]} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter dataKey="confidence" fill="#8884d8" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Sentiment Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px', marginTop: '30px' }}>
        {sentimentData.map((data, index) => (
          <div key={index} style={{
            border: `2px solid ${getSentimentColor(data.sentiment)}`,
            borderRadius: '8px',
            padding: '15px',
            backgroundColor: '#fff'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h5 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', textTransform: 'capitalize' }}>{data.source}</h5>
              <span style={{
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 'bold',
                backgroundColor: data.trend === 'up' ? '#dcfce7' : data.trend === 'down' ? '#fee2e2' : '#f3f4f6',
                color: data.trend === 'up' ? '#166534' : data.trend === 'down' ? '#dc2626' : '#374151'
              }}>
                {data.trend === 'up' ? '↗️' : data.trend === 'down' ? '↘️' : '➡️'} {data.trend}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <span style={{ fontSize: '12px', color: '#666' }}>Sentiment:</span>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: getSentimentColor(data.sentiment) }}>
                  {(data.sentiment * 100).toFixed(1)}%
                </div>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: '#666' }}>Confidence:</span>
                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{(data.confidence * 100).toFixed(0)}%</div>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: '#666' }}>Volume:</span>
                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{data.volume.toLocaleString()}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTechnicalAnalysis = () => (
    <div style={{ border: '1px solid #ddd', borderRadius: '12px', padding: '20px', backgroundColor: '#fff', marginBottom: '30px' }}>
      <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        🎯 Technical Analysis
      </h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        {/* Technical Indicators Radar */}
        <div>
          <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px' }}>Technical Indicators Overview</h4>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={technicalIndicators}>
              <PolarGrid />
              <PolarAngleAxis dataKey="name" />
              <PolarRadiusAxis domain={[0, 100]} />
              <Radar 
                name="Strength" 
                dataKey="strength" 
                stroke="#8884d8" 
                fill="#8884d8" 
                fillOpacity={0.6} 
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Price Action */}
        <div>
          <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px' }}>Price Action</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="price" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Technical Indicators List */}
      <div style={{ marginTop: '30px' }}>
        <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px' }}>Indicator Signals</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          {technicalIndicators.map((indicator, index) => (
            <div key={index} style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '15px',
              backgroundColor: '#fff',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>
                {getSignalIcon(indicator.signal)}
              </div>
              <h5 style={{ margin: '0 0 5px 0', fontSize: '14px', fontWeight: 'bold' }}>{indicator.name}</h5>
              <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '5px' }}>
                {indicator.value.toFixed(2)}
              </div>
              <div style={{
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 'bold',
                backgroundColor: indicator.signal === 'buy' ? '#dcfce7' : indicator.signal === 'sell' ? '#fee2e2' : '#f3f4f6',
                color: indicator.signal === 'buy' ? '#166534' : indicator.signal === 'sell' ? '#dc2626' : '#374151',
                textTransform: 'uppercase'
              }}>
                {indicator.signal}
              </div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                Strength: {indicator.strength.toFixed(0)}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderMarketSignals = () => (
    <div style={{ border: '1px solid #ddd', borderRadius: '12px', padding: '20px', backgroundColor: '#fff', marginBottom: '30px' }}>
      <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        ⚡ Market Signals
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {marketSignals.map((signal, index) => (
          <div key={index} style={{
            border: `2px solid ${signal.impact === 'high' ? '#ef4444' : signal.impact === 'medium' ? '#f59e0b' : '#10b981'}`,
            borderRadius: '8px',
            padding: '15px',
            backgroundColor: '#fff'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  backgroundColor: signal.impact === 'high' ? '#fee2e2' : signal.impact === 'medium' ? '#fef3c7' : '#dcfce7',
                  color: signal.impact === 'high' ? '#dc2626' : signal.impact === 'medium' ? '#d97706' : '#166534',
                  textTransform: 'uppercase'
                }}>
                  {signal.impact}
                </span>
                <h5 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>{signal.type}</h5>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                  Strength: {(signal.strength * 100).toFixed(0)}%
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  Confidence: {(signal.confidence * 100).toFixed(0)}%
                </div>
              </div>
            </div>
            <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#374151' }}>
              {signal.description}
            </p>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {new Date(signal.timestamp).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px', borderBottom: '2px solid #e5e5e5', paddingBottom: '20px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', margin: '0 0 10px 0', color: '#1a1a1a' }}>
          Advanced Analytics Dashboard
        </h1>
        <p style={{ fontSize: '16px', color: '#666', margin: 0 }}>
          Real-time market intelligence powered by AI and multi-source data analysis
        </p>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', alignItems: 'center' }}>
        <select
          value={selectedToken}
          onChange={(e) => setSelectedToken(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          <option value="BTC">Bitcoin (BTC)</option>
          <option value="ETH">Ethereum (ETH)</option>
          <option value="SONIC">Sonic (SONIC)</option>
        </select>

        <select
          value={timeFrame}
          onChange={(e) => setTimeFrame(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '6px',
            fontSize: '14px'
          }}
        >
          <option value="1h">1 Hour</option>
          <option value="24h">24 Hours</option>
          <option value="7d">7 Days</option>
          <option value="30d">30 Days</option>
        </select>

        <button
          onClick={fetchAllData}
          disabled={loading}
          style={{
            padding: '8px 16px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Refreshing...' : '🔄 Refresh'}
        </button>

        <div style={{ marginLeft: 'auto', fontSize: '12px', color: '#666' }}>
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Market Overview */}
      {renderMarketOverview()}

      {/* Sentiment Analysis */}
      {renderSentimentAnalysis()}

      {/* Technical Analysis */}
      {renderTechnicalAnalysis()}

      {/* Market Signals */}
      {renderMarketSignals()}
    </div>
  );
};

export default AdvancedAnalytics;