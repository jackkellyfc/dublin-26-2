export const MOTIVATIONAL_QUOTES = [
  { quote: "The miracle isn't that I finished. The miracle is that I had the courage to start.", author: "John Bingham" },
  { quote: "Run when you can, walk if you have to, crawl if you must; just never give up.", author: "Dean Karnazes" },
  { quote: "The body achieves what the mind believes.", author: "Napoleon Hill" },
  { quote: "Pain is temporary. Quitting lasts forever.", author: "Lance Armstrong" },
  { quote: "Every morning in Africa, a gazelle wakes up knowing it must outrun the fastest lion. Every morning a lion wakes up knowing it must run faster than the slowest gazelle. It doesn't matter whether you're a lion or gazelle — when the sun comes up, you'd better be running.", author: "Christopher McDougall" },
  { quote: "I don't run to add days to my life, I run to add life to my days.", author: "Ronald Rook" },
  { quote: "There is magic in misery. Just ask any runner.", author: "Dean Karnazes" },
  { quote: "If you want to become the best runner you can be, start now. Don't spend the rest of your life wondering if you can do it.", author: "Bart Yasso" },
  { quote: "Running is nothing more than a series of arguments between the part of your brain that wants to stop and the part that wants to keep going.", author: "Unknown" },
  { quote: "A 26.2-mile journey begins with a single step.", author: "Dublin 26.2" },
  { quote: "You don't have to be fast. You just have to go.", author: "Unknown" },
  { quote: "Consistency is the true foundation of trust. Either keep your promises or do not make them.", author: "Roy T. Bennett" },
  { quote: "The real purpose of running isn't to win a race. It's to test the limits of the human heart.", author: "Bill Bowerman" },
  { quote: "Marathon running is about patience and persistence, not pace.", author: "Dublin 26.2" },
  { quote: "Your legs are not giving out. Your head is giving up. Keep going.", author: "Unknown" },
  { quote: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { quote: "Every run is a small victory when you're training for something big.", author: "Dublin 26.2" },
  { quote: "The difference between a jogger and a runner is an entry form.", author: "George Sheehan" },
  { quote: "October 26 is coming. Will you be ready?", author: "Dublin 26.2" },
  { quote: "Trust the process. Trust the plan. Trust yourself.", author: "Dublin 26.2" },
]

export const CELEBRATION_MESSAGES = [
  "Crushing it! 💪",
  "Another one in the bag!",
  "The marathon won't know what hit it!",
  "Dublin is calling! 🇮🇪",
  "You showed up. That's what matters.",
  "Building that aerobic engine!",
  "Consistency wins marathons.",
  "Sub-4 is getting closer!",
  "That's the kind of work that pays off on race day.",
  "Every km counts. Keep stacking them up.",
  "You're stronger than yesterday.",
  "This is what marathon runners are made of.",
  "One step closer to the finish line on Merrion Square.",
  "26.2 miles starts with sessions like this.",
  "Rest well tonight. You earned it.",
]

export const getDailyQuote = () => {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24))
  return MOTIVATIONAL_QUOTES[dayOfYear % MOTIVATIONAL_QUOTES.length]
}

export const getRandomCelebration = () => {
  return CELEBRATION_MESSAGES[Math.floor(Math.random() * CELEBRATION_MESSAGES.length)]
}
