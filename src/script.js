const clientId = '4daa1a44cd224ad58c71fa8206645f58'; // Replace with your client ID
const params = new URLSearchParams(window.location.search);
const code = params.get("code");

if (!code) {
    redirectToAuthCodeFlow(clientId);
} else {
    const accessToken = await getAccessToken(clientId, code);
    const profile = await fetchProfile(accessToken);

    getUserTopTracks(accessToken);

    getUserPlaylists(accessToken);

    getUserQueue(accessToken);


    console.log({accessToken});
    
    // console.log('Fetching most recently played track...');
    const mostRecentlyPlayedTrack = await getMostRecentlyPlayedTrack(accessToken);
    
    // console.log('Successfully fetched most recently played track.');
    
    // console.log('Displaying most recently played track...');
    
    // console.log(`Most recently played track is "${mostRecentlyPlayedTrack.name}" by "${mostRecentlyPlayedTrack.artists[0].name}".`);
    populateUI(profile);
}

export async function redirectToAuthCodeFlow(clientId) {
    const verifier = generateCodeVerifier(128);
    const challenge = await generateCodeChallenge(verifier);

    localStorage.setItem("verifier", verifier);

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("response_type", "code");
    params.append("redirect_uri", "http://localhost:5173/callback");
    params.append("scope", "user-read-private user-read-email user-top-read user-read-recently-played user-read-playback-state");
    params.append("code_challenge_method", "S256");
    params.append("code_challenge", challenge);

    document.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
    setTimeout(redirectToAuthCodeFlow, 5000);
}

function generateCodeVerifier(length) {
    let text = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

async function generateCodeChallenge(codeVerifier) {
    const data = new TextEncoder().encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}


export async function getAccessToken(clientId, code) {
    const verifier = localStorage.getItem("verifier");

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", "http://localhost:5173/callback");
    params.append("code_verifier", verifier);

    const result = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params
    });

    const { access_token } = await result.json();
    return access_token;
}

async function fetchProfile(token) {
    const result = await fetch("https://api.spotify.com/v1/me", {
        method: "GET", headers: { Authorization: `Bearer ${token}` }
    });

    return await result.json();
}

async function getMostRecentlyPlayedTrack(token) {
    const params = new URLSearchParams();
    params.append("limit", "1"); // Retrieve only the most recent track
    
    const result = await fetch("https://api.spotify.com/v1/me/player/recently-played", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      params: params
    });
    
    if (result.status === 200) {
      const recentlyPlayed = await result.json();
      if (recentlyPlayed.items.length > 0) {
        const mostRecentlyPlayedTrack = recentlyPlayed.items[0].track;
        console.log(mostRecentlyPlayedTrack);
        return mostRecentlyPlayedTrack;
      } else {
        console.log("No recently played tracks found.");
        return null;
      }
    } else {
      console.log("Error retrieving recently played tracks:", result.status);
      return null;
    }
  }


  async function getUserPlaylists(token) {
    const result = await fetch("https://api.spotify.com/v1/me/playlists", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
  
    if (result.status === 200) {
      const playlists = await result.json();
      console.log(playlists);
      return playlists;
    } else {
      console.log("Error retrieving user playlists:", result.status);
      return null;
    }
  }

  async function getUserTopTracks(token) {
    const result = await fetch("https://api.spotify.com/v1/me/top/tracks?time_range=long_term&limit=5", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
  
    if (result.status === 200) {
      const topTracks = await result.json();
      console.log(topTracks);
      return topTracks;
    } else {
      console.log("Error retrieving user's top tracks:", result.status);
      return null;
    }
  }
  
  async function getUserQueue(token) {
    const result = await fetch("https://api.spotify.com/v1/me/player/queue", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
  
    if (result.status === 200) {
      const queue = await result.json();
      console.log(queue);
      return queue;
    } else {
      console.log("Error retrieving user's queue:", result.status);
      return null;
    }
  }
  
  

function populateUI(profile) {
    document.getElementById("displayName").innerText = profile.display_name;
    if (profile.images[0]) {
        const profileImage = new Image(200, 200);
        profileImage.src = profile.images[0].url;
        document.getElementById("avatar").appendChild(profileImage);
        document.getElementById("imgUrl").innerText = profile.images[0].url;
    }
    document.getElementById("id").innerText = profile.id;
    document.getElementById("email").innerText = profile.email;
    document.getElementById("uri").innerText = profile.uri;
    document.getElementById("uri").setAttribute("href", profile.external_urls.spotify);
    document.getElementById("url").innerText = profile.href;
    document.getElementById("url").setAttribute("href", profile.href);
    

    // // Display the most recently played track.
    // document.getElementById("recently-played").innerText = `${mostRecentlyPlayedTrack.name} by ${mostRecentlyPlayedTrack.artists[0].name}`;
    
}