import { Locale } from "@/types/models";

export type ProgramAgeGroupSlug = "1-3" | "3-5" | "5-7";

interface LocalizedProgramAgeGroup {
  slug: ProgramAgeGroupSlug;
  title: string;
  ageLabel: string;
  summary: string;
  goals: string[];
  structure: string[];
}

export const PROGRAM_AGE_GROUPS: Record<Locale, LocalizedProgramAgeGroup[]> = {
  sr: [
    {
      slug: "1-3",
      title: "Dajmo im reci",
      ageLabel: "Uzrast: 1 do 3 godine",
      summary:
        "Program je fokusiran na prve reci, ritam govora i sigurnost u razumevanju kroz igru i blizak kontakt sa roditeljem.",
      goals: [
        "Razvijanje razumevanja jednostavnih fraza i rutina na srpskom jeziku.",
        "Podsticanje aktivnog imenovanja predmeta, radnji i emocija.",
        "Stvaranje pozitivne veze izmedju jezika i zajednicke igre.",
      ],
      structure: [
        "Kratke jeziicke aktivnosti kroz pokret, pesmu i slikovnice.",
        "Modelovanje govora za roditelje koji nastavljaju vezbe kod kuce.",
        "Smireni prelazi izmedju aktivnosti kako bi deca ostala ukljucena.",
      ],
    },
    {
      slug: "3-5",
      title: "Pricajmo zajedno",
      ageLabel: "Uzrast: 3 do 5 godina",
      summary:
        "Program gradi duze recenice, razumevanje uputstava i spontani govor kroz tematske igre i mini-projekte.",
      goals: [
        "Prosirivanje recnika kroz svakodnevne teme i situacije.",
        "Razvijanje sigurnosti u odgovaranju na pitanja i kratkom prepricavanju.",
        "Jacanje slusanja i saradnje u grupnom radu.",
      ],
      structure: [
        "Tematske radionice: porodica, skola, grad, praznici.",
        "Kombinacija grupnih i individualnih govorno-jezickih zadataka.",
        "Jasan ritam casa koji balansira igru, fokus i odmor.",
      ],
    },
    {
      slug: "5-7",
      title: "Nasi skolarci",
      ageLabel: "Uzrast: 5 do 7 godina",
      summary:
        "Program priprema decu za sigurnu upotrebu srpskog jezika u skolskom okruzenju, uz naglasak na govor, razumevanje i pismenost.",
      goals: [
        "Razvijanje govorne preciznosti i bogatijeg recnika.",
        "Uvod u predcitalacke i predpisacke vestine kroz igru i zadatke.",
        "Podsticanje samopouzdanja u javnom nastupu i timskom radu.",
      ],
      structure: [
        "Rad sa pricama, dijalozima i kratkim kreativnim zadacima.",
        "Vezbe razumevanja i povezivanja jezika sa kulturom.",
        "Jasan plan napredovanja kroz semestar i povratna informacija roditeljima.",
      ],
    },
  ],
  en: [
    {
      slug: "1-3",
      title: "Let's Give Them Words",
      ageLabel: "Age: 1 to 3 years",
      summary:
        "This track focuses on first words, language rhythm, and early confidence through play and parent-child participation.",
      goals: [
        "Build comprehension of simple Serbian routines and phrases.",
        "Encourage active naming of objects, actions, and feelings.",
        "Create a positive emotional connection with language learning.",
      ],
      structure: [
        "Short language blocks with movement, songs, and picture books.",
        "Parent coaching moments for carry-over practice at home.",
        "Calm transitions between activities to support attention.",
      ],
    },
    {
      slug: "3-5",
      title: "Let's Speak Together",
      ageLabel: "Age: 3 to 5 years",
      summary:
        "Children practice longer sentences, instruction following, and spontaneous speech through themed activities and mini-projects.",
      goals: [
        "Expand vocabulary through practical everyday topics.",
        "Improve confidence in answering questions and retelling.",
        "Strengthen listening and collaboration in group settings.",
      ],
      structure: [
        "Thematic workshops: family, school, city life, holidays.",
        "Balanced mix of group and individual speaking tasks.",
        "A clear lesson rhythm that combines play, focus, and breaks.",
      ],
    },
    {
      slug: "5-7",
      title: "Our Young Schoolers",
      ageLabel: "Age: 5 to 7 years",
      summary:
        "This track supports school-ready Serbian use with a strong focus on speech clarity, comprehension, and early literacy.",
      goals: [
        "Develop richer vocabulary and more precise expression.",
        "Introduce pre-reading and pre-writing habits through guided activities.",
        "Build confidence for presentations and team-based learning.",
      ],
      structure: [
        "Story-based speaking, dialogue practice, and creative tasks.",
        "Comprehension work connected to culture and context.",
        "Structured semester progression with regular parent updates.",
      ],
    },
  ],
};

export function getProgramAgeGroup(locale: Locale, slug: string) {
  return PROGRAM_AGE_GROUPS[locale].find((group) => group.slug === slug);
}
