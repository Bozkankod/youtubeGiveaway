require('dotenv').config();
const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
const path = require('path');

const auth = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

const authenticate = () => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Video kimlik numarasını girin: ', (videoId) => {
    rl.close();
    getAuthUrl(videoId);
  });
};

const getAuthUrl = (videoId) => {
  const authUrl = auth.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/youtube.force-ssl']
  });

  console.log('Kimlik doğrulama URL\'si:', authUrl);
  console.log('Yukarıdaki URL\'yi tarayıcınıza kopyalayın, oturum açın ve kimlik doğrulama kodunu alın.');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Kimlik doğrulama kodunu girin: ', (code) => {
    rl.close();
    auth.getToken(code, (err, token) => {
      if (err) {
        console.error('Kimlik doğrulama hatası:', err);
        return;
      }
      auth.setCredentials(token);
      getVideoTitle(videoId);
    });
  });
};

const getVideoTitle = (videoId) => {
  const youtube = google.youtube('v3');
  youtube.videos.list(
    {
      auth: auth,
      part: 'snippet',
      id: videoId
    },
    (err, response) => {
      if (err) {
        console.error('Video başlığını alırken hata oluştu:', err);
        return;
      }
      const videoTitle = response.data.items[0].snippet.title;
      listAllComments(videoId, videoTitle);
    }
  );
};

const listAllComments = (videoId, videoTitle) => {
  const youtube = google.youtube('v3');
  const comments = [];

  const getCommentsPage = (pageToken) => {
    youtube.commentThreads.list(
      {
        auth: auth,
        part: 'snippet',
        videoId: videoId,
        maxResults: 100,
        pageToken: pageToken
      },
      (err, response) => {
        if (err) {
          console.error('Yorumları alırken hata oluştu:', err);
          return;
        }
        
        const pageComments = response.data.items.map(item => {
          const comment = item.snippet.topLevelComment.snippet;
          return {
            username: comment.authorDisplayName,
            userUrl: comment.authorChannelUrl,
            publishedAt: comment.publishedAt,
            text: comment.textDisplay
          };
        });
        comments.push(...pageComments);

        if (response.data.nextPageToken) {
          getCommentsPage(response.data.nextPageToken);
        } else {
          saveCommentsToFile(comments, videoTitle);
        }
      }
    );
  };

  getCommentsPage('');
};

const saveCommentsToFile = (comments, videoTitle) => {
  const sanitizedVideoTitle = videoTitle.replace(/[\\/:*?"<>|]/g, '');
  const fileName = `${sanitizedVideoTitle}_comments.json`;
  const filePath = path.join('yorumlar', fileName);
  const json = JSON.stringify(comments, null, 2);
  fs.writeFile(filePath, json, (err) => {
    if (err) {
      console.error('Dosyaya kaydederken hata oluştu:', err);
      return;
    }
    console.log('Yorumlar başarıyla', fileName, 'dosyasına kaydedildi.');
  });
};

authenticate();
