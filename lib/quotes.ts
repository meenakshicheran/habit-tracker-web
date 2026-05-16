const QUOTES = [
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
  { text: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma" },
  { text: "Motivation is what gets you started. Habit is what keeps you going.", author: "Jim Ryun" },
  { text: "The secret of your future is hidden in your daily routine.", author: "Mike Murdock" },
  { text: "You don't rise to the level of your goals, you fall to the level of your systems.", author: "James Clear" },
  { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
  { text: "A habit is a formula your brain automatically follows.", author: "Charles Duhigg" },
  { text: "The chains of habit are too light to be felt until they are too heavy to be broken.", author: "Warren Buffett" },
  { text: "Good habits formed at youth make all the difference.", author: "Aristotle" },
  { text: "Your net worth to the world is usually determined by what remains after your bad habits are subtracted.", author: "Benjamin Franklin" },
  { text: "First forget inspiration. Habit is more dependable.", author: "Octavia Butler" },
  { text: "Excellence is not an exception, it is a prevailing attitude.", author: "Colin Powell" },
  { text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn" },
  { text: "It's not what we do once in a while that shapes our lives, but what we do consistently.", author: "Tony Robbins" },
];

export function getDailyQuote(): { text: string; author: string } {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86_400_000
  );
  return QUOTES[dayOfYear % QUOTES.length];
}
