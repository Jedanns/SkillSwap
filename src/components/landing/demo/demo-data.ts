/** A skill offering proposed by a peer tutor — what the student browses and picks. */
export type Skill = {
  name: string;
  level: string;
  accent: string;
  /** The peer who proposes (teaches) this skill. */
  tutor: string;
  /** Tutor avatar initial. */
  initial: string;
  rating: number;
  reviews: number;
  blurb: string;
};

export const SKILLS: Skill[] = [
  {
    name: "React",
    level: "Avancé",
    accent: "#c7ddf2",
    tutor: "Maxime D.",
    initial: "M",
    rating: 4.9,
    reviews: 23,
    blurb: "Composants, hooks & un vrai projet pas à pas.",
  },
  {
    name: "Anglais",
    level: "Intermédiaire",
    accent: "#c8f59d",
    tutor: "Sarah L.",
    initial: "S",
    rating: 4.8,
    reviews: 31,
    blurb: "Conversation et préparation aux oraux.",
  },
  {
    name: "Gant",
    level: "Débutant",
    accent: "#ffa06a",
    tutor: "Yanis B.",
    initial: "Y",
    rating: 4.7,
    reviews: 8,
    blurb: "Les bases, à ton rythme et en confiance.",
  },
];
