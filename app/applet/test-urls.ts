import https from 'https';

const urls = [
  'https://assets.mixkit.co/videos/preview/mixkit-couple-checking-something-in-a-smartphone-in-a-bar-36452-large.mp4',
  'https://assets.mixkit.co/videos/preview/mixkit-romantic-couple-looking-at-something-on-a-phone-in-the-45791-large.mp4',
  'https://assets.mixkit.co/videos/preview/mixkit-couple-looking-at-selfies-in-their-cell-phone-21292-large.mp4',
  'https://assets.mixkit.co/videos/preview/mixkit-young-couple-walking-in-the-city-at-night-34558-large.mp4',
  'https://assets.mixkit.co/videos/preview/mixkit-couple-laughing-and-talking-in-a-coffee-shop-4017-large.mp4'
];

urls.forEach(url => {
  https.get(url, (res) => {
    console.log(`${url} - Status: ${res.statusCode}`);
  }).on('error', (e) => {
    console.error(e);
  });
});
