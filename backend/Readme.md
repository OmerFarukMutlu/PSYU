📁 migrations/
Sequelize CLI ile oluşturduğun veritabanı tabloları burada tutulur.

Bu klasörde zaman damgasıyla adlandırılmış dosyalar olur.

Örn: 20250729143833-create-user.js

db:migrate komutuyla çalışır.

📁 src/config/
Veritabanı bağlantısı (sequelize.js)

Ortam değişkenleri (dotenv ile .env yüklemesi)

Geliştirme / test / prod ayarları

Öneri: config/sequelize.js içine new Sequelize(...) nesnesini yaz, model dosyaları oradan çeksin.

📁 src/models/
Tüm Sequelize model dosyaları burada.

Her tablo için bir .js dosyası olmalı.

İlişkiler (associate) burada tanımlanır.

Sequelize CLI’yi --models-path=src/models şeklinde kullanman gerekebilir.

📁 src/controllers/
Gelen istekleri karşılayan fonksiyonlar burada olur.

req, res işlemleri burada yapılır.

Örn: UserController.createUser, ProjectController.getProjects

📁 src/services/
İş mantığı (business logic) burada yazılır.

Controller burayı çağırır, bu da modelle konuşur.

Örn: “bir proje oluşturan kullanıcı aynı zamanda proje üyesi de olsun” gibi özel mantıklar burada yazılır.

📁 src/routes/
Express route tanımları burada olur.

Genelde her modül için bir dosya (user.routes.js, project.routes.js)

Router objesi döndürür ve app.js içinde tanıtılır.

📁 src/middlewares/
authMiddleware, errorHandler, validateBody gibi işlemler burada olur.

JWT token kontrolü, hata fırlatma vs.

📁 src/utils/
Yardımcı fonksiyonlar: örn. tarih formatlama, şifre hashleme (bcryptHash, comparePasswords gibi).

Tekrar tekrar kullanılacak basit ama genel fonksiyonları buraya at.

📁 src/views/
Eğer HTML/CSS tabanlı render (SSR) yapacaksan kullanılır.

EJS, Handlebars gibi templating motorlarıyla çalışır.

Ama sen sadece API geliştiriyorsan bu klasör şimdilik boş kalabilir.

📄 app.js
Express uygulamasının giriş noktası.

Middleware'ler, route tanımları, hata yakalama vs. burada yapılır.

sequelize.sync() veya sequelize.authenticate() burada çağrılır.

