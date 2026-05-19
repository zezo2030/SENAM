# تطبيق SENAM — تطبيق العميل (Flutter · Clean Architecture)

تطبيق موبايل لمنصة **سنم** لحجز الخدمات الموثوقة (غسيل سيارات، حلاقة، تنظيف، صيانة وأكثر).
مبني بمعمارية **Clean Architecture** + **BLoC/Cubit**. النسخة الحالية **استاتيك** —
كل البيانات تأتي من `LocalDataSource` وهمية، وتُربط لاحقاً بالـ Backend API
باستبدال مصدر البيانات فقط دون المساس ببقية الطبقات.

## التشغيل

```bash
cd senam_app
flutter pub get
flutter run
```

## الحزم المستخدمة

| الحزمة | الغرض |
|---|---|
| `flutter_bloc` / `bloc` | إدارة الحالة (Cubit) |
| `get_it` | حقن التبعيات (Dependency Injection) |
| `dartz` | `Either<Failure, T>` لمعالجة الأخطاء |
| `equatable` | مقارنة الكيانات والحالات |

## معمارية المشروع (Clean Architecture)

ثلاث طبقات لكل ميزة، مع اعتماد للداخل فقط (Presentation → Domain ← Data):

```
lib/
├── main.dart                     # نقطة الدخول + تهيئة DI
├── app/
│   ├── main_nav.dart             # الهيكل الرئيسي + الشريط السفلي
│   └── new_order_page.dart       # شاشة "طلب جديد"
├── core/                         # مكونات مشتركة بين كل الميزات
│   ├── error/                    # Failures + Exceptions
│   ├── usecases/                 # العقد الأساسي UseCase
│   ├── theme/                    # الألوان والثيم
│   ├── widgets/                  # عناصر واجهة مشتركة
│   └── di/injection_container.dart  # حاوية حقن التبعيات
└── features/<feature>/
    ├── domain/                   # طبقة المنطق (مستقلة عن أي إطار)
    │   ├── entities/             # الكيانات
    │   ├── repositories/         # عقود المستودعات (abstract)
    │   └── usecases/             # حالات الاستخدام
    ├── data/                     # طبقة البيانات
    │   ├── models/               # نماذج + fromJson/toJson
    │   ├── datasources/          # مصدر البيانات (محلي وهمي حالياً)
    │   └── repositories/         # تنفيذ المستودعات
    ├── presentation/             # طبقة العرض
    │   ├── cubit/                # الـ Cubits + الحالات
    │   ├── pages/                # الشاشات
    │   └── widgets/              # عناصر خاصة بالميزة
    └── di.dart                   # تسجيل تبعيات الميزة
```

### الميزات (features)

| الميزة | الوصف |
|---|---|
| `auth` | Splash · Onboarding · تسجيل الدخول · OTP |
| `home` | الصفحة الرئيسية (تجمّع بيانات من services + offers) |
| `services` | الأقسام · الشركات · تفاصيل الشركة · التقييمات |
| `booking` | تدفق الحجز · تأكيد الطلب |
| `orders` | طلباتي · تتبع الطلب · تقييم الخدمة |
| `offers` | العروض والكوبونات |
| `favorites` | الشركات المفضلة |
| `car_rental` | تأجير السيارات |
| `account` | الحساب · الإشعارات |

## تدفق البيانات

```
Page  →  Cubit  →  UseCase  →  Repository (abstract)
                                     ↑
                          RepositoryImpl  →  DataSource
                          (يحوّل Exception → Failure)
```

كل استدعاء يرجع `Either<Failure, T>`:
- `Left(Failure)` عند الخطأ → الـ Cubit يصدر حالة `failure`.
- `Right(data)` عند النجاح → الـ Cubit يصدر حالة `success`.

## ربط الباك إند لاحقاً

البنية مصممة بحيث لا يتغير سوى **طبقة الـ Data**:

1. أضف `XRemoteDataSource implements XDataSource` يستدعي الـ API عبر `http`/`dio`.
2. غيّر التسجيل في `features/<feature>/di.dart` ليستخدم المصدر البعيد.
3. النماذج (`*_model.dart`) تحتوي مسبقاً على `fromJson` / `toJson`.
4. اربط `auth` بـ Firebase Auth، والخرائط بـ Google Maps، والدفع بـ MyFatoorah.

**لن تحتاج لتعديل أي شيء في طبقتَي Domain أو Presentation.**
