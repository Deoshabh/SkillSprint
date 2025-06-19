import { NextRequest, NextResponse } from 'next/server';

const YOUTUBE_API_KEY = 'AIzaSyAY3fyoYHItn5HPEm6rSID2SF9fJJ7z1dU';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const playlistId = searchParams.get('playlistId');

  console.log(`[YouTube API] Fetching playlist: ${playlistId}`);

  if (!playlistId) {
    return NextResponse.json(
      { error: 'Playlist ID is required' },
      { status: 400 }
    );
  }

  // Validate playlist ID format
  if (!/^[a-zA-Z0-9_-]+$/.test(playlistId)) {
    return NextResponse.json(
      { error: 'Invalid playlist ID format' },
      { status: 400 }
    );
  }

  try {
    // First, get playlist details
    const playlistUrl = `https://www.googleapis.com/youtube/v3/playlists?part=snippet,status&id=${playlistId}&key=${YOUTUBE_API_KEY}`;
    console.log(`[YouTube API] Fetching playlist details from: ${playlistUrl}`);
    
    const playlistResponse = await fetch(playlistUrl);

    if (!playlistResponse.ok) {
      console.error(`[YouTube API] Playlist fetch failed: ${playlistResponse.status} ${playlistResponse.statusText}`);
      throw new Error(`Failed to fetch playlist details: ${playlistResponse.statusText}`);
    }

    const playlistData = await playlistResponse.json();
    console.log(`[YouTube API] Playlist response:`, playlistData);

    if (!playlistData.items || playlistData.items.length === 0) {
      return NextResponse.json(
        { error: 'Playlist not found or not accessible' },
        { status: 404 }
      );
    }

    const playlist = playlistData.items[0];

    // Check if playlist is public (optional - some educational content might be unlisted)
    if (playlist.status?.privacyStatus === 'private') {
      return NextResponse.json(
        { error: 'Playlist is private and cannot be accessed' },
        { status: 403 }
      );
    }

    // Get playlist items (videos) with pagination support
    const itemsUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${playlistId}&maxResults=50&key=${YOUTUBE_API_KEY}`;
    console.log(`[YouTube API] Fetching playlist items from: ${itemsUrl}`);
    
    const itemsResponse = await fetch(itemsUrl);

    if (!itemsResponse.ok) {
      console.error(`[YouTube API] Playlist items fetch failed: ${itemsResponse.status} ${itemsResponse.statusText}`);
      throw new Error(`Failed to fetch playlist items: ${itemsResponse.statusText}`);
    }

    const itemsData = await itemsResponse.json();
    const videos = itemsData.items || [];

    console.log(`[YouTube API] Found ${videos.length} videos in playlist`);

    // Filter out private/deleted videos and add additional metadata
    const validVideos = videos.filter((video: any) => 
      video.snippet.title !== 'Private video' && 
      video.snippet.title !== 'Deleted video' &&
      video.contentDetails?.videoId
    ).map((video: any, index: number) => ({
      ...video,
      position: index + 1
    }));

    console.log(`[YouTube API] ${validVideos.length} valid videos after filtering`);

    const response = {
      id: playlist.id,
      title: playlist.snippet.title,
      description: playlist.snippet.description,
      channelTitle: playlist.snippet.channelTitle,
      channelId: playlist.snippet.channelId,
      publishedAt: playlist.snippet.publishedAt,
      thumbnails: playlist.snippet.thumbnails,
      itemCount: validVideos.length,
      totalItems: itemsData.pageInfo?.totalResults || validVideos.length,
      videos: validVideos,
      items: validVideos, // For backward compatibility
      privacyStatus: playlist.status?.privacyStatus || 'unknown'
    };

    console.log(`[YouTube API] Returning playlist data for: ${response.title}`);
    return NextResponse.json(response);

  } catch (error) {
    console.error('[YouTube API] Error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch playlist',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );  }
}

export async function POST(request: NextRequest) {
  try {
    const { playlistUrl } = await request.json();

    console.log(`[YouTube API] POST request with playlist URL: ${playlistUrl}`);

    if (!playlistUrl) {
      return NextResponse.json(
        { error: 'Playlist URL is required' },
        { status: 400 }
      );
    }

    // Extract playlist ID from URL
    const extractPlaylistId = (url: string): string | null => {
      const regex = /[?&]list=([^#\&\?]*)/;
      const match = url.match(regex);
      return match ? match[1] : null;
    };

    const playlistId = extractPlaylistId(playlistUrl);
    if (!playlistId) {
      return NextResponse.json(
        { error: 'Invalid YouTube playlist URL' },
        { status: 400 }
      );
    }

    // Validate playlist ID format
    if (!/^[a-zA-Z0-9_-]+$/.test(playlistId)) {
      return NextResponse.json(
        { error: 'Invalid playlist ID format' },
        { status: 400 }
      );
    }

    // Get playlist details and videos
    console.log(`[YouTube API] Extracted playlist ID: ${playlistId}`);

    // First, get playlist details
    const playlistUrl_api = `https://www.googleapis.com/youtube/v3/playlists?part=snippet,status&id=${playlistId}&key=${YOUTUBE_API_KEY}`;
    console.log(`[YouTube API] Fetching playlist details from: ${playlistUrl_api}`);
    
    const playlistResponse = await fetch(playlistUrl_api);

    if (!playlistResponse.ok) {
      console.error(`[YouTube API] Playlist fetch failed: ${playlistResponse.status} ${playlistResponse.statusText}`);
      throw new Error(`Failed to fetch playlist details: ${playlistResponse.statusText}`);
    }

    const playlistData = await playlistResponse.json();
    console.log(`[YouTube API] Playlist response:`, playlistData);

    if (!playlistData.items || playlistData.items.length === 0) {
      return NextResponse.json(
        { error: 'Playlist not found or not accessible' },
        { status: 404 }
      );
    }

    const playlist = playlistData.items[0];

    // Check if playlist is public
    if (playlist.status?.privacyStatus === 'private') {
      return NextResponse.json(
        { error: 'Playlist is private and cannot be accessed' },
        { status: 403 }
      );
    }

    // Get playlist items (videos) with pagination support
    const itemsUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${playlistId}&maxResults=50&key=${YOUTUBE_API_KEY}`;
    console.log(`[YouTube API] Fetching playlist items from: ${itemsUrl}`);
    
    const itemsResponse = await fetch(itemsUrl);

    if (!itemsResponse.ok) {
      console.error(`[YouTube API] Playlist items fetch failed: ${itemsResponse.status} ${itemsResponse.statusText}`);
      throw new Error(`Failed to fetch playlist items: ${itemsResponse.statusText}`);
    }

    const itemsData = await itemsResponse.json();
    const videos = itemsData.items || [];

    console.log(`[YouTube API] Found ${videos.length} videos in playlist`);

    // Transform videos to match our VideoLink interface
    const transformedVideos = videos
      .filter((video: any) => 
        video.snippet.title !== 'Private video' && 
        video.snippet.title !== 'Deleted video' &&
        video.contentDetails?.videoId
      )
      .map((video: any, index: number) => ({
        id: video.contentDetails.videoId,
        title: video.snippet.title,
        youtubeEmbedUrl: `https://www.youtube.com/embed/${video.contentDetails.videoId}`,
        creator: video.snippet.videoOwnerChannelTitle || playlist.snippet.channelTitle,
        description: video.snippet.description,
        thumbnail: video.snippet.thumbnails?.medium?.url || video.snippet.thumbnails?.default?.url,
        duration: null, // Could be fetched separately if needed
        position: index + 1,
        publishedAt: video.snippet.publishedAt
      }));

    console.log(`[YouTube API] ${transformedVideos.length} valid videos after filtering`);

    const response = {
      id: playlist.id,
      title: playlist.snippet.title,
      description: playlist.snippet.description,
      channelTitle: playlist.snippet.channelTitle,
      channelId: playlist.snippet.channelId,
      publishedAt: playlist.snippet.publishedAt,
      thumbnail: playlist.snippet.thumbnails?.medium?.url || playlist.snippet.thumbnails?.default?.url,
      itemCount: transformedVideos.length,
      totalItems: itemsData.pageInfo?.totalResults || transformedVideos.length,
      videos: transformedVideos,
      privacyStatus: playlist.status?.privacyStatus || 'unknown'
    };

    console.log(`[YouTube API] Returning playlist data for: ${response.title}`);
    return NextResponse.json(response);

  } catch (error) {
    console.error('[YouTube API] POST Error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch playlist',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
