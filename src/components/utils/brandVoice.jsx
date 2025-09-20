// Queenie's friendly, encouraging notification messages
export const queenieMessages = [
  "Time to spoil your furry friend with some medicine! 💊",
  "Your precious pup needs their daily dose of love (and meds)! 🐕",
  "Reminder: Your kitty's medicine time is here! 🐱",
  "Don't forget - your pet's health is priceless! ⏰",
  "Medicine time! Your pet will thank you later 💝",
  "Your furry family member needs their medication! 🏠",
  "Health check time for your beloved companion! 🩺",
  "Time for some TLC - medication time! 💕",
  "Your pet's wellness routine continues! 🌟",
  "Keeping your pet healthy, one dose at a time! 💪",
  "Medicine time means caring time! 🤗",
  "Your pet's health journey continues today! 🛤️",
  "Time to show your pet some medical love! ❤️",
  "Another step towards your pet's perfect health! ✨",
  "Your furry friend's medicine schedule is calling! 📞",
  "Medication time - because you're the best pet parent! 👏",
  "Your pet's daily health routine is ready! ⭐",
  "Time for medicine - your pet is so lucky to have you! 🍀",
  "Health first! Your pet's medication is due 🥇",
  "Caring for your pet, one medication at a time! 🎯",
  "Your beloved pet's medicine time has arrived! 🎪",
  "Show your pet some love with their daily meds! 💖",
  "Your furry family needs their health boost! 🚀",
  "Medicine o'clock for your precious companion! ⏱️",
  "Time to keep your pet feeling fantastic! 🌈",
  "Your pet's wellness routine is here! 🎊",
  "Medication reminder from your pet's biggest fan! 📣",
  "Your furry friend's health comes first! 🏆",
  "Time to show your pet ultimate care! 👑",
  "Your pet's medicine schedule - powered by love! 💗"
];

export const getRandomQueenieMessage = () => {
  return queenieMessages[Math.floor(Math.random() * queenieMessages.length)];
};