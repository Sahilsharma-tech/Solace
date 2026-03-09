const axios = require('axios');
const config = require('../config');

class MusicService {
  constructor() {
    this.apiKey = config.youtube.apiKey;
    this.hasAPIKey = config.features.useYouTube;
    this.baseUrl = 'https://www.googleapis.com/youtube/v3';
  }

  async getMusicRecommendations(mood, sentimentScore) {
    if (!this.hasAPIKey) {
      console.log('Using fallback music recommendations (no YouTube API key)');
      return this.getFallbackPlaylists(mood);
    }

    try {
      const queries = this.getMoodSearchQueries(mood);
      const allVideos = [];

      for (const query of queries.slice(0, 2)) {
        try {
          const response = await axios.get(`${this.baseUrl}/search`, {
            params: {
              part: 'snippet',
              q: query,
              type: 'video',
              videoCategoryId: '10',
              maxResults: 10,
              key: this.apiKey,
              order: 'relevance'
            }
          });

          if (response.data.items) {
            allVideos.push(...response.data.items);
          }
        } catch (err) {
          console.log(`YouTube search error for "${query}":`, err.message);
        }
      }

      if (allVideos.length > 0) {
        const playlists = this.formatVideosToPlaylists(allVideos, mood);
        return playlists;
      } else {
        return this.getFallbackPlaylists(mood);
      }
    } catch (error) {
      console.error('YouTube API Error:', error.message);
      return this.getFallbackPlaylists(mood);
    }
  }

  getMoodSearchQueries(mood) {
    const moodQueries = {
      'very_sad': ['healing music calm peaceful', 'meditation music sad healing'],
      'sad': ['acoustic music mellow emotional', 'sad indie music comfort'],
      'anxious': ['anxiety relief meditation music', 'calming ambient music relaxing'],
      'stressed': ['stress relief music chill', 'relaxing downtempo lounge music'],
      'neutral': ['chill indie music', 'lofi hip hop study music'],
      'calm': ['peaceful ambient meditation', 'calm nature sounds music'],
      'happy': ['happy upbeat feel good music', 'positive pop indie music'],
      'very_happy': ['party dance energetic music', 'upbeat electronic dance'],
      'energetic': ['workout motivation music', 'energetic rock electronic music'],
      'tired': ['sleep music ambient peaceful', 'relaxing soft music night']
    };

    return moodQueries[mood] || ['chill music', 'relaxing music'];
  }

  formatVideosToPlaylists(videos, mood) {
    if (!videos || videos.length === 0) {
      return this.getFallbackPlaylists(mood);
    }

    const playlists = [];
    const mainTracks = videos.slice(0, 10).map(video => ({
      name: video.snippet.title,
      artist: video.snippet.channelTitle,
      url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
      videoId: video.id.videoId,
      image: video.snippet.thumbnails?.medium?.url || video.snippet.thumbnails?.default?.url,
      description: video.snippet.description
    }));

    playlists.push({
      name: `${moodDescription} Mix`,
      description: `Curated YouTube music for your ${mood} mood`,
      tracks: mainTracks,
      tracksTotal: mainTracks.length,
      url: mainTracks[0]?.url || '#'
    });

    if (videos.length > 10) {
      const secondTracks = videos.slice(10, 20).map(video => ({
        name: video.snippet.title,
        artist: video.snippet.channelTitle,
        url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
        videoId: video.id.videoId,
        image: video.snippet.thumbnails?.medium?.url || video.snippet.thumbnails?.default?.url
      }));

      playlists.push({
        name: `More ${moodDescription}`,
        description: `Additional recommendations for ${mood} mood`,
        tracks: secondTracks,
        tracksTotal: secondTracks.length,
        url: secondTracks[0]?.url || '#'
      });
    }

    return playlists;
  }

  getMoodDescription(mood) {
    const descriptions = {
      'very_sad': '🌙 Healing',
      'sad': '☁️ Comforting',
      'anxious': '🧘 Calming',
      'stressed': '💆 Relaxing',
      'neutral': '📚 Chill',
      'calm': '🌿 Peaceful',
      'happy': '😊 Uplifting',
      'very_happy': '🎉 Energetic',
      'energetic': '⚡ Power',
      'tired': '😴 Soothing'
    };
    return descriptions[mood] || '🎵 Mood';
  }


  getFallbackPlaylists(mood) {
    const moodPlaylists = {
      'very_sad': [
        { 
          name: '🌙 Healing Sounds', 
          description: 'Gentle music for difficult times', 
          url: 'https://www.youtube.com/results?search_query=healing+calm+music', 
          tracksTotal: 50,
          tracks: []
        },
        { 
          name: '☁️ Calm & Peaceful', 
          description: 'Soothing instrumental for reflection', 
          url: 'https://www.youtube.com/results?search_query=peaceful+meditation+music', 
          tracksTotal: 75,
          tracks: []
        }
      ],
      'sad': [
        { 
          name: '🌈 Hope & Comfort', 
          description: 'Music to lift your spirits gently', 
          url: 'https://www.youtube.com/results?search_query=comforting+acoustic+music', 
          tracksTotal: 60,
          tracks: []
        },
        { 
          name: '🎵 Acoustic Calm', 
          description: 'Soft acoustic melodies', 
          url: 'https://www.youtube.com/results?search_query=soft+indie+acoustic', 
          tracksTotal: 100,
          tracks: []
        }
      ],
      'anxious': [
        { 
          name: '🧘 Meditation & Calm', 
          description: 'Reduce anxiety with peaceful music', 
          url: 'https://www.youtube.com/results?search_query=anxiety+relief+meditation', 
          tracksTotal: 80,
          tracks: []
        },
        { 
          name: '🌊 Relaxing Sounds', 
          description: 'Nature-inspired music for relaxation', 
          url: 'https://www.youtube.com/results?search_query=relaxing+nature+sounds', 
          tracksTotal: 45,
          tracks: []
        }
      ],
      'stressed': [
        { 
          name: '💆 Stress Relief', 
          description: 'Let go of tension and relax', 
          url: 'https://www.youtube.com/results?search_query=stress+relief+music', 
          tracksTotal: 90,
          tracks: []
        },
        { 
          name: '🎹 Peaceful Focus', 
          description: 'Calm music for focus and peace', 
          url: 'https://www.youtube.com/results?search_query=peaceful+focus+music', 
          tracksTotal: 70,
          tracks: []
        }
      ],
      'neutral': [
        { 
          name: '📚 Chill Study Beats', 
          description: 'Lo-fi music for concentration', 
          url: 'https://www.youtube.com/results?search_query=lofi+study+beats', 
          tracksTotal: 100,
          tracks: []
        },
        { 
          name: '☕ Coffee Shop Vibes', 
          description: 'Background music for relaxation', 
          url: 'https://www.youtube.com/results?search_query=coffee+shop+indie+music', 
          tracksTotal: 150,
          tracks: []
        }
      ],
      'calm': [
        { 
          name: '🌿 Nature & Relaxation', 
          description: 'Stay peaceful with ambient sounds', 
          url: 'https://www.youtube.com/results?search_query=peaceful+ambient+music', 
          tracksTotal: 60,
          tracks: []
        },
        { 
          name: '✨ Zen Garden', 
          description: 'Maintain your inner calm', 
          url: 'https://www.youtube.com/results?search_query=zen+meditation+music', 
          tracksTotal: 85,
          tracks: []
        }
      ],
      'happy': [
        { 
          name: '😊 Good Vibes Only', 
          description: 'Keep the positivity flowing', 
          url: 'https://www.youtube.com/results?search_query=happy+upbeat+music', 
          tracksTotal: 120,
          tracks: []
        },
        { 
          name: '☀️ Feel Good Hits', 
          description: 'Upbeat songs to boost happiness', 
          url: 'https://www.youtube.com/results?search_query=feel+good+pop+music', 
          tracksTotal: 110,
          tracks: []
        }
      ],
      'very_happy': [
        { 
          name: '🎉 Party Mode', 
          description: 'Celebrate with energetic tracks', 
          url: 'https://www.youtube.com/results?search_query=party+dance+music', 
          tracksTotal: 95,
          tracks: []
        },
        { 
          name: '💃 Dance Energy', 
          description: 'Move to the beat!', 
          url: 'https://www.youtube.com/results?search_query=energetic+dance+music', 
          tracksTotal: 130,
          tracks: []
        }
      ],
      'energetic': [
        { 
          name: '⚡ Workout Power', 
          description: 'High energy for your activities', 
          url: 'https://www.youtube.com/results?search_query=workout+motivation+music', 
          tracksTotal: 140,
          tracks: []
        },
        { 
          name: '🏃 Motivation Mix', 
          description: 'Stay energized and focused', 
          url: 'https://www.youtube.com/results?search_query=energetic+electronic+music', 
          tracksTotal: 105,
          tracks: []
        }
      ],
      'tired': [
        { 
          name: '😴 Sleep Sounds', 
          description: 'Drift off to peaceful music', 
          url: 'https://www.youtube.com/results?search_query=sleep+music+peaceful', 
          tracksTotal: 50,
          tracks: []
        },
        { 
          name: '🌌 Deep Sleep', 
          description: 'Ambient sounds for rest', 
          url: 'https://www.youtube.com/results?search_query=deep+sleep+ambient', 
          tracksTotal: 40,
          tracks: []
        }
      ]
    };

    return moodPlaylists[mood] || [
      { 
        name: '🎵 Wellness Mix', 
        description: 'Curated for your mental wellbeing', 
        url: 'https://www.youtube.com/results?search_query=wellness+mindfulness+music', 
        tracksTotal: 100,
        tracks: []
      },
      { 
        name: '🌟 Mindfulness', 
        description: 'Music for the present moment', 
        url: 'https://www.youtube.com/results?search_query=mindfulness+meditation+music', 
        tracksTotal: 80,
        tracks: []
      }
    ];
  }
}

module.exports = new MusicService();
