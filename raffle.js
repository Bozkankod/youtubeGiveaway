const fs = require('fs');
const readline = require('readline');

const getUsernames = (filePath) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        console.error('Dosya okunurken bir hata oluştu:', err);
        return;
      }
  
      const comments = JSON.parse(data);
  
      if (comments.length === 0) {
        console.log('Yorumlarda kullanıcı adı bulunamadı.');
      } else {
        const randomIndex = Math.floor(Math.random() * comments.length);
        const randomComment = comments[randomIndex];
        console.log(comments.length +' Kişi arasından kazanan;');
        console.log('----------------------------------------------------------------------------');
        console.log('Kazanan Kullanıcı Adı:', randomComment.username);
        console.log('Kullanıcı URL\'si:', randomComment.userUrl);
        console.log('Yorum Metni:', randomComment.text);
        console.log('----------------------------------------------------------------------------');
      }
    });
  };

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('JSON dosyasının adını girin (yorumlar klasörü altında): ', (fileName) => {
  rl.close();

  const filePath = `yorumlar/${fileName}.json`;

  getUsernames(filePath);
});