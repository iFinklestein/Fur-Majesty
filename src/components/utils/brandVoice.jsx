// Fur Majesty – Brand Voice messages
// These provide a warm, professional, and caring tone for pet owners

export const furMajestyMessages = [
  "Time to care for your furry friend – wellness starts here! 🐾",
  "Your pet’s health journey continues today. 💖",
  "Because every tail wag and purr deserves the best care. 🌟",
  "Stay on top of your pet’s routine – you’ve got this! 💪",
  "Another step toward a happy, healthy companion. 🐕🐈",
  "Your pet’s wellness is your superpower. 🦸",
  "Daily care = lifelong love. 💝",
  "Keep your furry family member thriving, one step at a time. ✨",
  "Health first! Your pet depends on you. 🩺",
  "Consistency is love in action. 🐾",
  "Your best friend deserves the best care – always. 👑"
];

// Utility to grab a random brand message
export const getRandomFurMajestyMessage = () => {
  return furMajestyMessages[
    Math.floor(Math.random() * furMajestyMessages.length)
  ];
};
