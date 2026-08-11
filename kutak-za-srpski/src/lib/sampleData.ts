import { BlogPost, SchoolClass, Term } from "@/types/models";

export const sampleClasses: SchoolClass[] = [
  {
    id: "class-1",
    title_sr: "Prve reči",
    title_en: "First Words",
    shortDescription_sr: "Uzrast od 1 do 3 godine uz obavezno prisustvo roditelja i pažljivo vođeno rano jezičko okruženje.",
    shortDescription_en: "Ages 1 to 3 with parent participation and a carefully guided early language environment.",
    description_sr:
      "Uzrast od 1 do 3 godine. Obavezno prisustvo najmanje jednog roditelja ili drugog odraslog člana porodice. Subotom od 10:00 do 11:20, svake subote od 12. septembra do 19. decembra 2026. Ukupno 15 časova. Cena semestra: $450.",
    description_en:
      "Ages 1 to 3. At least one parent or adult family member required at every class. Saturdays from 10:00 to 11:20, every Saturday from September 12 to December 19, 2026. Total of 15 classes. Semester price: $450.",
    ageGroup: "1–3 godine",
    level: "Pocetni",
    price: 450,
    type: "semester",
    active: true,
  },
  {
    id: "class-2",
    title_sr: "Prve priče",
    title_en: "First Stories",
    shortDescription_sr: "Uzrast od 3 do 5 godina sa razvojem govora kroz priču, igru i pažljivo strukturisane aktivnosti.",
    shortDescription_en: "Ages 3 to 5 with language growth through stories, play, and carefully structured activities.",
    description_sr:
      "Uzrast od 3 do 5 godina. Prisustvo roditelja po dogovoru. Subotom od 11:30 do 12:50, svake subote od 12. septembra do 19. decembra 2026. Ukupno 15 časova. Cena semestra: $450.",
    description_en:
      "Ages 3 to 5. Parent attendance by agreement. Saturdays from 11:30 to 12:50, every Saturday from September 12 to December 19, 2026. Total of 15 classes. Semester price: $450.",
    ageGroup: "3–5 godina",
    level: "Srednji",
    price: 450,
    type: "semester",
    active: true,
  },
  {
    id: "class-3",
    title_sr: "Školarci",
    title_en: "Young Schoolers",
    shortDescription_sr: "Uzrast od 5 do 7 godina sa fokusom na govor, razumevanje, pismenost i sigurnost u jeziku.",
    shortDescription_en: "Ages 5 to 7 with a focus on speaking, comprehension, literacy, and confidence in the language.",
    description_sr:
      "Uzrast od 5 do 7 godina. Prisustvo roditelja po dogovoru. Subotom od 13:00 do 14:20, svake subote od 12. septembra do 19. decembra 2026. Ukupno 15 časova. Cena semestra: $450.",
    description_en:
      "Ages 5 to 7. Parent attendance by agreement. Saturdays from 13:00 to 14:20, every Saturday from September 12 to December 19, 2026. Total of 15 classes. Semester price: $450.",
    ageGroup: "5–7 godina",
    level: "Pripremni",
    price: 450,
    type: "semester",
    active: true,
  },
];

export const sampleTerms: Term[] = [
  {
    id: "term-1",
    classId: "class-1",
    title_sr: "Jesen 2026 - Prve reči u 10:00",
    title_en: "Autumn 2026 - First Words at 10:00",
    date: "2026-09-12",
    startTime: "10:00",
    endTime: "11:20",
    capacity: 10,
    overbookLimit: 2,
    bookedCount: 0,
    location: "Ucionica Kutka",
    active: true,
  },
  {
    id: "term-2",
    classId: "class-2",
    title_sr: "Jesen 2026 - Prve priče u 11:30",
    title_en: "Autumn 2026 - First Stories at 11:30",
    date: "2026-09-12",
    startTime: "11:30",
    endTime: "12:50",
    capacity: 10,
    overbookLimit: 2,
    bookedCount: 0,
    location: "Ucionica Kutka",
    active: true,
  },
  {
    id: "term-3",
    classId: "class-3",
    title_sr: "Jesen 2026 - Školarci u 13:00",
    title_en: "Autumn 2026 - Young Schoolers at 13:00",
    date: "2026-09-12",
    startTime: "13:00",
    endTime: "14:20",
    capacity: 10,
    overbookLimit: 2,
    bookedCount: 0,
    location: "Ucionica Kutka",
    active: true,
  },
];

export const sampleBlogPosts: BlogPost[] = [
  {
    id: "post-1",
    slug: "uskoro-prvi-saveti-za-roditelje",
    title_sr: "Uskoro: prvi saveti za roditelje",
    title_en: "Coming soon: first parent guidance article",
    excerpt_sr:
      "Prvi edukativni tekstovi o razvoju govora i dvojezicnosti stizu sledece nedelje.",
    excerpt_en:
      "Our first educational pieces on speech development and bilingual growth are coming next week.",
    content_sr:
      "Pripremamo kratke, prakticne tekstove za roditelje o tome kako da kod kuce podrze razvoj srpskog jezika.",
    content_en:
      "We are preparing concise, practical articles for families on supporting Serbian language development at home.",
    published: true,
  },
  {
    id: "post-2",
    slug: "prica-iz-kutka-aktivnosti-i-mali-uspeh",
    title_sr: "Prica iz Kutka: aktivnosti i mali uspeh",
    title_en: "A story from Kutak: activities and a small milestone",
    excerpt_sr:
      "Narativni blog postovi donose price iz svakodnevice Kutka, aktivnosti i napredak djaka.",
    excerpt_en:
      "Narrative blog posts will share everyday moments from Kutak, activities and student milestones.",
    content_sr:
      "Zelimo balans: pola sadrzaja edukativno, pola o zivotu Kutka i iskustvima sa casova.",
    content_en:
      "Our plan is balanced content: half educational guidance, half stories from Kutak and classroom life.",
    published: true,
  },
];
