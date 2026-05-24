import { BlogPost, SchoolClass, Term } from "@/types/models";

export const sampleClasses: SchoolClass[] = [
  {
    id: "class-1",
    title_sr: "Dajmo im reci",
    title_en: "Let's Give Them Words",
    description_sr:
      "Uzrast 1-3 godine. Neophodno je prisustvo jednog roditelja po detetu. Subotom od 10:00 do 11:20, svake subote od 5. septembra do 19. decembra 2026. Ukupno 16 casova.",
    description_en:
      "Ages 1-3. One parent per child is required. Saturdays from 10:00 to 11:20, every Saturday from September 5 to December 19, 2026. Total of 16 classes.",
    ageGroup: "1-3",
    level: "Pocetni",
    price: 24000,
    type: "semester",
    active: true,
  },
  {
    id: "class-2",
    title_sr: "Pricajmo zajedno",
    title_en: "Let's Speak Together",
    description_sr:
      "Uzrast 3-5 godina. Prisustvo roditelja po dogovoru. Subotom od 11:30 do 12:50, svake subote od 5. septembra do 19. decembra 2026. Ukupno 16 casova.",
    description_en:
      "Ages 3-5. Parent attendance is by agreement. Saturdays from 11:30 to 12:50, every Saturday from September 5 to December 19, 2026. Total of 16 classes.",
    ageGroup: "3-5",
    level: "Srednji",
    price: 24000,
    type: "semester",
    active: true,
  },
  {
    id: "class-3",
    title_sr: "Nasi skolarci",
    title_en: "Our Young Schoolers",
    description_sr:
      "Uzrast 5-7 godina. Dete prisustvuje casu samostalno. Subotom od 13:00 do 14:20, svake subote od 5. septembra do 19. decembra 2026. Ukupno 16 casova.",
    description_en:
      "Ages 5-7. Children attend independently. Saturdays from 13:00 to 14:20, every Saturday from September 5 to December 19, 2026. Total of 16 classes.",
    ageGroup: "5-7",
    level: "Pripremni",
    price: 24000,
    type: "semester",
    active: true,
  },
];

export const sampleTerms: Term[] = [
  {
    id: "term-1",
    classId: "class-1",
    title_sr: "Jesen 2026 - Dajmo im reci u 10:00",
    title_en: "Autumn 2026 - Let's Give Them Words at 10:00",
    date: "2026-09-05",
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
    title_sr: "Jesen 2026 - Pricajmo zajedno u 11:30",
    title_en: "Autumn 2026 - Let's Speak Together at 11:30",
    date: "2026-09-05",
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
    title_sr: "Jesen 2026 - Nasi skolarci u 13:00",
    title_en: "Autumn 2026 - Our Young Schoolers at 13:00",
    date: "2026-09-05",
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
